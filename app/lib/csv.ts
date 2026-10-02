// Builds a CSV file in the browser and hands it to the user as a download.
// No dependency: a CSV is just comma-separated text, and Excel/Google Sheets
// both open one directly.

interface CsvColumn<T> {
  header: string;
  // Receives the row's 1-based index too, for columns like "Rank"
  value: (row: T, index: number) => string | number;
}

// Quotes a value only when it needs it, and doubles any inner quotes. Without
// the doubling, a name containing a quote would break the row's column count.
function escapeCell(value: string | number): string {
  const text = String(value);

  if (!/["\n,]/.test(text)) return text;

  return `"${text.replace(/"/g, '""')}"`;
}

// Turns rows into CSV text. Rows are joined with \r\n because that's what
// Excel expects; a plain \n works in most viewers but trips older ones.
export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map((c) => escapeCell(c.header)).join(",");

  const body = rows.map((row, index) =>
    columns.map((c) => escapeCell(c.value(row, index + 1))).join(",")
  );

  return [header, ...body].join("\r\n");
}

// Triggers the browser download for the given rows. Filename gets a timestamp
// so repeated exports don't silently overwrite each other in Downloads.
export function downloadCsv<T>(
  filename: string,
  rows: T[],
  columns: CsvColumn<T>[]
): void {
  // A BOM makes Excel read the file as UTF-8, otherwise accented names come out
  // as mojibake
  const blob = new Blob(["\uFEFF", toCsv(rows, columns)], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();

  // Clean up: the temporary link and the object URL would otherwise stay alive
  // for as long as the page is open
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
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