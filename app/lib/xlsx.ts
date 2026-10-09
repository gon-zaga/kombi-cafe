import * as XLSX from 'xlsx';

interface XlsxColumn<T> {
  header: string;
  // Receives the row's 1-based index too, for columns like "Rank"
  value: (row: T, index: number) => string | number;
  width?: number; // column width in characters (approximate)
}

/**
 * Convert rows to an Excel workbook (.xlsx) with optional column widths.
 */
export function toXlsx<T>(rows: T[], columns: XlsxColumn<T>[]): XLSX.WorkBook {
  // Prepare data: header row + data rows
  const data: (string | number)[][] = [
    columns.map((c) => c.header),
    ...rows.map((row, i) =>
      columns.map((c) => c.value(row, i + 1)) // index+1 for 1-based if needed
    ),
  ];

  const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(data);

  // Set column widths if provided
  const cols = columns.map((c) => ({
    width: c.width ?? 10, // default width
  }));
  ws['!cols'] = cols;

  // Create workbook
  const wb: XLSX.WorkBook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

  return wb;
}

/**
 * Triggers browser download for an Excel file.
 * @param filename Filename to use (should end with .xlsx)
 * @param rows Data rows
 * @param columns Column definitions
 */
export function downloadXlsx<T>(
  filename: string,
  rows: T[],
  columns: XlsxColumn<T>[]
): void {
  const wb = toXlsx(rows, columns);
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  if (wbout.length === 0) {
    throw new Error('Generated Excel file is empty');
  }
  saveAsNewBlob(wbout, filename);
}

/**
 * Helper to create a blob and trigger download.
 */
function saveAsNewBlob(data: Uint8Array, filename: string): void {
  const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}