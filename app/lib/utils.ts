

export function getRelativeTime(timestamp: Date | string) {
  const now = Date.now();
  const orderTime = timestamp instanceof Date ? timestamp : new Date(timestamp);
  const diff = now - orderTime.getTime()
  const minutes = Math.floor(diff / 60000)

  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24 ) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

// Filename-safe Manila timestamp, e.g. 2026-10-02_1430
export function exportTimestamp(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "00";

  return `${get("year")}-${get("month")}-${get("day")}_${get("hour")}${get("minute")}`;
}
