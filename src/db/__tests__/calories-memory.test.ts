import { deleteAllData, exportData, importData, parseBackup } from '../backup';
import { prepareDb } from '../database';
import { addFood, deleteFood, getFoodForDay, updateFood } from '../food';
import { getDayTotals, getFoodSuggestions, setFoodCalories } from '../food-totals';
import { estimateFor, getMemory, rememberCalories } from '../memory';
import { migrate } from '../migrate';
import { migrations } from '../schema';
import { openAppTestDb, openTestDb, type TestDb } from '../testing/node-sqlite-db';

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

describe('calories on food items', () => {
  it('stores the figure and where it came from', async () => {
    await addFood(db, { logDate: DAY, foodText: '2 roti', calories: 160, calorieSource: 'list' });
    await addFood(db, { logDate: DAY, foodText: 'mystery dish' });

    const entries = await getFoodForDay(db, DAY);

    expect(entries.map((entry) => [entry.foodText, entry.calories, entry.calorieSource])).toEqual([
      ['2 roti', 160, 'list'],
      ['mystery dish', null, null],
    ]);
  });

  it('treats a typed figure as manual and rounds it', async () => {
    const entry = await addFood(db, { logDate: DAY, foodText: 'thali', calories: 640.6 });

    expect(entry).toMatchObject({ calories: 641, calorieSource: 'manual' });
  });

  it('ignores a figure that makes no sense', async () => {
    const entry = await addFood(db, { logDate: DAY, foodText: 'thali', calories: -20 });

    expect(entry).toMatchObject({ calories: null, calorieSource: null });
  });

  it('changes or clears the figure when an item is edited', async () => {
    const entry = await addFood(db, { logDate: DAY, foodText: 'thali', calories: 600 });

    await updateFood(db, entry.id, {
      logDate: DAY,
      foodText: 'thali',
      calories: 700,
      calorieSource: 'ai',
    });
    expect((await getFoodForDay(db, DAY))[0]).toMatchObject({ calories: 700, calorieSource: 'ai' });

    await updateFood(db, entry.id, { logDate: DAY, foodText: 'thali', calories: null });
    expect((await getFoodForDay(db, DAY))[0]).toMatchObject({ calories: null, calorieSource: null });
  });

  it('sets only the calories without touching the rest', async () => {
    const entry = await addFood(db, { logDate: DAY, foodText: 'thali', meal: 'lunch' }, time(0));

    await setFoodCalories(db, entry.id, 650.4, 'ai', time(5));

    expect((await getFoodForDay(db, DAY))[0]).toMatchObject({
      foodText: 'thali',
      meal: 'lunch',
      calories: 650,
      calorieSource: 'ai',
      updatedAt: '2026-10-12T10:05:00.000Z',
    });
  });
});

describe('day totals', () => {
  it('adds up calories and counts the items still without a figure', async () => {
    await addFood(db, { logDate: DAY, foodText: 'roti', calories: 80, calorieSource: 'list' });
    await addFood(db, { logDate: DAY, foodText: 'dal', calories: 150, calorieSource: 'list' });
    await addFood(db, { logDate: DAY, foodText: 'mystery dish' });
    const removed = await addFood(db, { logDate: DAY, foodText: 'samosa', calories: 260 });
    await deleteFood(db, removed.id);
    await addFood(db, { logDate: '2026-10-11', foodText: 'poha', calories: 180 });

    expect(await getDayTotals(db, '2026-10-06', DAY)).toEqual({
      '2026-10-11': { items: 1, kcal: 180, missing: 0 },
      [DAY]: { items: 3, kcal: 230, missing: 1 },
    });
  });

  it('reports zero calories for a day where nothing has a figure', async () => {
    await addFood(db, { logDate: DAY, foodText: 'mystery dish' });

    expect(await getDayTotals(db, DAY, DAY)).toEqual({ [DAY]: { items: 1, kcal: 0, missing: 1 } });
  });
});

