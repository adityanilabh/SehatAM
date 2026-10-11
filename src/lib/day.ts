/**
 * Day handling. An entry belongs to a "log date", a plain `YYYY-MM-DD` string that
 * is decided once, when the entry is made, from the phone's local time. Storing the
 * date itself (not a timestamp) means a later time-zone change never moves entries.
 */

export type LogDate = string;

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
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

const pad = (value: number) => String(value).padStart(2, '0');

function fromParts(year: number, monthIndex: number, day: number): LogDate {
  return `${year}-${pad(monthIndex + 1)}-${pad(day)}`;
}

/** Calendar parts of a log date, read in UTC so daylight saving can never shift them. */
function utc(date: LogDate): Date {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * The log date a moment belongs to. Before `dayStartHour` it still counts as the
 * previous day, so a 1 am snack lands on the day the evening started.
 */
export function logDateFor(now: Date, dayStartHour: number): LogDate {
  const local = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (now.getHours() < dayStartHour) {
    local.setDate(local.getDate() - 1);
  }
  return fromParts(local.getFullYear(), local.getMonth(), local.getDate());
}

export function addDays(date: LogDate, days: number): LogDate {
  const shifted = utc(date);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return fromParts(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate());
}

/** Whole days from `from` to `to`; negative when `to` is earlier. */
export function diffDays(from: LogDate, to: LogDate): number {
  return Math.round((utc(to).getTime() - utc(from).getTime()) / 86_400_000);
}

/** Every date from `from` to `to`, inclusive. */
export function dateRange(from: LogDate, to: LogDate): LogDate[] {
  const dates: LogDate[] = [];
  for (let date = from; date <= to; date = addDays(date, 1)) {
    dates.push(date);
  }
  return dates;
}

export function isLogDate(value: unknown): value is LogDate {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day;
}

/** "Today", "Yesterday", or the weekday name. */
export function dayTitle(date: LogDate, today: LogDate): string {
  const distance = diffDays(date, today);
  if (distance === 0) return 'Today';
  if (distance === 1) return 'Yesterday';
  if (distance === -1) return 'Tomorrow';
  return WEEKDAYS[utc(date).getUTCDay()];
}

/** "Sun 11 Oct" */
export function shortDate(date: LogDate): string {
  const parsed = utc(date);
  const weekday = WEEKDAYS[parsed.getUTCDay()].slice(0, 3);
  const month = MONTHS[parsed.getUTCMonth()].slice(0, 3);
  return `${weekday} ${parsed.getUTCDate()} ${month}`;
}

/** "Sunday, 11 October" */
export function longDate(date: LogDate): string {
  const parsed = utc(date);
  return `${WEEKDAYS[parsed.getUTCDay()]}, ${parsed.getUTCDate()} ${MONTHS[parsed.getUTCMonth()]}`;
}

/** "11 Oct" */
export function dayAndMonth(date: LogDate): string {
  const parsed = utc(date);
  return `${parsed.getUTCDate()} ${MONTHS[parsed.getUTCMonth()].slice(0, 3)}`;
}

/** First letter of the weekday, for chart axes. */
export function weekdayInitial(date: LogDate): string {
  return WEEKDAYS[utc(date).getUTCDay()][0];
}

/** The local clock time of a moment as `HH:MM`. */
export function clockTime(now: Date): string {
  return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

/**
 * Reads a time someone typed ("8:30", "0830", "8", "20.15") and returns it as
 * `HH:MM`, or null if it is not a real time of day.
 */
export function parseClockTime(input: string): string | null {
  const text = input.trim();
  const match =
    /^(\d{1,2})[:.](\d{2})$/.exec(text) ?? /^(\d{1,2})(\d{2})$/.exec(text) ?? /^(\d{1,2})()$/.exec(text);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = match[2] === '' ? 0 : Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return `${pad(hours)}:${pad(minutes)}`;
}

/** "4:00 am", "12:30 pm" */
export function friendlyTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const suffix = hours < 12 ? 'am' : 'pm';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${pad(minutes)} ${suffix}`;
}
