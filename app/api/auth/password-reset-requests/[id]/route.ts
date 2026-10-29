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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ownerId = await verifyOwner();

    if (!ownerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (status !== "completed") {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const result = await pool.query(
      `UPDATE password_reset_requests
       SET status = 'completed', completed_at = NOW()
       WHERE id = $1 AND status = 'pending'
       RETURNING id, user_id, requested_at, status, completed_at`,
      [Number(id)]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Request not found or already completed" }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Failed to update password reset request:", error);
    return NextResponse.json({ error: "Failed to update request" }, { status: 500 });
  }
}