describe('food memory', () => {
  it('starts empty and estimates from the built-in list', async () => {
    expect(await getMemory(db)).toEqual([]);
    expect((await estimateFor(db, '3 egg white and 1 whole egg')).total).toBe(123);
    expect((await estimateFor(db, '2 chilka moong')).total).toBeNull();
  });

  it('remembers a figure and uses it for other amounts of the same food', async () => {
    await rememberCalories(db, '2 chilka moong', 240);

    expect((await estimateFor(db, '2 chilka moong')).total).toBe(240);
    expect(await estimateFor(db, '3 chilka moong + 1 greek yogurt')).toMatchObject({
      total: 480,
      source: 'memory',
    });
  });

  it('replaces an earlier figure for the same food', async () => {
    await rememberCalories(db, '2 chilka moong', 240, time(0));
    await rememberCalories(db, '2 chilka moong', 300, time(5));

    expect((await estimateFor(db, '1 chilka moong')).total).toBe(150);
    expect(await getMemory(db)).toHaveLength(2);
  });

  it('survives export and import, and is removed by "delete all"', async () => {
    await rememberCalories(db, '2 chilka moong', 240);
    await addFood(db, { logDate: DAY, foodText: '2 chilka moong', calories: 240, calorieSource: 'ai' });
    const backup = parseBackup(JSON.stringify(await exportData(db)));

    await deleteAllData(db);
    expect(await getMemory(db)).toEqual([]);

    await importData(db, backup);
    expect((await estimateFor(db, '4 chilka moong')).total).toBe(480);
    expect((await getFoodForDay(db, DAY))[0]).toMatchObject({ calories: 240, calorieSource: 'ai' });
  });

  it('imports a backup made before the memory existed', async () => {
    const oldFile = JSON.stringify({ app: 'SehatAM', formatVersion: 2, food: [], weight: [] });

    await importData(db, parseBackup(oldFile));

    expect(await getMemory(db)).toEqual([]);
  });
});

describe('suggestions from past food', () => {
  it('offers earlier foods containing the typed text, most recent first, once each', async () => {
    await addFood(db, { logDate: DAY, foodText: 'Paneer wrap' }, time(1));
    await addFood(db, { logDate: DAY, foodText: 'Palak paneer' }, time(2));
    await addFood(db, { logDate: DAY, foodText: 'paneer wrap' }, time(3));
    await addFood(db, { logDate: DAY, foodText: 'Dal' }, time(4));

    const suggestions = await getFoodSuggestions(db, 'pan');

    expect(suggestions.map((food) => food.toLowerCase())).toEqual(['paneer wrap', 'palak paneer']);
  });

  it('offers nothing for a single letter, for an exact match, or from deleted items', async () => {
    const removed = await addFood(db, { logDate: DAY, foodText: 'Paneer wrap' });
    await addFood(db, { logDate: DAY, foodText: 'Dal' });
    await deleteFood(db, removed.id);

    expect(await getFoodSuggestions(db, 'p')).toEqual([]);
    expect(await getFoodSuggestions(db, 'dal')).toEqual([]);
    expect(await getFoodSuggestions(db, 'pan')).toEqual([]);
  });

  it('treats % and _ as ordinary characters', async () => {
    await addFood(db, { logDate: DAY, foodText: 'Dal' });

    expect(await getFoodSuggestions(db, '%%')).toEqual([]);
    expect(await getFoodSuggestions(db, 'd_l')).toEqual([]);
  });
});

describe('upgrade from the meals release', () => {
  it('adds calorie tracking and keeps the food already logged', async () => {
    const old = openTestDb();
    await migrate(old, migrations.slice(0, 2));
    await old.execAsync(`
      INSERT INTO food_entry (id, log_date, meal, food_text, created_at, updated_at)
      VALUES ('v2-1', '${DAY}', 'lunch', 'dal rice', 't', 't');
    `);

    await prepareDb(old);

    expect(await getFoodForDay(old, DAY)).toEqual([
      expect.objectContaining({ id: 'v2-1', meal: 'lunch', calories: null, calorieSource: null }),
    ]);
    expect(await getMemory(old)).toEqual([]);
    old.close();
  });
});
