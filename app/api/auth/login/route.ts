// Staff login with escalating lockouts tracked per typed username in login_lockouts
import { NextResponse } from "next/server";
import pool from "@/app/lib/db";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production"
);

const RESET_AFTER_MS = 30 * 60 * 1000;
const DURATIONS = [30, 60, 180, 300, 1800]; // seconds: 5th, 10th, 15th, 20th, 25th+ failure

// Dummy hash so unknown usernames cost the same time as wrong passwords
const DUMMY_HASH = "$2b$12$CwTycUXWue0Thq9StjUM0uJ8.4rU0Zk1p3sQxk0h5Hq5vJ1cX2y6e";

function lockSeconds(count: number): number {
  if (count < 5 || count % 5 !== 0) return 0;
  return DURATIONS[Math.min(count / 5 - 1, DURATIONS.length - 1)];
}

function formatSeconds(s: number): string {
  if (s < 60) return `${s} second${s !== 1 ? "s" : ""}`;
  const m = Math.ceil(s / 60);
  return `${m} minute${m !== 1 ? "s" : ""}`;
}

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
    }

    const name = String(username).trim().toLowerCase();
    const now = Date.now();

    // Lockout state is keyed by the typed username, whether or not it exists
    const lockRes = await pool.query(
      `SELECT failed_attempts, locked_until, last_failed_at
       FROM login_lockouts WHERE username = $1`,
      [name]
    );
    const lock = lockRes.rows[0];

    // Still locked: refuse without counting
    if (lock?.locked_until && new Date(lock.locked_until).getTime() > now) {
      const remaining = Math.ceil((new Date(lock.locked_until).getTime() - now) / 1000);
      return NextResponse.json(
        {
          error: `Too many failed attempts. Try again in ${formatSeconds(remaining)}.`,
          locked: true,
          retryAfter: remaining,
          attemptCount: lock.failed_attempts,
        },
        { status: 429 }
      );
    }

    const result = await pool.query(
      `SELECT user_id, username, password_hash, role, first_name, last_name
       FROM staff WHERE LOWER(username) = $1`,
      [name]
    );
    const staff = result.rows[0];

    const isValid = await bcrypt.compare(password, staff?.password_hash ?? DUMMY_HASH);

    if (!staff || !isValid) {
      // Forget old failures after 30 minutes of quiet
      const stale =
        !lock?.last_failed_at || now - new Date(lock.last_failed_at).getTime() > RESET_AFTER_MS;
      const count = (stale ? 0 : lock?.failed_attempts ?? 0) + 1;
      const secs = lockSeconds(count);

      await pool.query(
        `INSERT INTO login_lockouts (username, failed_attempts, last_failed_at, locked_until)
         VALUES ($1, $2, NOW(), $3)
         ON CONFLICT (username) DO UPDATE SET
           failed_attempts = $2, last_failed_at = NOW(), locked_until = $3`,
        [name, count, secs > 0 ? new Date(now + secs * 1000) : null]
      );

      if (secs > 0) {
        return NextResponse.json(
          {
            error: `Invalid username or password. Locked for ${formatSeconds(secs)} after ${count} failed attempts.`,
            locked: true,
            retryAfter: secs,
            attemptCount: count,
          },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: "Invalid username or password", attemptCount: count },
        { status: 401 }
      );
    }

    // Success: clear the lockout record
    await pool.query(`DELETE FROM login_lockouts WHERE username = $1`, [name]);

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
      maxAge: 60 * 60 * 8,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login failed:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}