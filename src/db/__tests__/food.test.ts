import {
  addFood,
  deleteFood,
  getFoodCountsByDay,
  getFoodForDay,
  getLoggedDates,
  updateFood,
} from '../food';
import { openAppTestDb, type TestDb } from '../testing/node-sqlite-db';

let mockNextId = 0;
jest.mock('@/lib/id', () => ({ newId: () => `id-${++mockNextId}` }));

const DAY = '2026-10-12';
const time = (minute: number) => new Date(Date.UTC(2026, 9, 12, 10, minute));

describe('food log', () => {
  let db: TestDb;

  beforeEach(async () => {
    mockNextId = 0;
    db = await openAppTestDb();
  });

  afterEach(() => db.close());

  it('adds an item with only the food text', async () => {
    const entry = await addFood(db, { logDate: DAY, foodText: '  2 roti with ghee ' }, time(0));

    expect(entry).toEqual({
      id: 'id-1',
      logDate: DAY,
      meal: null,
      eatenAt: null,
      foodText: '2 roti with ghee',
      quantity: null,
      calories: null,
      createdAt: '2026-10-12T10:00:00.000Z',
      updatedAt: '2026-10-12T10:00:00.000Z',
    });
    expect(await getFoodForDay(db, DAY)).toEqual([entry]);
  });

  it('refuses an empty item', async () => {
    await expect(addFood(db, { logDate: DAY, foodText: '   ' })).rejects.toThrow(/empty/);
    expect(await getFoodForDay(db, DAY)).toEqual([]);
  });

  it('lists timed items in time order, then untimed items as added', async () => {
    await addFood(db, { logDate: DAY, foodText: 'nuts' }, time(1));
    await addFood(db, { logDate: DAY, foodText: 'dal rice', eatenAt: '13:10' }, time(2));
    await addFood(db, { logDate: DAY, foodText: 'biscuit' }, time(3));
    await addFood(db, { logDate: DAY, foodText: 'roti', eatenAt: '08:30' }, time(4));

    const names = (await getFoodForDay(db, DAY)).map((entry) => entry.foodText);

    expect(names).toEqual(['roti', 'dal rice', 'nuts', 'biscuit']);
  });

  it('keeps each day separate', async () => {
    await addFood(db, { logDate: '2026-10-11', foodText: 'yesterday' });
    await addFood(db, { logDate: DAY, foodText: 'today' });

    expect((await getFoodForDay(db, DAY)).map((entry) => entry.foodText)).toEqual(['today']);
  });

  it('edits an item, including moving it to another day', async () => {
    const entry = await addFood(db, { logDate: DAY, foodText: 'chai', eatenAt: '01:00' }, time(0));

    await updateFood(
      db,
      entry.id,
      { logDate: '2026-10-11', foodText: 'chai with sugar', eatenAt: null, quantity: '1 cup' },
      time(5)
    );

    expect(await getFoodForDay(db, DAY)).toEqual([]);
    expect(await getFoodForDay(db, '2026-10-11')).toEqual([
      {
        ...entry,
        logDate: '2026-10-11',
        foodText: 'chai with sugar',
        eatenAt: null,
        quantity: '1 cup',
        updatedAt: '2026-10-12T10:05:00.000Z',
      },
    ]);
  });

  it('hides a deleted item but keeps the row for sync', async () => {
    const entry = await addFood(db, { logDate: DAY, foodText: 'chai' }, time(0));

    await deleteFood(db, entry.id, time(9));

    expect(await getFoodForDay(db, DAY)).toEqual([]);
    expect(db.all('SELECT id, deleted_at, updated_at FROM food_entry')).toEqual([
      {
        id: entry.id,
        deleted_at: '2026-10-12T10:09:00.000Z',
        updated_at: '2026-10-12T10:09:00.000Z',
      },
    ]);
  });

  it('counts items per day and ignores deleted ones', async () => {
    await addFood(db, { logDate: '2026-10-10', foodText: 'a' });
    await addFood(db, { logDate: DAY, foodText: 'b' });
    const removed = await addFood(db, { logDate: DAY, foodText: 'c' });
    await addFood(db, { logDate: '2026-10-13', foodText: 'outside the range' });
    await deleteFood(db, removed.id);

    expect(await getFoodCountsByDay(db, '2026-10-06', DAY)).toEqual({
      '2026-10-10': 1,
      [DAY]: 1,
    });
  });

  it('lists the days that have items, newest first', async () => {
    await addFood(db, { logDate: '2026-10-10', foodText: 'a' });
    await addFood(db, { logDate: DAY, foodText: 'b' });
    await addFood(db, { logDate: DAY, foodText: 'c' });
    await addFood(db, { logDate: '2026-10-14', foodText: 'future' });

    expect(await getLoggedDates(db, DAY)).toEqual([DAY, '2026-10-10']);
  });
});
