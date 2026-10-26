import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PdfColumn<T> {
  header: string;
  value: (row: T, index: number) => string | number;
  width?: number;
}

interface PdfOptions {
  orientation?: 'portrait' | 'landscape';
  unit?: 'pt' | 'mm' | 'cm' | 'in';
  format?: string;
}

export function toPdf<T>(
  rows: T[],
  columns: PdfColumn<T>[],
  options: PdfOptions = {}
): jsPDF {
  const {
    orientation = 'portrait',
    unit = 'mm',
    format = 'a4',
  } = options;

  const doc = new jsPDF({ orientation, unit, format });

  const head = columns.map((c) => c.header);
  const body = rows.map((row, i) =>
    columns.map((c) => c.value(row, i + 1))
  );

  autoTable(doc, {
    head: [head],
    body,
    startY: 15,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [41, 37, 36],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [250, 250, 248],
    },
    columnStyles: columns.reduce((acc, col, idx) => {
      if (col.width) {
        acc[idx] = { cellWidth: col.width };
      }
      return acc;
    }, {} as Record<number, { cellWidth: number }>),
    margin: { top: 20 },
  });

  return doc;
}

export function downloadPdf<T>(
  filename: string,
  rows: T[],
  columns: PdfColumn<T>[],
  options?: PdfOptions
): void {
  const doc = toPdf(rows, columns, options);
  doc.save(filename);
}