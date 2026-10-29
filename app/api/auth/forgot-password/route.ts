import { NextResponse } from "next/server";
import pool from "@/app/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username } = body;

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    const name = String(username).trim().toLowerCase();

    const result = await pool.query(
      `SELECT user_id, username, role
       FROM staff
       WHERE LOWER(username) = $1 AND role = 'barista'`,
      [name]
    );

    const staff = result.rows[0];

    if (!staff) {
      return NextResponse.json({ success: true });
    }

    const existingRequest = await pool.query(
      `SELECT id FROM password_reset_requests
       WHERE user_id = $1 AND status = 'pending'`,
      [staff.user_id]
    );

    if (existingRequest.rows.length > 0) {
      return NextResponse.json({ success: true });
    }

    await pool.query(
      `INSERT INTO password_reset_requests (user_id, status)
       VALUES ($1, 'pending')`,
      [staff.user_id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Forgot password failed:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}