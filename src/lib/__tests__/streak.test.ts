import { currentStreak } from '../streak';

const TODAY = '2026-10-12';

describe('currentStreak', () => {
  it('is zero when nothing has been logged', () => {
    expect(currentStreak([], TODAY)).toBe(0);
  });

  it('counts today when it is the only day', () => {
    expect(currentStreak([TODAY], TODAY)).toBe(1);
  });

  it('counts consecutive days back from today', () => {
    expect(currentStreak([TODAY, '2026-10-11', '2026-10-10'], TODAY)).toBe(3);
  });

  it('stops at the first missed day', () => {
    expect(currentStreak([TODAY, '2026-10-11', '2026-10-09', '2026-10-08'], TODAY)).toBe(2);
  });

  it('stays alive when nothing is logged yet today', () => {
    expect(currentStreak(['2026-10-11', '2026-10-10'], TODAY)).toBe(2);
  });

  it('is broken once a whole day has been missed', () => {
    expect(currentStreak(['2026-10-10', '2026-10-09'], TODAY)).toBe(0);
  });

  it('runs across a month boundary', () => {
    expect(currentStreak(['2026-10-01', '2026-09-30', '2026-09-29'], '2026-10-01')).toBe(3);
  });
});
