import * as SQLite from 'expo-sqlite';
import { DEFAULT_CATEGORIES } from './categories';

const DATABASE_NAME = 'catatduit.db';
const DATABASE_VERSION = 1;

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = openAndMigrate();
  }
  return databasePromise;
}

async function openAndMigrate(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);

  await db.execAsync('PRAGMA journal_mode = WAL');
  await db.execAsync('PRAGMA foreign_keys = ON');

  const versionRow = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version',
  );
  const currentVersion = versionRow?.user_version ?? 0;

  // Run the idempotent DDL on every open. This repairs a partial migration
  // (possible on web if OPFS is interrupted) instead of trusting user_version
  // blindly and failing later on a missing table.
  await ensureSchema(db);

  if (currentVersion < DATABASE_VERSION) {
    await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
  }

  await seedDefaultCategories(db);
  return db;
}

async function ensureSchema(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('expense', 'income', 'both')),
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      is_default INTEGER NOT NULL DEFAULT 0,
      is_archived INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 100
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY NOT NULL,
      server_id TEXT,
      client_id TEXT NOT NULL UNIQUE,
      category_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
      amount INTEGER NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      transaction_date TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      sync_status TEXT NOT NULL DEFAULT 'local'
        CHECK (sync_status IN ('local', 'pending', 'synced', 'failed')),
      sync_error TEXT,
      FOREIGN KEY (category_id) REFERENCES categories (id)
        ON UPDATE CASCADE ON DELETE RESTRICT
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_date
      ON transactions (transaction_date DESC, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_transactions_category
      ON transactions (category_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_sync
      ON transactions (sync_status);

    CREATE TABLE IF NOT EXISTS outbox (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      op TEXT NOT NULL CHECK (op IN ('create', 'update', 'delete')),
      transaction_id TEXT NOT NULL,
      server_id TEXT,
      created_at TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      last_error TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_outbox_transaction
      ON outbox (transaction_id);

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);
}

async function seedDefaultCategories(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.withTransactionAsync(async () => {
    for (const [index, category] of DEFAULT_CATEGORIES.entries()) {
      await db.runAsync(
        `INSERT INTO categories
          (id, name, type, icon, color, is_default, is_archived, sort_order)
         VALUES (?, ?, ?, ?, ?, 1, 0, ?)
         ON CONFLICT(id) DO UPDATE SET
           name = excluded.name,
           type = excluded.type,
           icon = excluded.icon,
           color = excluded.color,
           is_default = 1,
           sort_order = excluded.sort_order`,
        [
          category.id,
          category.name,
          category.type,
          category.icon,
          category.color,
          index,
        ],
      );
    }
  });
}

export async function resetLocalData(): Promise<void> {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.execAsync('DELETE FROM outbox');
    await db.execAsync('DELETE FROM transactions');
    await db.execAsync('DELETE FROM settings');
    await db.execAsync('DELETE FROM categories WHERE is_default = 0');
  });
  await seedDefaultCategories(db);
}
