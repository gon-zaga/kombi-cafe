import { NextResponse } from "next/server";
import pool from "@/app/lib/db";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const result = await pool.query(
      `SELECT user_id, username, role, first_name, last_name, started_at, birthdate, created_at
       FROM staff
       ORDER BY created_at DESC`
    );
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Failed to fetch staff:", error);
    return NextResponse.json({ error: "Failed to fetch staff" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password, role, first_name, last_name, started_at, birthdate } = body;

    if (!username || !password || !role) {
      return NextResponse.json(
        { error: "Username, password, and role are required" },
        { status: 400 }
      );
    }

    if (!["barista", "owner"].includes(role)) {
      return NextResponse.json(
        { error: "Role must be 'barista' or 'owner'" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO staff (username, password_hash, role, first_name, last_name, started_at, birthdate)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING user_id, username, role, first_name, last_name, started_at, birthdate, created_at`,
      [username, passwordHash, role, first_name || null, last_name || null, started_at || null, birthdate || null]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error("Failed to create staff:", error);
    if (error instanceof Error && error.message.includes("duplicate key")) {
      return NextResponse.json({ error: "Username already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create staff" }, { status: 500 });
  }
}