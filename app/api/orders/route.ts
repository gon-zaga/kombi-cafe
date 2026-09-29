// Handles order submission: creates an order + its items/add-ons from a client-submitted cart,
// with prices re-looked-up server-side (never trusted from the client) and the whole
// insert sequence run as one transaction so a failure partway rolls everything back
import { NextResponse } from "next/server";
import pool from "@/app/lib/db";
import type { OrderSummary } from "@/app/lib/types";

// Defining the expected structure of the incoming request
interface PlaceOrderPayload {
  items: {
    itemId: number;
    sizeId: number;
    quantity: number;
    addOnIds: number[];
  }[];
}

// app/api/orders/route.ts

// GET is used to retrieve orders from the database.
// Lists orders with their items and add-ons; supports ?range=today|week|month|all and optional ?status=
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") ?? "today";
  const status = searchParams.get("status");

  // Whitelist inputs instead of trusting the query string
  const daysBack: Record<string, number | null> = { today: 0, week: 7, month: 30, all: null };
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
      items: row.items, // json_agg already arrives as a parsed JS array
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

    // validation
    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: "Order must contain atleast one item" },
        { status: 400 }
      );
    }

    // Check out a single client so every query below runs on the same
    // connection — required for BEGIN/COMMIT/ROLLBACK to actually work together
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // step 1: atomically bump today's daily_counters row (or create it if this
      // is the first order today), and get back the number this order should use
      const dailyNumberResult = await client.query(`
        INSERT INTO daily_counters (order_date, last_number)
        VALUES ((NOW() AT TIME ZONE 'Asia/Manila')::date, 1)
        ON CONFLICT (order_date)
        DO UPDATE SET last_number = daily_counters.last_number + 1
        RETURNING last_number;      
        `);

      const dailyNumber = dailyNumberResult.rows[0].last_number;

      // step 2: insert the orders row itself. total starts at 0 as a placeholder —
      // we don't know the real total until every item/add-on below is priced
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

      // step 3 + 4: for each cart item, re-look-up its real price, insert its
      // order_items row, then loop its add-ons and do the same for each of those
      for (const item of body.items) {
        // Re-look-up the current price for this item+size — never trust a price
        // sent from the client, since menu prices can change after the client fetched them
        const priceResult = await client.query(
          `SELECT price FROM menu_item_sizes WHERE menu_item_id = $1 AND size_id = $2;`,
          [item.itemId, item.sizeId]
        );

        if (priceResult.rows.length === 0) {
          throw new Error(`No price found for itemId ${item.itemId}, sizeId ${item.sizeId}`);
        }

        const unitPrice = Number(priceResult.rows[0].price);
        runningTotal += unitPrice * item.quantity;

        // step 3: insert this cart line as an order_items row, snapshotting unitPrice
        // so this order stays accurate even if the menu price changes later
        const orderItemResult = await client.query(
          `
          INSERT INTO order_items (order_id, menu_item_id, size_id, quantity, unit_price)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id;
          `,
          [orderId, item.itemId, item.sizeId, item.quantity, unitPrice]
        );

        const orderItemId = orderItemResult.rows[0].id;

        // step 4: insert one order_item_addons row per add-on selected on this item
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

      // Now that every item/add-on has been priced, go back and set the real total
      await client.query(
        `UPDATE orders SET total = $1 WHERE id = $2;`,
        [runningTotal, orderId]
      );

      await client.query('COMMIT');

      // Format daily_number the same way the rest of the app displays reference numbers (e.g. 0001)
      const orderReference = String(dailyNumber).padStart(4, '0');

      return NextResponse.json(
        { message: "Order placed successfully", orderReference, total: runningTotal },
        { status: 201 }
      );
    } catch (error) {
      // Something failed partway through the insert sequence — undo everything
      // that happened after BEGIN so no half-finished order survives
      await client.query('ROLLBACK');
      console.error("Failed to place order:", error);
      return NextResponse.json(
        { error: "Failed to place order" },
        { status: 500 }
      );
    } finally {
      // Always return the connection to the pool, whether we succeeded or failed
      client.release();
    }
  } catch (error) {
    // Catches request.json() failures (malformed JSON body) or anything else
    // that goes wrong before we even reach the database
    console.error("Failed to process order request:", error);
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 500 }
    );
  }
}