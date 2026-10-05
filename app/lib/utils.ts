

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

// How long a drink counts as "new" after it is created (see the NEW badge on
// the customer menu). Kept short so it doesn't keep a badge fresh forever
export const NEW_ITEM_DAYS = 14;

// A menu item is "new" if its created_at falls within the last NEW_ITEM_DAYS.
// Safe to call with a partial/empty string: an unparseable date is treated as
// not-new rather than throwing, so a missing created_at can never crash the page
export function isNewItem(createdAt: string, days = NEW_ITEM_DAYS): boolean {
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) return false;
  return (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24) < days;
}