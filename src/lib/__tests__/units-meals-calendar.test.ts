import { addMonths, firstDayOf, lastDayOf, monthGrid, monthOf, monthTitle } from '../calendar';
import { groupByMeal, isMeal, mealForHour, mealLabel } from '../meals';
import {
  formatWeight,
  formatWeightWithUnit,
  fromKg,
  isWeightUnit,
  parseNumber,
  toKg,
} from '../weight-unit';

describe('weight units', () => {
  it('leaves kilograms alone', () => {
    expect(fromKg(74.2, 'kg')).toBe(74.2);
    expect(toKg(74.2, 'kg')).toBe(74.2);
    expect(formatWeightWithUnit(74, 'kg')).toBe('74.0 kg');
  });

  it('converts to and from pounds', () => {
    expect(formatWeight(74.2, 'lb')).toBe('163.6');
    expect(toKg(165, 'lb')).toBeCloseTo(74.84, 2);
    expect(formatWeightWithUnit(100, 'lb')).toBe('220.5 lb');
  });

  it('shows a weight typed in pounds as the same number after storing it', () => {
    // Stored weights are rounded to two decimal places of a kilogram.
    for (const typed of [120, 150.5, 165, 180.2, 199.9, 250]) {
      const stored = Math.round(toKg(typed, 'lb') * 100) / 100;
      expect(formatWeight(stored, 'lb')).toBe(typed.toFixed(1));
    }
  });

  it('converts a difference between two weights', () => {
    expect(formatWeight(1, 'lb')).toBe('2.2');
  });

  it('reads typed numbers and rejects anything else', () => {
    expect(parseNumber('74.2')).toBe(74.2);
    expect(parseNumber(' 74,2 ')).toBe(74.2);
    expect(parseNumber('165')).toBe(165);
    expect(parseNumber('74kg')).toBeNull();
    expect(parseNumber('')).toBeNull();
    expect(parseNumber('-5')).toBeNull();
  });

  it('recognises the two units only', () => {
    expect(isWeightUnit('kg')).toBe(true);
    expect(isWeightUnit('lb')).toBe(true);
    expect(isWeightUnit('stone')).toBe(false);
  });
});

describe('meals', () => {
  it('guesses the meal from the time of day', () => {
    expect(mealForHour(8)).toBe('breakfast');
    expect(mealForHour(13)).toBe('lunch');
    expect(mealForHour(17)).toBe('snack');
    expect(mealForHour(21)).toBe('dinner');
    expect(mealForHour(1)).toBe('dinner');
  });

  it('names meals, and calls unfiled items "Other"', () => {
    expect(mealLabel('snack')).toBe('Evening snack');
    expect(mealLabel(null)).toBe('Other');
    expect(isMeal('lunch')).toBe(true);
    expect(isMeal('brunch')).toBe(false);
  });

  it('groups items in meal order, unfiled last, skipping empty meals', () => {
    const items = [
      { name: 'nuts', meal: null },
      { name: 'dal', meal: 'dinner' as const },
      { name: 'poha', meal: 'breakfast' as const },
      { name: 'roti', meal: 'dinner' as const },
    ];

    const sections = groupByMeal(items);

    expect(sections.map((section) => section.label)).toEqual(['Breakfast', 'Dinner', 'Other']);
    expect(sections[1].items.map((item) => item.name)).toEqual(['dal', 'roti']);
  });

  it('has no sections when there are no items', () => {
    expect(groupByMeal([])).toEqual([]);
  });
});

describe('calendar', () => {
  it('names and steps through months, across year ends', () => {
    expect(monthOf('2026-10-12')).toBe('2026-10');
    expect(monthTitle('2026-10')).toBe('October 2026');
    expect(addMonths('2026-10', -1)).toBe('2026-09');
    expect(addMonths('2026-12', 1)).toBe('2027-01');
    expect(addMonths('2026-01', -1)).toBe('2025-12');
  });

  it('knows the first and last day of a month, including leap years', () => {
    expect(firstDayOf('2026-10')).toBe('2026-10-01');
    expect(lastDayOf('2026-10')).toBe('2026-10-31');
    expect(lastDayOf('2026-02')).toBe('2026-02-28');
    expect(lastDayOf('2028-02')).toBe('2028-02-29');
  });

  it('lays a month out in Monday-first weeks', () => {
    // 1 October 2026 is a Thursday.
    const grid = monthGrid('2026-10');

    expect(grid[0]).toEqual([null, null, null, '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04']);
    expect(grid[1][0]).toBe('2026-10-05');
    expect(grid).toHaveLength(5);
    expect(grid[4]).toEqual([
      '2026-10-26',
      '2026-10-27',
      '2026-10-28',
      '2026-10-29',
      '2026-10-30',
      '2026-10-31',
      null,
    ]);
    expect(grid.flat().filter(Boolean)).toHaveLength(31);
  });

  it('handles a month that starts on Monday and one that needs six rows', () => {
    // June 2026 starts on a Monday; August 2026 starts on a Saturday.
    expect(monthGrid('2026-06')[0][0]).toBe('2026-06-01');
    expect(monthGrid('2026-08')).toHaveLength(6);
    expect(monthGrid('2026-08').every((week) => week.length === 7)).toBe(true);
  });
});
