// Login rate limiting stored in Postgres so it works on serverless hosts (Netlify)
import pool from "@/app/lib/db";

const RESET_AFTER_MS = 30 * 60 * 1000; // forget failures after 30 min of no attempts
const DURATIONS = [30_000, 60_000, 180_000, 300_000, 1_800_000];

let tableReady = false;
async function ensureTable() {
  if (tableReady) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS login_attempts (
      attempt_key TEXT PRIMARY KEY,
      count INTEGER NOT NULL DEFAULT 0,
      locked_until BIGINT NOT NULL DEFAULT 0,
      last_attempt BIGINT NOT NULL DEFAULT 0
    )
  `);
  tableReady = true;
}

function getKey(ip: string, username: string): string {
  return `${ip}:${username.toLowerCase()}`;
}

// Lock only on every 5th failure: 5 -> 30s, 10 -> 1m, 15 -> 3m, 20 -> 5m, 25+ -> 30m
export function getLockDuration(attemptCount: number): number {
  if (attemptCount < 5 || attemptCount % 5 !== 0) return 0;
  const level = attemptCount / 5 - 1;
  return DURATIONS[Math.min(level, DURATIONS.length - 1)];
}

export async function checkRateLimit(
  ip: string,
  username: string
): Promise<{ allowed: boolean; remainingTime?: number; attemptCount: number }> {
  await ensureTable();
  const now = Date.now();
  const res = await pool.query(
    `SELECT count, locked_until, last_attempt FROM login_attempts WHERE attempt_key = $1`,
    [getKey(ip, username)]
  );
  if (res.rows.length === 0) return { allowed: true, attemptCount: 0 };

  const row = res.rows[0];
  const lockedUntil = Number(row.locked_until);
  const lastAttempt = Number(row.last_attempt);

  if (lockedUntil > now) {
    return { allowed: false, remainingTime: lockedUntil - now, attemptCount: row.count };
  }

  if (now - lastAttempt > RESET_AFTER_MS) {
    await pool.query(`DELETE FROM login_attempts WHERE attempt_key = $1`, [getKey(ip, username)]);
    return { allowed: true, attemptCount: 0 };
  }

  return { allowed: true, attemptCount: row.count };
}

export async function recordFailedAttempt(
  ip: string,
  username: string
): Promise<{ lockedUntil: number; attemptCount: number }> {
  await ensureTable();
  const now = Date.now();
  const key = getKey(ip, username);

  // Atomic increment, restarting at 1 if the last failure was long ago
  const res = await pool.query(
    `INSERT INTO login_attempts (attempt_key, count, locked_until, last_attempt)
     VALUES ($1, 1, 0, $2)
     ON CONFLICT (attempt_key) DO UPDATE SET
       count = CASE WHEN $2 - login_attempts.last_attempt > $3 THEN 1 ELSE login_attempts.count + 1 END,
       last_attempt = $2
     RETURNING count`,
    [key, now, RESET_AFTER_MS]
  );
  const count: number = res.rows[0].count;

  let lockedUntil = 0;
  const duration = getLockDuration(count);
  if (duration > 0) {
    lockedUntil = now + duration;
    await pool.query(`UPDATE login_attempts SET locked_until = $1 WHERE attempt_key = $2`, [lockedUntil, key]);
  }
  return { lockedUntil, attemptCount: count };
}

export async function clearAttempts(ip: string, username: string): Promise<void> {
  await ensureTable();
  await pool.query(`DELETE FROM login_attempts WHERE attempt_key = $1`, [getKey(ip, username)]);
}

export function formatLockTime(ms: number): string {
  if (ms < 60000) {
    const seconds = Math.ceil(ms / 1000);
    return `${seconds} second${seconds !== 1 ? "s" : ""}`;
  }
  const minutes = Math.ceil(ms / 60000);
  if (minutes === 1) return "1 minute";
  if (minutes < 60) return `${minutes} minutes`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return `${hours} hour${hours > 1 ? "s" : ""}${rem > 0 ? ` ${rem} minute${rem > 1 ? "s" : ""}` : ""}`;
}