// Handles order submission: creates an order + its items/add-ons from a client-submitted cart,
// with prices re-looked-up server-side (never trusted from the client) and the whole
// insert sequence run as one transaction so a failure partway rolls everything back
import { NextResponse } from "next/server";
import pool from "@/app/lib/db";
import type { PoolClient } from "pg";
import type { OrderSummary } from "@/app/lib/types";

interface PlaceOrderPayload {
  items: {
    itemId: number;
    sizeId: number;
    quantity: number;
    addOnIds: number[];
  }[];
}

// Which recipe rows apply to a given item + size, and how much each costs.
// Shared by the check and the update so the two can never disagree.
const recipeCostSql = `
  SELECT i.id, i.name, i.unit, i.stock_qty,
         SUM(r.quantity_needed) * $3::numeric AS needed
  FROM recipes r
  JOIN ingredients i ON i.id = r.ingredient_id
  WHERE r.menu_item_id = $1
    AND (r.size_id = $2 OR r.size_id IS NULL)
    AND NOT EXISTS (
      SELECT 1 FROM recipes r2
      WHERE r2.menu_item_id = r.menu_item_id
        AND r2.size_id = $2
        AND r2.ingredient_id = r.ingredient_id
    )
  GROUP BY i.id, i.name, i.unit, i.stock_qty;
`;

// Removes stock for one ordered item's recipe. Throws (which rolls the whole
// transaction back) when an ingredient can't cover the order, rather than
// letting stock go negative or silently clamping to zero.
async function deductRecipeStock(
  client: PoolClient,
  menuItemId: number,
  sizeId: number,
  quantity: number
) {
  const costResult = await client.query(recipeCostSql, [
    menuItemId,
    sizeId,
    quantity,
  ]);

  // No recipes on this item, so nothing to deduct
  if (costResult.rows.length === 0) return;

  // Check everything before changing anything, so a failure can't leave
  // some ingredients deducted and others not
  const short = costResult.rows.filter(
    (row) => Number(row.stock_qty) < Number(row.needed)
  );

  if (short.length > 0) {
    throw new Error(
      `Not enough stock: ${short
        .map(
          (r) =>
            `${r.name} (needs ${Number(r.needed)}, have ${Number(r.stock_qty)} ${r.unit})`
        )
        .join(', ')}`
    );
  }

  await client.query(
    `
    UPDATE ingredients i
    SET stock_qty = i.stock_qty - c.needed,
        updated_at = CURRENT_TIMESTAMP
    FROM (${recipeCostSql}) c
    WHERE i.id = c.id;
    `,
    [menuItemId, sizeId, quantity]
  );
}

