import { NextResponse } from "next/server";
import pool from "@/app/lib/db";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production"
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `SELECT user_id, username, password_hash, role, first_name, last_name
       FROM staff
       WHERE username = $1`,
      [username]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    const staff = result.rows[0];
    const isValid = await bcrypt.compare(password, staff.password_hash);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    const token = await new SignJWT({
      userId: staff.user_id,
      username: staff.username,
      role: staff.role,
      firstName: staff.first_name,
      lastName: staff.last_name,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("8h")
      .sign(JWT_SECRET);

    const response = NextResponse.json({
      user: {
        userId: staff.user_id,
        username: staff.username,
        role: staff.role,
        firstName: staff.first_name,
        lastName: staff.last_name,
      },
    });

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 8, // 8 hours
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login failed:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}