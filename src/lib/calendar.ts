import { type LogDate } from './day';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/** Column headings for a week that starts on Monday. */
export const WEEKDAY_INITIALS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/** A calendar month, as `YYYY-MM`. */
export type Month = string;

const pad = (value: number) => String(value).padStart(2, '0');

export function monthOf(date: LogDate): Month {
  return date.slice(0, 7);
}

export function addMonths(month: Month, count: number): Month {
  const [year, monthNumber] = month.split('-').map(Number);
  const shifted = new Date(Date.UTC(year, monthNumber - 1 + count, 1));
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}`;
}

/** "October 2026" */
export function monthTitle(month: Month): string {
  const [year, monthNumber] = month.split('-').map(Number);
  return `${MONTHS[monthNumber - 1]} ${year}`;
}

export function firstDayOf(month: Month): LogDate {
  return `${month}-01`;
}

export function lastDayOf(month: Month): LogDate {
  const [year, monthNumber] = month.split('-').map(Number);
  const days = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  return `${month}-${pad(days)}`;
}

/**
 * The month laid out as rows of seven cells, Monday first. Cells before the 1st
 * and after the last day are null.
 */
export function monthGrid(month: Month): (LogDate | null)[][] {
  const [year, monthNumber] = month.split('-').map(Number);
  const days = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  // getUTCDay: Sunday is 0. Shift so Monday is 0.
  const leading = (new Date(Date.UTC(year, monthNumber - 1, 1)).getUTCDay() + 6) % 7;

  const cells: (LogDate | null)[] = [
    ...Array<null>(leading).fill(null),
    ...Array.from({ length: days }, (_, index) => `${month}-${pad(index + 1)}`),
  ];
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  const rows: (LogDate | null)[][] = [];
  for (let start = 0; start < cells.length; start += 7) {
    rows.push(cells.slice(start, start + 7));
  }
  return rows;
}
