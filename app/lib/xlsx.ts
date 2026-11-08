import * as XLSX from '@stackline/xlsx';

interface XlsxColumn<T> {
  header: string;
  value: (row: T, index: number) => string | number;
  width?: number;
}

export function toXlsx<T>(rows: T[], columns: XlsxColumn<T>[]): XLSX.WorkBook {
  const data: (string | number)[][] = [
    columns.map((c) => c.header),
    ...rows.map((row, i) =>
      columns.map((c) => c.value(row, i + 1))
    ),
  ];

  const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(data);

  const cols = columns.map((c) => ({
    width: c.width ?? 10,
  }));
  ws['!cols'] = cols;

  const wb: XLSX.WorkBook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

  return wb;
}

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
  saveAsNewBlob(new Uint8Array(wbout), filename);
}

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