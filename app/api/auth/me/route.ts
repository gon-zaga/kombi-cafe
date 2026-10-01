import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import pool from "@/app/lib/db";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production"
);

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId;

    // Fetch fresh user data from database
    const result = await pool.query(
      `SELECT user_id, username, role, first_name, last_name
       FROM staff
       WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const staff = result.rows[0];

    return NextResponse.json({
      user: {
        userId: staff.user_id,
        username: staff.username,
        role: staff.role,
        firstName: staff.first_name,
        lastName: staff.last_name,
      },
    });
  } catch {
    return NextResponse.json({ user: null }, { status: 401 });
  }
}