import { deleteAllData, exportData, importData, parseBackup } from '../backup';
import { addFood, deleteFood, getFoodForDay, updateFood } from '../food';
import { DEFAULT_SETTINGS, getSettings, updateSettings } from '../settings';
import { openAppTestDb, type TestDb } from '../testing/node-sqlite-db';
import { getWeights, logWeight } from '../weight';

let mockNextId = 0;
jest.mock('@/lib/id', () => ({ newId: () => `id-${++mockNextId}` }));

const DAY = '2026-10-12';
const time = (minute: number) => new Date(Date.UTC(2026, 9, 12, 10, minute));

let db: TestDb;

beforeEach(async () => {
  mockNextId = 0;
  db = await openAppTestDb();
});

afterEach(() => db.close());

describe('settings', () => {
  it('starts with the defaults', async () => {
    expect(await getSettings(db)).toEqual(DEFAULT_SETTINGS);
    expect(DEFAULT_SETTINGS.dayStartHour).toBe(4);
  });

  it('saves changes and leaves the rest alone', async () => {
    await updateSettings(db, { targetWeightKg: 70, foodReminderEnabled: true });
    await updateSettings(db, { targetWeightKg: 69.5 });

    expect(await getSettings(db)).toEqual({
      ...DEFAULT_SETTINGS,
      targetWeightKg: 69.5,
      foodReminderEnabled: true,
    });
  });

  it('can clear a target back to none', async () => {
    await updateSettings(db, { calorieTarget: 1800 });
    await updateSettings(db, { calorieTarget: null });

    expect((await getSettings(db)).calorieTarget).toBeNull();
  });

  it('falls back to defaults for stored values that make no sense', async () => {
    await db.execAsync(`
      INSERT INTO setting (key, value, updated_at) VALUES
        ('dayStartHour', '99', 'x'),
        ('foodReminderTime', '"25:00"', 'x'),
        ('targetWeightKg', 'not json', 'x');
    `);

    expect(await getSettings(db)).toEqual(DEFAULT_SETTINGS);
  });
});

describe('export and import', () => {
  async function seed() {
    await addFood(db, { logDate: DAY, foodText: 'roti', eatenAt: '08:30' }, time(0));
    await addFood(db, { logDate: DAY, foodText: 'nuts', quantity: 'a handful' }, time(1));
    const removed = await addFood(db, { logDate: DAY, foodText: 'removed' }, time(2));
    await deleteFood(db, removed.id, time(3));
    await logWeight(db, { logDate: DAY, weightKg: 74.2 }, time(4));
    await updateSettings(db, { targetWeightKg: 70, dayStartHour: 3 });
  }

  it('exports live entries and settings, and survives a round trip through a file', async () => {
    await seed();

    const text = JSON.stringify(await exportData(db, time(10)));
    const backup = parseBackup(text);

    expect(backup.food.map((row) => row.food_text)).toEqual(['roti', 'nuts']);
    expect(backup.weight.map((row) => row.weight_kg)).toEqual([74.2]);
    expect(backup.settings).toMatchObject({ targetWeightKg: 70, dayStartHour: 3 });
  });

  it('restores everything after the app is wiped', async () => {
    await seed();
    const before = await getFoodForDay(db, DAY);
    const backup = parseBackup(JSON.stringify(await exportData(db)));

    await deleteAllData(db);
    expect(await getFoodForDay(db, DAY)).toEqual([]);
    expect(await getSettings(db)).toEqual(DEFAULT_SETTINGS);
    expect(db.all('SELECT id FROM food_entry')).toEqual([]);

    const result = await importData(db, backup);

    expect(result).toEqual({ food: 2, weight: 1 });
    expect(await getFoodForDay(db, DAY)).toEqual(before);
    expect((await getWeights(db, DAY, DAY))[0]).toMatchObject({ weightKg: 74.2 });
    expect(await getSettings(db)).toMatchObject({ targetWeightKg: 70, dayStartHour: 3 });
  });

  it('does not duplicate anything when the same file is imported twice', async () => {
    await seed();
    const backup = parseBackup(JSON.stringify(await exportData(db)));

    await importData(db, backup);
    await importData(db, backup);

    expect(await getFoodForDay(db, DAY)).toHaveLength(2);
    expect(await getWeights(db, DAY, DAY)).toHaveLength(1);
  });

  it('keeps edits and deletions made after the backup was taken', async () => {
    await seed();
    const [roti, nuts] = await getFoodForDay(db, DAY);
    const backup = parseBackup(JSON.stringify(await exportData(db)));

    await updateFood(db, roti.id, { logDate: DAY, foodText: '3 roti' }, time(30));
    await deleteFood(db, nuts.id, time(31));
    await importData(db, backup);

    expect((await getFoodForDay(db, DAY)).map((entry) => entry.foodText)).toEqual(['3 roti']);
  });

  it('keeps one weight per day when the file and the phone disagree', async () => {
    await logWeight(db, { logDate: DAY, weightKg: 75 }, time(0));
    const backup = parseBackup(JSON.stringify(await exportData(db)));

    await deleteAllData(db);
    await logWeight(db, { logDate: DAY, weightKg: 73 }, time(20));
    await importData(db, backup);

    const entries = await getWeights(db, DAY, DAY);
    expect(entries).toHaveLength(1);
    expect(entries[0].weightKg).toBe(73);
  });

  it('rejects files that are not a usable backup', () => {
    expect(() => parseBackup('not json')).toThrow(/not a SehatAM backup/);
    expect(() => parseBackup('{"app":"Other","formatVersion":1}')).toThrow(/not a SehatAM backup/);
    expect(() =>
      parseBackup('{"app":"SehatAM","formatVersion":99,"food":[],"weight":[]}')
    ).toThrow(/newer version/);
    expect(() =>
      parseBackup('{"app":"SehatAM","formatVersion":1,"food":[{"id":"x"}],"weight":[]}')
    ).toThrow(/damaged/);
  });
});
