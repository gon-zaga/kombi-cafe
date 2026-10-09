// Single source of truth for store hours: reads settings, computes open/closed in Manila time
import pool from "@/app/lib/db";

export type StoreStatus = {
  isOpen: boolean;
  openingTime: string; // "08:00 AM"
  closingTime: string; // "08:00 PM"
  systemDown: boolean;
  systemDownMessage?: string;
};

const DEFAULT_OPEN = "08:00";
const DEFAULT_CLOSE = "20:00";
const DAY = 24 * 60;

// "HH:MM" or "HH:MM:SS" -> minutes since midnight
export function toMinutes(value?: string | null): number {
  if (!value) return 0;
  const [h, m] = value.split(":");
  return (parseInt(h, 10) || 0) * 60 + (parseInt(m, 10) || 0);
}

export function formatMinutes12h(total: number): string {
  const h24 = Math.floor(total / 60) % 24;
  const m = total % 60;
  const ampm = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 || 12;
  return `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
}

// Current minutes since midnight in Manila, independent of the server's timezone
export function manilaMinutesNow(): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (t: string) => parseInt(parts.find((p) => p.type === t)?.value ?? "0", 10);
  return get("hour") * 60 + get("minute");
}

// Works for same-day hours and hours that cross midnight (e.g. 20:00 -> 02:00)
export function isOpenAt(now: number, open: number, close: number): boolean {
  if (open === close) return true;
  const duration = (close - open + DAY) % DAY;
  return (now - open + DAY) % DAY < duration;
}

export async function getStoreStatus(): Promise<StoreStatus> {
  let opening = DEFAULT_OPEN;
  let closing = DEFAULT_CLOSE;
  let systemDown = false;
  let systemDownMessage: string | undefined;

  try {
    const result = await pool.query(
      "SELECT opening_time, closing_time, system_down, system_down_message FROM store_settings ORDER BY id DESC LIMIT 1"
    );
    if (result.rows.length > 0) {
      opening = String(result.rows[0].opening_time);
      closing = String(result.rows[0].closing_time);
      systemDown = Boolean(result.rows[0].system_down);
      systemDownMessage = result.rows[0].system_down_message as string | undefined;
    }
  } catch (error) {
    // Table missing or DB down: fall back to default hours
    console.error("Failed to read store settings:", error);
  }

  // If system is down, return closed status with custom message
  if (systemDown) {
    const open = toMinutes(opening);
    const close = toMinutes(closing);
    return {
      isOpen: false,
      openingTime: formatMinutes12h(open),
      closingTime: formatMinutes12h(close),
      systemDown,
      systemDownMessage,
    };
  }

  // Otherwise, use time-based logic
  const open = toMinutes(opening);
  const close = toMinutes(closing);

  return {
    isOpen: isOpenAt(manilaMinutesNow(), open, close),
    openingTime: formatMinutes12h(open),
    closingTime: formatMinutes12h(close),
    systemDown: false,
  };
}