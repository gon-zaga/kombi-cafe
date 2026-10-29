import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import pool from "@/app/lib/db";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production"
);

async function verifyOwner(): Promise<number | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) return null;

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as number;
    const role = payload.role as string;

    if (role !== "owner") return null;

    return userId;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const ownerId = await verifyOwner();

    if (!ownerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await pool.query(
      `SELECT prr.id, prr.user_id, prr.requested_at, prr.status,
              s.username, s.first_name, s.last_name
       FROM password_reset_requests prr
       JOIN staff s ON s.user_id = prr.user_id
       WHERE prr.status = 'pending'
       ORDER BY prr.requested_at ASC`
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Failed to fetch password reset requests:", error);
    return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
  }
}