import { NextResponse } from "next/server";
import pool from "@/app/lib/db";
import bcrypt from "bcryptjs";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const body = await request.json();
    const { username, password, role, first_name, last_name, started_at, birthdate } = body;

    const fields: string[] = [];
    const values: (string | number | null)[] = [];
    let idx = 1;

    if (username !== undefined) {
      fields.push(`username = $${idx++}`);
      values.push(username);
    }
    if (password !== undefined) {
      if (password.length < 6) {
        return NextResponse.json(
          { error: "Password must be at least 6 characters" },
          { status: 400 }
        );
      }
      const passwordHash = await bcrypt.hash(password, 12);
      fields.push(`password_hash = $${idx++}`);
      values.push(passwordHash);
    }
    if (role !== undefined) {
      if (!["barista", "owner"].includes(role)) {
        return NextResponse.json(
          { error: "Role must be 'barista' or 'owner'" },
          { status: 400 }
        );
      }
      fields.push(`role = $${idx++}`);
      values.push(role);
    }
    if (first_name !== undefined) {
      fields.push(`first_name = $${idx++}`);
      values.push(first_name);
    }
    if (last_name !== undefined) {
      fields.push(`last_name = $${idx++}`);
      values.push(last_name);
    }
    if (started_at !== undefined) {
      fields.push(`started_at = $${idx++}`);
      values.push(started_at);
    }
    if (birthdate !== undefined) {
      fields.push(`birthdate = $${idx++}`);
      values.push(birthdate);
    }

    if (fields.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    values.push(Number(userId));

    const result = await pool.query(
      `UPDATE staff SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $${idx}
       RETURNING user_id, username, role, first_name, last_name, started_at, birthdate, created_at`,
      values
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Failed to update staff:", error);
    if (error instanceof Error && error.message.includes("duplicate key")) {
      return NextResponse.json({ error: "Username already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to update staff" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    const result = await pool.query(
      `DELETE FROM staff WHERE user_id = $1 RETURNING user_id`,
      [Number(userId)]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Staff deleted" });
  } catch (error) {
    console.error("Failed to delete staff:", error);
    return NextResponse.json({ error: "Failed to delete staff" }, { status: 500 });
  }
}