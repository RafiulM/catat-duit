import type { TransactionType } from '@/data/types';

type CsvRow = {
  date: string;
  type: TransactionType;
  category: string;
  amount: number;
  note: string;
};

function escapeValue(value: string): string {
  const safe = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function buildTransactionsCsv(rows: CsvRow[]): string {
  const header = ['Tanggal', 'Jenis', 'Kategori', 'Nominal (Rp)', 'Catatan'];
  const lines = [header.map(escapeValue).join(',')];
  for (const row of rows) {
    lines.push(
      [
        row.date,
        row.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
        row.category,
        String(row.amount),
        row.note,
      ]
        .map(escapeValue)
        .join(','),
    );
  }
  return `\uFEFF${lines.join('\r\n')}\r\n`;
}