// Lists orders with their items and add-ons; supports ?range=today|week|month|all and optional ?status=
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") ?? "today";
  const status = searchParams.get("status");

  // Value = how many days BEFORE today to include, so:
  //   today = 0  -> today only
  //   week  = 6  -> last 7 days including today
  //   month = 29 -> last 30 days including today
  const daysBack: Record<string, number | null> = { today: 0, week: 6, month: 29, all: null };
  if (!(range in daysBack)) {
    return NextResponse.json({ error: "Invalid range" }, { status: 400 });
  }
  if (status !== null && !["pending", "preparing", "ready"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    const result = await pool.query(
      `
      SELECT
        o.id,
        o.daily_number,
        o.status,
        -- created_at is stored as UTC without a zone; tag it so JS reads the right moment
        (o.created_at AT TIME ZONE 'UTC') AS created_at,
        o.total,
        COALESCE(
          json_agg(
            json_build_object(
              'name', mi.name,
              'size', s.label,
              'quantity', oi.quantity,
              'unitPrice', oi.unit_price,
              'addOns', (
                SELECT COALESCE(json_agg(a.name), '[]'::json)
                FROM order_item_addons oia
                JOIN add_ons a ON a.id = oia.add_on_id
                WHERE oia.order_item_id = oi.id
              )
            ) ORDER BY oi.id
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'::json
        ) AS items
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN menu_items mi ON mi.id = oi.menu_item_id
      LEFT JOIN sizes s ON s.id = oi.size_id
      WHERE ($1::int IS NULL OR o.order_date >= (NOW() AT TIME ZONE 'Asia/Manila')::date - $1::int)
        AND ($2::text IS NULL OR o.status = $2)
      GROUP BY o.id
      ORDER BY o.created_at DESC
      `,
      [daysBack[range], status]
    );

    const orders: OrderSummary[] = result.rows.map((row) => ({
      id: row.id,
      orderReference: String(row.daily_number).padStart(4, "0"),
      status: row.status,
      createdAt: new Date(row.created_at).toISOString(),
      total: Number(row.total),
      items: row.items,
    }));

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body: PlaceOrderPayload = await request.json();

    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: "Order must contain at least one item" },
        { status: 400 }
      );
    }

    // One client so BEGIN/COMMIT/ROLLBACK all run on the same connection
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // step 1: bump today's counter (or create it) and get this order's number
      const dailyNumberResult = await client.query(`
        INSERT INTO daily_counters (order_date, last_number)
        VALUES ((NOW() AT TIME ZONE 'Asia/Manila')::date, 1)
        ON CONFLICT (order_date)
        DO UPDATE SET last_number = daily_counters.last_number + 1
        RETURNING last_number;
        `);

      const dailyNumber = dailyNumberResult.rows[0].last_number;

      // step 2: insert the order with a placeholder total of 0
      const orderResult = await client.query(
        `
          INSERT INTO orders (daily_number, order_date, total, status)
          VALUES ($1, (NOW() AT TIME ZONE 'Asia/Manila')::date, 0, 'pending')
          RETURNING id;
          `,
        [dailyNumber]
      );

      const orderId = orderResult.rows[0].id;

      let runningTotal = 0;

      // step 3 + 4: price each item and add-on server-side
      for (const item of body.items) {
        const priceResult = await client.query(
          `SELECT price FROM menu_item_sizes WHERE menu_item_id = $1 AND size_id = $2;`,
          [item.itemId, item.sizeId]
        );

        if (priceResult.rows.length === 0) {
          throw new Error(`No price found for itemId ${item.itemId}, sizeId ${item.sizeId}`);
        }

        const unitPrice = Number(priceResult.rows[0].price);
        runningTotal += unitPrice * item.quantity;

        const orderItemResult = await client.query(
          `
          INSERT INTO order_items (order_id, menu_item_id, size_id, quantity, unit_price)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id;
          `,
          [orderId, item.itemId, item.sizeId, item.quantity, unitPrice]
        );

        const orderItemId = orderItemResult.rows[0].id;

        // Deduct recipe ingredients before the order can commit. A size-specific
        // recipe overrides the general "all sizes" row for the same ingredient,
        // so the two never stack.
        await deductRecipeStock(
          client,
          item.itemId,
          item.sizeId,
          item.quantity
        );

        for (const addOnId of item.addOnIds) {
          const addOnPriceResult = await client.query(
            `SELECT price FROM add_ons WHERE id = $1;`,
            [addOnId]
          );

          if (addOnPriceResult.rows.length === 0) {
            throw new Error(`No add-on found for id ${addOnId}`);
          }

          const addOnPrice = Number(addOnPriceResult.rows[0].price);
          runningTotal += addOnPrice * item.quantity;

          await client.query(
            `
            INSERT INTO order_item_addons (order_item_id, add_on_id, quantity, price)
            VALUES ($1, $2, $3, $4);
            `,
            [orderItemId, addOnId, 1, addOnPrice]
          );
        }
      }

      // Set the real total now that everything is priced
      await client.query(
        `UPDATE orders SET total = $1 WHERE id = $2;`,
        [runningTotal, orderId]
      );

      await client.query('COMMIT');

      const orderReference = String(dailyNumber).padStart(4, '0');

      return NextResponse.json(
        { message: "Order placed successfully", orderReference, total: runningTotal },
        { status: 201 }
      );
    } catch (error) {
      await client.query('ROLLBACK');
      console.error("Failed to place order:", error);

      // Stock shortage is an expected outcome, not a server fault: the message
      // thrown by deductRecipeStock is safe (and useful) to show the customer.
      if (error instanceof Error && error.message.startsWith('Not enough stock:')) {
        return NextResponse.json(
          { error: error.message },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: "Failed to place order" },
        { status: 500 }
      );
    } finally {
      client.release();
    }
  } catch (error) {
    // Malformed JSON body or anything else before we reach the database
    console.error("Failed to process order request:", error);
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}