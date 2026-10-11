import {
  addDays,
  clockTime,
  dateRange,
  dayTitle,
  diffDays,
  friendlyTime,
  isLogDate,
  logDateFor,
  longDate,
  parseClockTime,
  shortDate,
  weekdayInitial,
} from '../day';

// Local-time constructor: year, month index, day, hour, minute.
const at = (day: number, hour: number, minute = 0) => new Date(2026, 9, day, hour, minute);

describe('logDateFor', () => {
  it('uses the calendar date once the day has started', () => {
    expect(logDateFor(at(12, 4), 4)).toBe('2026-10-12');
    expect(logDateFor(at(12, 23, 59), 4)).toBe('2026-10-12');
  });

  it('counts the small hours for the previous day', () => {
    expect(logDateFor(at(12, 1, 30), 4)).toBe('2026-10-11');
    expect(logDateFor(at(12, 3, 59), 4)).toBe('2026-10-11');
  });

  it('follows the calendar exactly when the day starts at midnight', () => {
    expect(logDateFor(at(12, 0), 0)).toBe('2026-10-12');
  });

  it('crosses month and year boundaries', () => {
    expect(logDateFor(new Date(2026, 9, 1, 2), 4)).toBe('2026-09-30');
    expect(logDateFor(new Date(2027, 0, 1, 2), 4)).toBe('2026-12-31');
  });
});

describe('date arithmetic', () => {
  it('adds and subtracts days across months and leap days', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
  });

  it('counts whole days between dates', () => {
    expect(diffDays('2026-10-01', '2026-10-12')).toBe(11);
    expect(diffDays('2026-10-12', '2026-10-01')).toBe(-11);
    expect(diffDays('2026-10-12', '2026-10-12')).toBe(0);
  });

  it('lists a range inclusively', () => {
    expect(dateRange('2026-10-30', '2026-11-01')).toEqual([
      '2026-10-30',
      '2026-10-31',
      '2026-11-01',
    ]);
  });

  it('recognises real dates only', () => {
    expect(isLogDate('2026-10-12')).toBe(true);
    expect(isLogDate('2026-02-30')).toBe(false);
    expect(isLogDate('12-10-2026')).toBe(false);
    expect(isLogDate(20261012)).toBe(false);
  });
});

describe('labels', () => {
  it('names days relative to today', () => {
    expect(dayTitle('2026-10-12', '2026-10-12')).toBe('Today');
    expect(dayTitle('2026-10-11', '2026-10-12')).toBe('Yesterday');
    expect(dayTitle('2026-10-09', '2026-10-12')).toBe('Friday');
  });

  it('formats dates', () => {
    expect(shortDate('2026-10-11')).toBe('Sun 11 Oct');
    expect(longDate('2026-10-11')).toBe('Sunday, 11 October');
    expect(weekdayInitial('2026-10-12')).toBe('M');
  });

  it('formats times', () => {
    expect(clockTime(at(12, 8, 5))).toBe('08:05');
    expect(friendlyTime('04:00')).toBe('4:00 am');
    expect(friendlyTime('12:30')).toBe('12:30 pm');
    expect(friendlyTime('00:15')).toBe('12:15 am');
    expect(friendlyTime('20:00')).toBe('8:00 pm');
  });
});

describe('parseClockTime', () => {
  it('accepts the ways people type a time', () => {
    expect(parseClockTime('8:30')).toBe('08:30');
    expect(parseClockTime('08:30')).toBe('08:30');
    expect(parseClockTime('0830')).toBe('08:30');
    expect(parseClockTime('830')).toBe('08:30');
    expect(parseClockTime('20.15')).toBe('20:15');
    expect(parseClockTime(' 8 ')).toBe('08:00');
  });

  it('rejects anything that is not a time of day', () => {
    expect(parseClockTime('24:00')).toBeNull();
    expect(parseClockTime('12:60')).toBeNull();
    expect(parseClockTime('lunch')).toBeNull();
    expect(parseClockTime('')).toBeNull();
  });
});
