import { reminderPlan, shiftClockTime } from '../reminders';

const off = {
  foodReminderEnabled: false,
  foodReminderTime: '20:00',
  weightReminderEnabled: false,
  weightReminderTime: '07:00',
};

describe('reminderPlan', () => {
  it('schedules nothing when both reminders are off', () => {
    expect(reminderPlan(off)).toEqual([]);
  });

  it('schedules only the reminders that are switched on, at their times', () => {
    const plan = reminderPlan({ ...off, weightReminderEnabled: true, weightReminderTime: '06:30' });

    expect(plan).toHaveLength(1);
    expect(plan[0]).toMatchObject({ id: 'weight-reminder', hour: 6, minute: 30 });
  });

  it('schedules both with distinct ids', () => {
    const plan = reminderPlan({ ...off, foodReminderEnabled: true, weightReminderEnabled: true });

    expect(plan.map((reminder) => [reminder.id, reminder.hour, reminder.minute])).toEqual([
      ['food-reminder', 20, 0],
      ['weight-reminder', 7, 0],
    ]);
  });
});

describe('shiftClockTime', () => {
  it('moves forward and back', () => {
    expect(shiftClockTime('20:00', 30)).toBe('20:30');
    expect(shiftClockTime('20:00', -30)).toBe('19:30');
  });

  it('wraps around midnight in both directions', () => {
    expect(shiftClockTime('23:30', 30)).toBe('00:00');
    expect(shiftClockTime('00:00', -30)).toBe('23:30');
  });
});
