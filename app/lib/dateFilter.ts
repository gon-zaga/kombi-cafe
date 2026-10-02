// Shared date-range options for the owner dashboard and the sales report, so
// both screens speak the same filter language and hit the same API query.
//
// The keys here are exactly what the API's resolveRange() accepts, except for
// "custom", which becomes an explicit ?from=&to= window instead.

export const DATE_FILTERS = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "year", label: "This Year" },
  { key: "all", label: "All Time" },
  { key: "custom", label: "Custom" },
] as const;

export type DateFilter = (typeof DATE_FILTERS)[number]["key"];

// An applied custom window, always validated before it reaches this layer
export interface CustomRange {
  from: string;
  to: string;
}

// Turns a selection into the query string for /api/orders.
// Returns null for a custom filter with no applied dates yet, which callers
// treat as "don't fetch anything".
export function buildOrdersQuery(
  filter: DateFilter,
  customRange: CustomRange | null
): string | null {
  if (filter === "custom") {
    return customRange
      ? `?from=${customRange.from}&to=${customRange.to}`
      : null;
  }

  return `?range=${filter}`;
}

// Human-readable description of what the numbers on screen cover, e.g.
// "this week" or "Oct 1 to Oct 5". Used for the dashboard's context line and the
// CSV filenames, so an exported file always says which period it came from.
export function describeRange(
  filter: DateFilter,
  customRange: CustomRange | null
): string {
  if (filter === "custom") {
    return customRange ? `${customRange.from} to ${customRange.to}` : "no range selected";
  }

  const label = DATE_FILTERS.find((f) => f.key === filter)?.label ?? filter;
  return filter === "today" ? "today" : label.toLowerCase();
}

// Filename-safe version of a range, e.g. this-week or 2026-10-01_to_2026-10-05
export function rangeSlug(filter: DateFilter, customRange: CustomRange | null): string {
  if (filter === "custom" && customRange) {
    return `${customRange.from}_to_${customRange.to}`;
  }

  return filter === "custom" ? "custom" : filter;
}