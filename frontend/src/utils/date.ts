const MONTHS_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
] as const;

const MONTHS_SHORT_ID = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
] as const;

const DAYS_ID = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
] as const;

const DAYS_SHORT_ID = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'] as const;

export { DAYS_ID, DAYS_SHORT_ID, MONTHS_ID, MONTHS_SHORT_ID };

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/** Local-date ISO string. Never derive this from toISOString(): that shifts the day in Jakarta. */
export function toISODate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseISODate(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function nowISO(): string {
  return new Date().toISOString();
}

export function monthKey(isoDate: string): string {
  return isoDate.slice(0, 7);
}

export function currentMonthKey(): string {
  return monthKey(todayISO());
}

export function formatDateLabel(isoDate: string): string {
  if (!isoDate) return '';
  const date = parseISODate(isoDate);
  return `${date.getDate()} ${MONTHS_ID[date.getMonth()]}`;
}

export function formatDateShort(isoDate: string): string {
  if (!isoDate) return '';
  const date = parseISODate(isoDate);
  return `${date.getDate()} ${MONTHS_SHORT_ID[date.getMonth()]}`;
}

export function formatDateLong(isoDate: string): string {
  if (!isoDate) return '';
  const date = parseISODate(isoDate);
  return `${DAYS_ID[date.getDay()]}, ${date.getDate()} ${MONTHS_ID[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatTime(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) return '';
  return `${pad(date.getHours())}.${pad(date.getMinutes())}`;
}

export function formatDateWithYear(isoDate: string): string {
  if (!isoDate) return '';
  const date = parseISODate(isoDate);
  return `${date.getDate()} ${MONTHS_ID[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatMonthLabel(month: string): string {
  const [year, monthNumber] = month.split('-').map(Number);
  return `${MONTHS_ID[(monthNumber ?? 1) - 1]} ${year}`;
}

export function formatMonthShort(month: string): string {
  const [, monthNumber] = month.split('-').map(Number);
  return MONTHS_SHORT_ID[(monthNumber ?? 1) - 1] ?? month;
}

export function formatGroupDate(isoDate: string): string {
  const today = todayISO();
  if (isoDate === today) return 'Hari ini';
  const yesterday = addDays(today, -1);
  if (isoDate === yesterday) return 'Kemarin';
  return formatDateWithYear(isoDate);
}

export function formatDateRangeLabel(fromDate: string, toDate: string): string {
  const from = parseISODate(fromDate);
  const to = parseISODate(toDate);
  if (from.getMonth() === to.getMonth()) {
    return `${from.getDate()}–${to.getDate()} ${MONTHS_ID[to.getMonth()]}`;
  }
  return `${formatDateShort(fromDate)} – ${formatDateShort(toDate)}`;
}

export function addDays(isoDate: string, amount: number): string {
  const date = parseISODate(isoDate);
  date.setDate(date.getDate() + amount);
  return toISODate(date);
}

export function addMonths(month: string, amount: number): string {
  const [year, monthNumber] = month.split('-').map(Number);
  const date = new Date(year, (monthNumber ?? 1) - 1 + amount, 1);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

export function startOfMonth(month: string): string {
  return `${month}-01`;
}

export function endOfMonth(month: string): string {
  const [year, monthNumber] = month.split('-').map(Number);
  const date = new Date(year, monthNumber ?? 1, 0);
  return toISODate(date);
}

export function daysInMonth(month: string): string[] {
  const [year, monthNumber] = month.split('-').map(Number);
  const total = new Date(year, monthNumber ?? 1, 0).getDate();
  return Array.from({ length: total }, (_, index) => `${month}-${pad(index + 1)}`);
}

export function lastNDaysISO(amount: number, endDate = todayISO()): string[] {
  return Array.from({ length: amount }, (_, index) =>
    addDays(endDate, index - amount + 1),
  );
}

export function isSameMonth(isoDate: string, month: string): boolean {
  return isoDate.startsWith(month);
}

export function dayNumber(isoDate: string): number {
  return parseISODate(isoDate).getDate();
}

export function weekdayShort(isoDate: string): string {
  return DAYS_SHORT_ID[parseISODate(isoDate).getDay()] ?? '';
}

export function dayAndMonthParts(isoDate: string): { day: string; month: string } {
  const date = parseISODate(isoDate);
  return {
    day: String(date.getDate()),
    month: MONTHS_SHORT_ID[date.getMonth()] ?? '',
  };
}
