import { NextResponse } from "next/server";
import pool from "@/app/lib/db";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { checkRateLimit, recordFailedAttempt, clearAttempts, formatLockTime, getLockDuration } from "@/app/lib/rateLimit";

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

    // Get client IP
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() 
      || request.headers.get("x-real-ip") 
      || "unknown";

    // Check rate limit
    const rateLimit = checkRateLimit(ip, username);
    if (!rateLimit.allowed && rateLimit.remainingTime) {
      return NextResponse.json(
        { 
          error: `Too many failed attempts. Try again in ${formatLockTime(rateLimit.remainingTime)}.`,
          locked: true,
          retryAfter: Math.ceil(rateLimit.remainingTime / 1000)
        },
        { status: 429 }
      );
    }

    const result = await pool.query(
      `SELECT user_id, username, password_hash, role, first_name, last_name
       FROM staff
       WHERE username = $1`,
      [username]
    );

    if (result.rows.length === 0) {
      // Record failed attempt even for non-existent users (but don't reveal if user exists)
      recordFailedAttempt(ip, username);
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    const staff = result.rows[0];
    const isValid = await bcrypt.compare(password, staff.password_hash);

    if (!isValid) {
      // Record failed attempt
      const lockInfo = recordFailedAttempt(ip, username);
      const lockDuration = getLockDuration(lockInfo.attemptCount);
      
      if (lockDuration > 0) {
        return NextResponse.json(
          { 
            error: `Invalid username or password. Account locked for ${formatLockTime(lockDuration)} after ${lockInfo.attemptCount} failed attempts.`,
            locked: true,
            retryAfter: Math.ceil(lockDuration / 1000)
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    // Success - clear failed attempts
    clearAttempts(ip, username);

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