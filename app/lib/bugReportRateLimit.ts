// Rate limiting for bug reports stored in Postgres so it works on serverless hosts
import pool from "@/app/lib/db";

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REPORTS = 5; // 5 reports per hour per user

let tableReady = false;
async function ensureTable() {
  if (tableReady) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS bug_report_attempts (
      user_id INTEGER PRIMARY KEY,
      count INTEGER NOT NULL DEFAULT 0,
      window_start BIGINT NOT NULL DEFAULT 0
    )
  `);
  tableReady = true;
}

export async function checkBugReportRateLimit(userId: number): Promise<{ allowed: boolean; remainingTime?: number; count: number }> {
  await ensureTable();
  const now = Date.now();
  const res = await pool.query(
    `SELECT count, window_start FROM bug_report_attempts WHERE user_id = $1`,
    [userId]
  );
  if (res.rows.length === 0) return { allowed: true, count: 0 };

  const row = res.rows[0];
  const windowStart = Number(row.window_start);
  const count = Number(row.count);

  // If window has expired, reset
  if (now - windowStart > WINDOW_MS) {
    await pool.query(`DELETE FROM bug_report_attempts WHERE user_id = $1`, [userId]);
    return { allowed: true, count: 0 };
  }

  if (count >= MAX_REPORTS) {
    const remainingTime = windowStart + WINDOW_MS - now;
    return { allowed: false, remainingTime, count };
  }

  return { allowed: true, count };
}

export async function recordBugReportAttempt(userId: number): Promise<{ count: number; lockedUntil?: number }> {
  await ensureTable();
  const now = Date.now();
  const res = await pool.query(
    `INSERT INTO bug_report_attempts (user_id, count, window_start)
     VALUES ($1, 1, $2)
     ON CONFLICT (user_id) DO UPDATE SET
       count = CASE WHEN $2 - bug_report_attempts.window_start > $3 THEN 1 ELSE bug_report_attempts.count + 1 END,
       window_start = CASE WHEN $2 - bug_report_attempts.window_start > $3 THEN $2 ELSE bug_report_attempts.window_start END
     RETURNING count, window_start`,
    [userId, now, WINDOW_MS]
  );
  const count = Number(res.rows[0].count);
  const windowStart = Number(res.rows[0].window_start);

  let lockedUntil: number | undefined;
  if (count >= MAX_REPORTS) {
    lockedUntil = windowStart + WINDOW_MS;
  }
  return { count, lockedUntil };
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