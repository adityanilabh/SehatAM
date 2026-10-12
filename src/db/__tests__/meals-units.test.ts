import { exportData, importData, parseBackup } from '../backup';
import { prepareDb } from '../database';
import { addFood, getFoodForDay, updateFood } from '../food';
import { getSchemaVersion, migrate } from '../migrate';
import { migrations } from '../schema';
import { getSettings, updateSettings } from '../settings';
import { openAppTestDb, openTestDb, type TestDb } from '../testing/node-sqlite-db';
import { getWeights, logWeight } from '../weight';

let mockNextId = 0;
jest.mock('@/lib/id', () => ({ newId: () => `id-${++mockNextId}` }));

const DAY = '2026-10-12';

describe('meals on food items', () => {
  let db: TestDb;

  beforeEach(async () => {
    mockNextId = 0;
    db = await openAppTestDb();
  });

  afterEach(() => db.close());

  it('stores the meal an item is added under, and none by default', async () => {
    await addFood(db, { logDate: DAY, foodText: 'poha', meal: 'breakfast' });
    await addFood(db, { logDate: DAY, foodText: 'nuts' });

    const meals = (await getFoodForDay(db, DAY)).map((entry) => [entry.foodText, entry.meal]);

    expect(meals).toEqual([
      ['poha', 'breakfast'],
      ['nuts', null],
    ]);
  });

  it('changes or clears the meal when an item is edited', async () => {
    const entry = await addFood(db, { logDate: DAY, foodText: 'chai', meal: 'breakfast' });

    await updateFood(db, entry.id, { logDate: DAY, foodText: 'chai', meal: 'snack' });
    expect((await getFoodForDay(db, DAY))[0].meal).toBe('snack');

    await updateFood(db, entry.id, { logDate: DAY, foodText: 'chai', meal: null });
    expect((await getFoodForDay(db, DAY))[0].meal).toBeNull();
  });

  it('carries meals through export and import', async () => {
    await addFood(db, { logDate: DAY, foodText: 'dal rice', meal: 'lunch' });
    const backup = parseBackup(JSON.stringify(await exportData(db)));
    expect(backup.formatVersion).toBe(3);

    const fresh = await openAppTestDb();
    await importData(fresh, backup);

    expect((await getFoodForDay(fresh, DAY))[0]).toMatchObject({
      foodText: 'dal rice',
      meal: 'lunch',
    });
    fresh.close();
  });

  it('accepts a backup made before meals existed', async () => {
    const oldFile = JSON.stringify({
      app: 'SehatAM',
      formatVersion: 1,
      exportedAt: '2026-10-12T00:00:00.000Z',
      food: [
        {
          id: 'old-1',
          log_date: DAY,
          eaten_at: '08:30',
          food_text: 'roti',
          quantity: null,
          calories: null,
          created_at: '2026-10-12T03:00:00.000Z',
          updated_at: '2026-10-12T03:00:00.000Z',
        },
      ],
      weight: [],
      settings: { targetWeightKg: 70 },
    });

    await importData(db, parseBackup(oldFile));

    expect((await getFoodForDay(db, DAY))[0]).toMatchObject({ foodText: 'roti', meal: null });
    expect(await getSettings(db)).toMatchObject({ targetWeightKg: 70, weightUnit: 'kg' });
  });

  it('drops a meal name it does not know instead of storing it', async () => {
    const file = JSON.stringify({
      app: 'SehatAM',
      formatVersion: 2,
      food: [
        {
          id: 'x-1',
          log_date: DAY,
          meal: 'brunch',
          eaten_at: null,
          food_text: 'eggs',
          quantity: null,
          calories: null,
          created_at: '2026-10-12T03:00:00.000Z',
          updated_at: '2026-10-12T03:00:00.000Z',
        },
      ],
      weight: [],
    });

    await importData(db, parseBackup(file));

    expect((await getFoodForDay(db, DAY))[0].meal).toBeNull();
  });
});

describe('upgrade from the first release', () => {
  it('adds the meal column and keeps food already logged', async () => {
    const db = openTestDb();
    await migrate(db, migrations.slice(0, 1));
    await db.execAsync(`
      INSERT INTO food_entry (id, log_date, eaten_at, food_text, created_at, updated_at)
      VALUES ('v1-1', '${DAY}', '08:30', 'roti', 't', 't');
    `);
    expect(await getSchemaVersion(db)).toBe(1);

    await prepareDb(db);

    expect(await getSchemaVersion(db)).toBe(migrations.length);
    expect(await getFoodForDay(db, DAY)).toEqual([
      expect.objectContaining({ id: 'v1-1', foodText: 'roti', eatenAt: '08:30', meal: null }),
    ]);
    db.close();
  });
});

describe('weight unit setting', () => {
  let db: TestDb;

  beforeEach(async () => {
    db = await openAppTestDb();
  });

  afterEach(() => db.close());

  it('defaults to kilograms and remembers pounds', async () => {
    expect((await getSettings(db)).weightUnit).toBe('kg');

    await updateSettings(db, { weightUnit: 'lb' });

    expect((await getSettings(db)).weightUnit).toBe('lb');
  });

  it('keeps enough precision for a weight entered in pounds', async () => {
    // 165 lb is 74.8427 kg.
    await logWeight(db, { logDate: DAY, weightKg: 74.8427 });

    expect((await getWeights(db, DAY, DAY))[0].weightKg).toBe(74.84);
  });
});
