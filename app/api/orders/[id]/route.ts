// Updates one order's status (pending -> preparing -> ready -> completed) for
// the barista dashboard
import pool from "@/app/lib/db";
import { NextRequest, NextResponse } from "next/server";

// Must stay in sync with the CHECK constraint on orders.status. 'completed' is
// the terminal state: the customer has the drink, and the row is kept for
// sales history rather than deleted.
const VALID_STATUSES = ["pending", "preparing", "ready", "completed"] as const;
type OrderStatus = (typeof VALID_STATUSES)[number];

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

  try {
    const result = await pool.query(
      `UPDATE orders
       SET status = $1
       WHERE id = $2
       RETURNING id, daily_number, status, total`,
      [status, orderId]
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