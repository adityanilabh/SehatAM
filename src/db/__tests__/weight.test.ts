import { openAppTestDb, type TestDb } from '../testing/node-sqlite-db';
import { deleteWeight, getFirstWeight, getRecentWeights, getWeights, logWeight } from '../weight';

let mockNextId = 0;
jest.mock('@/lib/id', () => ({ newId: () => `id-${++mockNextId}` }));

describe('weight log', () => {
  let db: TestDb;

  beforeEach(async () => {
    mockNextId = 0;
    db = await openAppTestDb();
  });

  afterEach(() => db.close());

  it('records a weight, rounded to two decimal places', async () => {
    await logWeight(db, { logDate: '2026-10-12', weightKg: 74.204 });

    const [entry] = await getWeights(db, '2026-10-01', '2026-10-31');
    expect(entry).toMatchObject({ id: 'id-1', logDate: '2026-10-12', weightKg: 74.2 });
  });

  it('replaces the weight when the same day is logged again', async () => {
    await logWeight(db, { logDate: '2026-10-12', weightKg: 74.2 });
    await logWeight(db, { logDate: '2026-10-12', weightKg: 73.9 });

    const entries = await getWeights(db, '2026-10-01', '2026-10-31');
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ id: 'id-1', weightKg: 73.9 });
  });

  it('rejects weights no person could have', async () => {
    await expect(logWeight(db, { logDate: '2026-10-12', weightKg: 5 })).rejects.toThrow(/between/);
    await expect(logWeight(db, { logDate: '2026-10-12', weightKg: 900 })).rejects.toThrow();
    await expect(logWeight(db, { logDate: '2026-10-12', weightKg: NaN })).rejects.toThrow();
    expect(await getWeights(db, '2026-01-01', '2026-12-31')).toEqual([]);
  });

  it('returns a range oldest first and recent entries newest first', async () => {
    await logWeight(db, { logDate: '2026-10-10', weightKg: 75 });
    await logWeight(db, { logDate: '2026-09-01', weightKg: 76 });
    await logWeight(db, { logDate: '2026-10-12', weightKg: 74.2 });

    const inRange = await getWeights(db, '2026-10-01', '2026-10-12');
    expect(inRange.map((entry) => entry.weightKg)).toEqual([75, 74.2]);

    const recent = await getRecentWeights(db, '2026-10-12', 2);
    expect(recent.map((entry) => entry.logDate)).toEqual(['2026-10-12', '2026-10-10']);

    expect(await getFirstWeight(db)).toMatchObject({ logDate: '2026-09-01', weightKg: 76 });
  });

  it('lets a day be logged again after its weight is deleted', async () => {
    await logWeight(db, { logDate: '2026-10-12', weightKg: 74.2 });
    const [entry] = await getWeights(db, '2026-10-12', '2026-10-12');

    await deleteWeight(db, entry.id);
    expect(await getWeights(db, '2026-10-12', '2026-10-12')).toEqual([]);
    expect(await getFirstWeight(db)).toBeNull();

    await logWeight(db, { logDate: '2026-10-12', weightKg: 74 });
    expect(await getWeights(db, '2026-10-12', '2026-10-12')).toHaveLength(1);
  });
});
