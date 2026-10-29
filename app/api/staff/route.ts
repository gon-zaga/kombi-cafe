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

function validateName(name: string | null): string | null {
  if (!name) return null;
  if (/\d/.test(name)) {
    return "Name cannot contain numbers";
  }
  if (!/^[a-zA-Z\s-]+$/.test(name)) {
    return "Name can only contain letters, spaces, and hyphens";
  }
  return null;
}

function validateAge(birthdate: string | null): string | null {
  if (!birthdate) return null;
  const birth = new Date(birthdate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  if (age < 18) {
    return "Staff must be at least 18 years old";
  }
  return null;
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

    const firstNameError = validateName(first_name);
    if (firstNameError) {
      return NextResponse.json({ error: firstNameError }, { status: 400 });
    }

    const lastNameError = validateName(last_name);
    if (lastNameError) {
      return NextResponse.json({ error: lastNameError }, { status: 400 });
    }

    const ageError = validateAge(birthdate);
    if (ageError) {
      return NextResponse.json({ error: ageError }, { status: 400 });
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