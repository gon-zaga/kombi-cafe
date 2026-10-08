// Handles order submission: creates an order + its items/add-ons from a client-submitted cart,
// with prices re-looked-up server-side (never trusted from the client) and the whole
// insert sequence run as one transaction so a failure partway rolls everything back
import { NextResponse } from "next/server";
import pool from "@/app/lib/db";
import type { PoolClient } from "pg";
import type { OrderSummary } from "@/app/lib/types";

interface PlaceOrderPayload {
  table_number: number;
  items: {
    itemId: number;
    sizeId: number;
    quantity: number;
    addOnIds: number[];
  }[];
  // How the customer intends to pay. 'gcash' requires a reference number;
  // the server rejects a GCash order without one. No payment is actually
  // taken -- the staff handles the payment at the counter.
  payment_method?: 'counter' | 'gcash';
  gcash_reference?: string | null;
}

// Which recipe rows apply to a given item + size, and how much each costs.
// No trailing semicolon: this string is also embedded as a subquery.
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
  GROUP BY i.id, i.name, i.unit, i.stock_qty
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

// Today in Manila as "YYYY-MM-DD". The DB's CURRENT_DATE would be UTC, which
// rolls over at 8 AM Manila time, so the app's day boundaries are computed here
// from an explicit Manila date instead.
function manilaToday(): string {
  // formatToParts instead of relying on en-CA's date shape: the parts are read
  // explicitly, so this can't silently change with the ICU data
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

// Adds (or subtracts) whole days to a "YYYY-MM-DD" string. Done in UTC because
// these are plain calendar dates with no time or zone attached.
function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// True for a real "YYYY-MM-DD" calendar date that survives a round trip, which
// rejects values like 2026-02-31 that Date.parse would otherwise roll over
function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

// Named ranges, resolved to concrete Manila dates so the query is one simple
// BETWEEN. null means unbounded on that side, which is what "all" needs.
function resolveRange(range: string): { from: string | null; to: string | null } | null {
  const today = manilaToday();
  const yearStart = `${today.slice(0, 4)}-01-01`;

  switch (range) {
    case "today":
      return { from: today, to: today };
    case "yesterday":
      return { from: addDays(today, -1), to: addDays(today, -1) };
    case "week":
      return { from: addDays(today, -6), to: today };
    case "month":
      return { from: addDays(today, -29), to: today };
    case "year":
      return { from: yearStart, to: today };
    case "all":
      return { from: null, to: null };
    default:
      return null;
  }
}

// Lists orders with their items and add-ons.
// Supports ?range=today|yesterday|week|month|year|all, OR ?from=YYYY-MM-DD&to=YYYY-MM-DD
// for an exact window, plus an optional ?status=.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  const status = searchParams.get("status");

  let from: string | null = null;
  let to: string | null = null;

  // An explicit window wins over ?range, but both dates must be present and sane
  if (fromParam !== null || toParam !== null) {
    if (!fromParam || !toParam) {
      return NextResponse.json(
        { error: "Both 'from' and 'to' are required" },
        { status: 400 }
      );
    }
    if (!isValidIsoDate(fromParam) || !isValidIsoDate(toParam)) {
      return NextResponse.json(
        { error: "Dates must be in YYYY-MM-DD format" },
        { status: 400 }
      );
    }
    if (fromParam > toParam) {
      return NextResponse.json(
        { error: "'from' must be on or before 'to'" },
        { status: 400 }
      );
    }
    from = fromParam;
    to = toParam;
  } else {
    const range = searchParams.get("range") ?? "today";
    const resolved = resolveRange(range);
    if (!resolved) {
      return NextResponse.json({ error: "Invalid range" }, { status: 400 });
    }
    from = resolved.from;
    to = resolved.to;
  }

  if (status !== null && !["pending", "preparing", "ready", "completed"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    const result = await pool.query(
      `
      SELECT
        o.id,
        o.daily_number,
        o.status,
        o.table_number,
        -- created_at is stored as UTC without a zone; tag it so JS reads the right moment
        (o.created_at AT TIME ZONE 'UTC') AS created_at,
        o.total,
        o.payment_method,
        o.gcash_reference,
        COALESCE(
          json_agg(
            json_build_object(
              'name', mi.name,
              'size', s.label,
              'quantity', oi.quantity,
              'unitPrice', oi.unit_price,
              'addOns', (
                SELECT COALESCE(json_agg(
                  json_build_object(
                    'name', a.name,
                    -- oia.price is the snapshot charged at order time
                    'price', oia.price,
                    'quantity', oia.quantity
                  ) ORDER BY oia.id
                ), '[]'::json)
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
      WHERE ($1::date IS NULL OR o.order_date >= $1::date)
        AND ($2::date IS NULL OR o.order_date <= $2::date)
        AND ($3::text IS NULL OR o.status = $3)
      GROUP BY o.id
      ORDER BY o.created_at DESC
      `,
      [from, to, status]
    );

    const orders: OrderSummary[] = result.rows.map((row) => ({
      id: row.id,
      orderReference: String(row.daily_number).padStart(4, "0"),
      status: row.status,
      tableNumber: row.table_number,
      createdAt: new Date(row.created_at).toISOString(),
      total: Number(row.total),
      paymentMethod: row.payment_method,
      gcashReference: row.gcash_reference,
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

    // The café has 7 tables (see app/table-select/page.tsx), so a valid
    // table number is a whole number in that range
    if (!Number.isInteger(body.table_number) || body.table_number < 1 || body.table_number > 7) {
      return NextResponse.json(
        { error: "A table number between 1 and 7 is required" },
        { status: 400 }
      );
    }

    // Payment method is counter cash or GCash. A GCash order must carry a
    // reference number the customer reads from their GCash app -- the
    // staff still handles the actual payment at the counter, so nothing
    // is charged here, but the reference is what they check against.
    const paymentMethod = body.payment_method === 'gcash' ? 'gcash' : 'counter';
    const gcashReference =
      paymentMethod === 'gcash'
        ? (body.gcash_reference ?? '').trim()
        : null;

    if (paymentMethod === 'gcash' && (gcashReference ?? '').length === 0) {
      return NextResponse.json(
        { error: "A GCash reference number is required" },
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
          INSERT INTO orders (daily_number, order_date, total, status, table_number, payment_method, gcash_reference)
          VALUES ($1, (NOW() AT TIME ZONE 'Asia/Manila')::date, 0, 'pending', $2, $3, $4)
          RETURNING id;
          `,
        [dailyNumber, body.table_number, paymentMethod, gcashReference]
      );

      const orderId = orderResult.rows[0].id;

      let runningTotal = 0;

      // step 3 + 4: price each item and add-on server-side
      for (const item of body.items) {
        // Availability is re-read here, inside the transaction, rather than
        // trusted from the cart: the UI blocks unavailable items, but a cart can
        // sit open while the owner switches something off, and the stale item id
        // would otherwise still be accepted.
        const priceResult = await client.query(
          `SELECT mis.price, mi.name, mi.is_available
           FROM menu_item_sizes AS mis
           JOIN menu_items AS mi ON mi.id = mis.menu_item_id
           WHERE mis.menu_item_id = $1 AND mis.size_id = $2;`,
          [item.itemId, item.sizeId]
        );

        if (priceResult.rows.length === 0) {
          throw new Error(`No price found for itemId ${item.itemId}, sizeId ${item.sizeId}`);
        }

        if (priceResult.rows[0].is_available !== true) {
          // Same prefix convention as the stock shortage so the catch below can
          // tell a customer-facing refusal from a server fault
          throw new Error(`Unavailable: ${priceResult.rows[0].name}`);
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

      // order_id is the raw orders.id (a stable database key), orderReference is
      // the human daily number the queue display and confirmation page show.
      // Both are returned so a caller can key on one or display the other.
      return NextResponse.json(
        {
          message: "Order placed successfully",
          order_id: orderId,
          orderReference,
          table_number: body.table_number,
          status: 'pending',
          total: runningTotal,
          payment_method: paymentMethod,
          gcash_reference: gcashReference
        },
        { status: 201 }
      );
    } catch (error) {
      await client.query('ROLLBACK');
      console.error("Failed to place order:", error);

      // Stock shortage and unavailable items are expected outcomes, not server
      // faults: both messages are safe (and useful) to show the customer.
      if (
        error instanceof Error &&
        (error.message.startsWith('Not enough stock:') ||
          error.message.startsWith('Unavailable:'))
      ) {
        return NextResponse.json(
          {
            error: error.message.startsWith('Unavailable:')
              ? `${error.message.slice('Unavailable:'.length)} is no longer available. Please remove it from your order.`
              : error.message,
          },
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