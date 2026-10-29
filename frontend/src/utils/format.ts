const numberFormatter = new Intl.NumberFormat('id-ID');

export function formatNumber(value: number): string {
  const rounded = Math.round(value);
  const absolute = Math.abs(rounded);
  const grouped = numberFormatter.format(absolute);
  return `${rounded < 0 ? '-' : ''}${grouped}`;
}

/** Rupiah always renders without decimals, with Indonesian dot grouping. */
export function formatRupiah(value: number): string {
  const rounded = Math.round(value);
  const sign = rounded < 0 ? '-' : '';
  return `${sign}Rp${numberFormatter.format(Math.abs(rounded))}`;
}

export function formatRupiahSigned(
  value: number,
  type: 'expense' | 'income',
): string {
  return `${type === 'income' ? '+' : '-'}${formatRupiah(value)}`;
}

export function formatSignedAmount(value: number): string {
  return value < 0 ? `-${formatRupiah(Math.abs(value))}` : formatRupiah(value);
}

/** Format an integer amount for the money input (e.g. 25000 -> "25.000"). */
export function formatAmountInput(amount: number): string {
  if (!amount) return '';
  return formatNumber(amount);
}

export function parseAmountInput(text: string): number {
  const digits = text.replace(/\D/g, '').slice(0, 12);
  return digits ? Number.parseInt(digits, 10) : 0;
}

export function formatCompactRupiah(value: number): string {
  if (value >= 1_000_000_000) {
    return `Rp${trimDecimal(value / 1_000_000_000)} M`;
  }
  if (value >= 1_000_000) {
    return `Rp${trimDecimal(value / 1_000_000)} jt`;
  }
  if (value >= 1_000) {
    return `Rp${trimDecimal(value / 1_000)} rb`;
  }
  return formatRupiah(value);
}

function trimDecimal(value: number): string {
  return value
    .toFixed(1)
    .replace('.0', '')
    .replace('.', ',');
}

export function formatPercent(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return `${String(rounded).replace('.', ',')}%`;
}

export function initialOf(name: string | null | undefined): string {
  const trimmed = name?.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : '?';
}

export function formatCount(value: number, singular: string, plural?: string): string {
  return `${formatNumber(value)} ${value === 1 ? singular : (plural ?? singular)}`;
}
