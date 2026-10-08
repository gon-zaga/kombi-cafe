// Updates one order's status (pending -> preparing -> ready -> completed) for
// the barista dashboard
import pool from "@/app/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

// Must stay in sync with the CHECK constraint on orders.status. 'completed' is
// the terminal state: the customer has the drink, and the row is kept for
// sales history rather than deleted.
const VALID_STATUSES = ["pending", "preparing", "ready", "completed"] as const;
type OrderStatus = (typeof VALID_STATUSES)[number];

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production"
);

async function getCurrentUserId(): Promise<number | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return Number(payload.userId);
  } catch {
    return null;
  }
}

// Returns one order with its full receipt detail (items, add-on
// amounts), the same shape GET /api/orders uses per row. The
// confirmation page reads this so the receipt shows the stored
// record, not values carried in a URL.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const orderId = Number(id);

  if (isNaN(orderId)) {
    return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
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
                     'price', oia.price,
                     'quantity', oia.quantity
                   ) ORDER BY oia.id
                 ), '[]'::json)
                 FROM order_item_addons oia
                 JOIN add_ons a ON a.id = oia.add_on_id
                 WHERE oia.order_item_id = oi.id
               ),
               'ingredients', (
                 SELECT COALESCE(json_agg(ing.name ORDER BY ing.id), '[]'::json)
                 FROM recipes r
                 JOIN ingredients ing ON ing.id = r.ingredient_id
                 WHERE r.menu_item_id = mi.id
               )
             ) ORDER BY oi.id
           ) FILTER (WHERE oi.id IS NOT NULL),
           '[]'::json
         ) AS items
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       LEFT JOIN menu_items mi ON mi.id = oi.menu_item_id
       LEFT JOIN sizes s ON s.id = oi.size_id
       WHERE o.id = $1
       GROUP BY o.id
       `,
       [orderId]
     );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const row = result.rows[0];

    return NextResponse.json({
      id: row.id,
      orderReference: String(row.daily_number).padStart(4, "0"),
      status: row.status,
      tableNumber: row.table_number,
      createdAt: new Date(row.created_at).toISOString(),
      total: Number(row.total),
      paymentMethod: row.payment_method,
      gcashReference: row.gcash_reference,
      items: row.items,
    });
  } catch (error) {
    console.error("Failed to fetch order:", error);
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const orderId = Number(id);

  if (isNaN(orderId)) {
    return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
  }

  let body: { status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const status = body.status;

  // Reject anything that isn't one of the four known statuses, so a typo
  // from the client can't push a value the CHECK constraint would reject anyway
  if (!status || !VALID_STATUSES.includes(status as OrderStatus)) {
    return NextResponse.json(
      { error: `Status must be one of: ${VALID_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  // When marking as completed, record which barista processed it
  const processedBy = status === "completed" ? await getCurrentUserId() : null;

  try {
    const result = await pool.query(
      `UPDATE orders
       SET status = $1,
           processed_by = COALESCE($2, processed_by)
       WHERE id = $3
       RETURNING id, daily_number, status, total, processed_by`,
      [status, processedBy, orderId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const row = result.rows[0];

    return NextResponse.json({
      id: row.id,
      orderReference: String(row.daily_number).padStart(4, "0"),
      status: row.status,
      total: Number(row.total),
      processedBy: row.processed_by,
    });
  } catch (error) {
    console.error("Failed to update order status:", error);

    // 23514 is a check_violation: the value passed our own VALID_STATUSES check
    // but the database's CHECK constraint still rejects it. In practice that
    // means a status was added to the app before the schema was migrated, so the
    // message names that instead of returning a bare 500.
    const code = (error as { code?: string }).code;
    if (code === "23514") {
      return NextResponse.json(
        {
          error: `Database rejected status "${status}". The orders.status CHECK constraint has not been updated yet.`,
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update order status" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const orderId = Number(id);

  if (isNaN(orderId)) {
    return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
  }

  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await pool.query('BEGIN');

    // Delete from order_item_addons first
    await pool.query(
      `DELETE FROM order_item_addons oia USING order_items oi WHERE oia.order_item_id = oi.id AND oi.order_id = $1`,
      [orderId]
    );

    // Delete from order_items
    await pool.query(
      `DELETE FROM order_items WHERE order_id = $1`,
      [orderId]
    );

    // Delete from orders
    const result = await pool.query(
      `DELETE FROM orders WHERE id = $1 RETURNING id`,
      [orderId]
    );

    if (result.rows.length === 0) {
      await pool.query('ROLLBACK');
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    await pool.query('COMMIT');
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error("Failed to delete order:", error);
    return NextResponse.json(
      { error: "Failed to delete order" },
      { status: 500 }
    );
  }
}