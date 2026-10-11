import { addDays, type LogDate } from './day';

/**
 * The number of days in a row with at least one item logged.
 *
 * `loggedDates` are the days that have items, newest first, with no repeats. The
 * streak runs back from today. If nothing is logged yet today the streak is still
 * alive and counts back from yesterday, so it only breaks once a whole day is missed.
 */
export function currentStreak(loggedDates: LogDate[], today: LogDate): number {
  const logged = new Set(loggedDates);
  let day = logged.has(today) ? today : addDays(today, -1);
  let streak = 0;

  while (logged.has(day)) {
    streak += 1;
    day = addDays(day, -1);
  }

  return streak;
}
