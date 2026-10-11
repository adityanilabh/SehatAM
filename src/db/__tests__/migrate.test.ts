import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { getSchemaVersion, migrate, type Migration } from '../migrate';
import { openTestDb, type TestDb } from '../testing/node-sqlite-db';

const createNotes: Migration = {
  version: 1,
  up: (db) => db.execAsync('CREATE TABLE note (id TEXT PRIMARY KEY, body TEXT NOT NULL)'),
};

const addPinned: Migration = {
  version: 2,
  up: (db) => db.execAsync('ALTER TABLE note ADD COLUMN pinned INTEGER NOT NULL DEFAULT 0'),
};

describe('migrate', () => {
  let db: TestDb;

  beforeEach(() => {
    db = openTestDb();
  });

  afterEach(() => {
    db.close();
  });

  it('brings a new database to the latest version', async () => {
    expect(await getSchemaVersion(db)).toBe(0);

    const result = await migrate(db, [createNotes, addPinned]);

    expect(result).toEqual({ from: 0, to: 2 });
    expect(await getSchemaVersion(db)).toBe(2);
    expect(db.all('SELECT id, body, pinned FROM note')).toEqual([]);
  });

  it('keeps existing data when a later release adds a migration', async () => {
    await migrate(db, [createNotes]);
    await db.execAsync("INSERT INTO note (id, body) VALUES ('a', 'kept')");

    const result = await migrate(db, [createNotes, addPinned]);

    expect(result).toEqual({ from: 1, to: 2 });
    expect(db.all('SELECT id, body, pinned FROM note')).toEqual([
      { id: 'a', body: 'kept', pinned: 0 },
    ]);
  });

  it('does nothing when the database is already up to date', async () => {
    await migrate(db, [createNotes, addPinned]);

    const result = await migrate(db, [createNotes, addPinned]);

    expect(result).toEqual({ from: 2, to: 2 });
  });

  it('rolls back a failed migration and leaves the version unchanged', async () => {
    await migrate(db, [createNotes]);
    await db.execAsync("INSERT INTO note (id, body) VALUES ('a', 'kept')");

    const broken: Migration = {
      version: 2,
      up: async (target) => {
        await target.execAsync('ALTER TABLE note ADD COLUMN pinned INTEGER NOT NULL DEFAULT 0');
        await target.execAsync('INSERT INTO missing_table VALUES (1)');
      },
    };

    await expect(migrate(db, [createNotes, broken])).rejects.toThrow(/missing_table/);

    expect(await getSchemaVersion(db)).toBe(1);
    // The half-applied column is gone and the row survived.
    expect(db.all('SELECT * FROM note')).toEqual([{ id: 'a', body: 'kept' }]);
  });

  it('refuses a database written by a newer build', async () => {
    await migrate(db, [createNotes, addPinned]);

    await expect(migrate(db, [createNotes])).rejects.toThrow(/only knows up to version 1/);
  });

  it('rejects migrations that are not numbered in order', async () => {
    await expect(migrate(db, [addPinned])).rejects.toThrow(/numbered 1, 2, 3/);
  });
});

describe('migrate, across app restarts', () => {
  it('upgrades a database file left by the previous release', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'sehatam-migrate-'));
    const file = join(dir, 'app.db');

    try {
      const oldRelease = openTestDb(file);
      await migrate(oldRelease, [createNotes]);
      await oldRelease.execAsync("INSERT INTO note (id, body) VALUES ('a', 'kept')");
      oldRelease.close();

      const newRelease = openTestDb(file);
      const result = await migrate(newRelease, [createNotes, addPinned]);

      expect(result).toEqual({ from: 1, to: 2 });
      expect(newRelease.all('SELECT id, body, pinned FROM note')).toEqual([
        { id: 'a', body: 'kept', pinned: 0 },
      ]);
      newRelease.close();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
