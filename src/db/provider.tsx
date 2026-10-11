import * as SQLite from 'expo-sqlite';
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useEffectEvent,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { StyleSheet, View } from 'react-native';

import { DATABASE_NAME, prepareDb, type AppDb, type SqlParams } from './database';
import { DEFAULT_SETTINGS, getSettings, type Settings } from './settings';

import { AppText } from '@/components/app-text';
import { Colors, Spacing } from '@/constants/theme';

type DbContextValue = {
  db: AppDb;
  settings: Settings;
  /** Changes whenever data is written; queries re-run when it does. */
  revision: number;
  /** Call after any write so every screen showing that data refreshes. */
  invalidate: () => void;
};

const DbContext = createContext<DbContextValue | null>(null);

// One connection for the whole app. On the web a second open would fail, and
// development mode mounts components twice.
let opening: Promise<AppDb> | null = null;

function openAppDb(): Promise<AppDb> {
  opening ??= (async () => {
    const sqlite = await SQLite.openDatabaseAsync(DATABASE_NAME);
    // SQLite allows one transaction at a time on a connection. Two writes started
    // close together (a double tap, or a save on blur and on a button press) would
    // otherwise fail with "cannot start a transaction within a transaction", so
    // transactions wait their turn.
    let lastTransaction: Promise<unknown> = Promise.resolve();
    const db: AppDb = {
      runAsync: (source: string, params: SqlParams) => sqlite.runAsync(source, params),
      getAllAsync: <T,>(source: string, params: SqlParams) => sqlite.getAllAsync<T>(source, params),
      getFirstAsync: <T,>(source: string, params: SqlParams = []) =>
        sqlite.getFirstAsync<T>(source, params),
      execAsync: (source) => sqlite.execAsync(source),
      withTransactionAsync: (task) => {
        const run = lastTransaction.then(() => sqlite.withTransactionAsync(task));
        lastTransaction = run.catch(() => undefined);
        return run;
      },
    };
    await prepareDb(db);
    return db;
  })();
  opening.catch(() => {
    opening = null;
  });
  return opening;
}

function describeOpenError(error: unknown): string {
  const text = String(error);
  if (text.includes('NoModificationAllowedError') || text.includes('Access Handle')) {
    return 'SehatAM is already open in another tab. Close the other tab, then reload this one.';
  }
  return `Your data could not be opened. Close the app and open it again.\n\n${text}`;
}

export function DbProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<AppDb | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let live = true;
    openAppDb().then(
      (opened) => live && setDb(opened),
      (reason) => live && setError(describeOpenError(reason))
    );
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    if (!db) return;
    let live = true;
    getSettings(db).then(
      (loaded) => live && setSettings(loaded),
      () => live && setSettings(DEFAULT_SETTINGS)
    );
    return () => {
      live = false;
    };
  }, [db, revision]);

  const invalidate = useCallback(() => setRevision((current) => current + 1), []);

  const value = useMemo(
    () => (db && settings ? { db, settings, revision, invalidate } : null),
    [db, settings, revision, invalidate]
  );

  if (error) {
    return (
      <View style={styles.message}>
        <AppText type="heading">Something went wrong</AppText>
        <AppText type="caption" style={styles.detail}>
          {error}
        </AppText>
      </View>
    );
  }

  // Nothing is drawn for the moment it takes to open the database.
  if (!value) return <View style={styles.message} />;

  return <DbContext value={value}>{children}</DbContext>;
}

export function useDb(): DbContextValue {
  const value = use(DbContext);
  if (!value) {
    throw new Error('useDb must be used inside DbProvider.');
  }
  return value;
}

/**
 * Runs a read and re-runs it whenever data changes. `key` names the query and its
 * inputs: when the key changes, the query runs again. Returns undefined until the
 * first result arrives.
 */
export function useDbQuery<T>(key: string, query: (db: AppDb) => Promise<T>): T | undefined {
  const { db, revision } = useDb();
  const [result, setResult] = useState<{ key: string; value: T }>();
  const run = useEffectEvent(() => query(db));

  useEffect(() => {
    let live = true;
    run().then(
      (value) => live && setResult({ key, value }),
      (reason) => console.error(`Query "${key}" failed`, reason)
    );
    return () => {
      live = false;
    };
  }, [key, revision]);

  // A result for an earlier key is stale, so it is not shown.
  return result?.key === key ? result.value : undefined;
}

const styles = StyleSheet.create({
  message: {
    flex: 1,
    backgroundColor: Colors.ground,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.five,
    gap: Spacing.two,
  },
  detail: {
    textAlign: 'center',
  },
});
