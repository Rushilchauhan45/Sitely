/**
 * SQLite Database Module
 * ---------------------
 * Replaces AsyncStorage JSON-blob storage with proper relational tables.
 * Uses expo-sqlite **async** API so it works on both native and web.
 *
 * Tables: settings, sites, workers, hajari, expenses, payments, photos
 *
 * Includes one-time migration from AsyncStorage → SQLite.
 */

import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Site, Worker, HajariRecord, ExpenseRecord, PaymentRecord, SitePhoto } from './types';
import type { Language } from './i18n';

// ── Database singleton ───────────────────────────────────────────────
let _db: SQLite.SQLiteDatabase | null = null;
let _dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDB(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  if (!_dbPromise) {
    _dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync('site_expense_tracker.db');
      await db.execAsync('PRAGMA journal_mode = WAL;');
      await db.execAsync('PRAGMA foreign_keys = ON;');
      _db = db;
      return db;
    })();
  }
  return _dbPromise;
}

// ── Schema creation ──────────────────────────────────────────────────
export async function createTables(): Promise<void> {
  const db = await getDB();

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS sites (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      type       TEXT NOT NULL,
      location   TEXT NOT NULL,
      startDate  TEXT NOT NULL,
      endDate    TEXT NOT NULL,
      isRunning  INTEGER NOT NULL DEFAULT 1,
      ownerName  TEXT NOT NULL,
      contact    TEXT NOT NULL,
      createdAt  TEXT NOT NULL
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS workers (
      id           TEXT PRIMARY KEY,
      siteId       TEXT NOT NULL,
      name         TEXT NOT NULL,
      age          TEXT NOT NULL,
      contact      TEXT NOT NULL,
      village      TEXT NOT NULL,
      category     TEXT NOT NULL CHECK(category IN ('karigar', 'majdur')),
      photoUri     TEXT,
      joiningDate  TEXT NOT NULL,
      FOREIGN KEY (siteId) REFERENCES sites(id) ON DELETE CASCADE
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS hajari (
      id              TEXT PRIMARY KEY,
      siteId          TEXT NOT NULL,
      workerId        TEXT NOT NULL,
      workerName      TEXT NOT NULL,
      workerCategory  TEXT NOT NULL,
      amount          REAL NOT NULL,
      date            TEXT NOT NULL,
      time            TEXT NOT NULL,
      FOREIGN KEY (siteId) REFERENCES sites(id) ON DELETE CASCADE
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS expenses (
      id              TEXT PRIMARY KEY,
      siteId          TEXT NOT NULL,
      workerId        TEXT NOT NULL,
      workerName      TEXT NOT NULL,
      workerCategory  TEXT NOT NULL,
      amount          REAL NOT NULL,
      date            TEXT NOT NULL,
      time            TEXT NOT NULL,
      FOREIGN KEY (siteId) REFERENCES sites(id) ON DELETE CASCADE
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS payments (
      id              TEXT PRIMARY KEY,
      siteId          TEXT NOT NULL,
      workerId        TEXT NOT NULL,
      workerName      TEXT NOT NULL,
      workerCategory  TEXT NOT NULL,
      amount          REAL NOT NULL,
      date            TEXT NOT NULL,
      time            TEXT NOT NULL,
      FOREIGN KEY (siteId) REFERENCES sites(id) ON DELETE CASCADE
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS photos (
      id          TEXT PRIMARY KEY,
      siteId      TEXT NOT NULL,
      uri         TEXT NOT NULL,
      description TEXT NOT NULL,
      date        TEXT NOT NULL,
      time        TEXT NOT NULL,
      groupId     TEXT,
      FOREIGN KEY (siteId) REFERENCES sites(id) ON DELETE CASCADE
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS photo_groups (
      id          TEXT PRIMARY KEY,
      siteId      TEXT NOT NULL,
      name        TEXT NOT NULL,
      createdAt   TEXT NOT NULL,
      FOREIGN KEY (siteId) REFERENCES sites(id) ON DELETE CASCADE
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS materials (
      id               TEXT PRIMARY KEY,
      siteId           TEXT NOT NULL,
      name             TEXT NOT NULL,
      vendorName       TEXT NOT NULL DEFAULT '',
      vendorPhone      TEXT NOT NULL DEFAULT '',
      quantity          REAL NOT NULL DEFAULT 0,
      unit             TEXT NOT NULL DEFAULT 'units',
      ratePerUnit      REAL NOT NULL DEFAULT 0,
      totalAmount      REAL NOT NULL DEFAULT 0,
      amountPaid       REAL NOT NULL DEFAULT 0,
      remainingPayment REAL NOT NULL DEFAULT 0,
      billPhotoUri     TEXT,
      date             TEXT NOT NULL,
      time             TEXT NOT NULL,
      FOREIGN KEY (siteId) REFERENCES sites(id) ON DELETE CASCADE
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS material_usages (
      id          TEXT PRIMARY KEY,
      materialId  TEXT NOT NULL,
      siteId      TEXT NOT NULL,
      quantityUsed REAL NOT NULL,
      note        TEXT NOT NULL DEFAULT '',
      date        TEXT NOT NULL,
      time        TEXT NOT NULL,
      FOREIGN KEY (materialId) REFERENCES materials(id) ON DELETE CASCADE,
      FOREIGN KEY (siteId) REFERENCES sites(id) ON DELETE CASCADE
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS todos (
      id          TEXT PRIMARY KEY,
      title       TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      type        TEXT NOT NULL DEFAULT 'daily' CHECK(type IN ('daily', 'monthly')),
      deadline    TEXT,
      completed   INTEGER NOT NULL DEFAULT 0,
      siteId      TEXT,
      createdAt   TEXT NOT NULL
    );
  `);

  // Add siteCode column to sites if not exists (migration-safe)
  try {
    await db.execAsync('ALTER TABLE sites ADD COLUMN siteCode TEXT DEFAULT NULL;');
  } catch (_e) {
    // Column already exists — ignore
  }

  // Add userId column to sites for per-user data isolation
  try {
    await db.execAsync('ALTER TABLE sites ADD COLUMN userId TEXT DEFAULT NULL;');
  } catch (_e) {}

  // Add overtime column to hajari
  try {
    await db.execAsync('ALTER TABLE hajari ADD COLUMN overtime REAL DEFAULT 0;');
  } catch (_e) {}

  // Add payment method column
  try {
    await db.execAsync("ALTER TABLE payments ADD COLUMN method TEXT DEFAULT 'cash';");
  } catch (_e) {}

  // Add todo priority column
  try {
    await db.execAsync("ALTER TABLE todos ADD COLUMN priority TEXT DEFAULT 'medium';");
  } catch (_e) {}

  // Indexes for common queries
  await db.execAsync('CREATE INDEX IF NOT EXISTS idx_workers_siteId ON workers(siteId);');
  await db.execAsync('CREATE INDEX IF NOT EXISTS idx_hajari_siteId ON hajari(siteId);');
  await db.execAsync('CREATE INDEX IF NOT EXISTS idx_expenses_siteId ON expenses(siteId);');
  await db.execAsync('CREATE INDEX IF NOT EXISTS idx_payments_siteId ON payments(siteId);');
  await db.execAsync('CREATE INDEX IF NOT EXISTS idx_photos_siteId ON photos(siteId);');
  await db.execAsync('CREATE INDEX IF NOT EXISTS idx_materials_siteId ON materials(siteId);');
  await db.execAsync('CREATE INDEX IF NOT EXISTS idx_material_usages_materialId ON material_usages(materialId);');
  await db.execAsync('CREATE INDEX IF NOT EXISTS idx_photo_groups_siteId ON photo_groups(siteId);');
  await db.execAsync('CREATE INDEX IF NOT EXISTS idx_todos_type ON todos(type);');
}

// ── AsyncStorage → SQLite one-time migration ─────────────────────────
const MIGRATION_KEY = '@sqlite_migrated';
const OLD_KEYS = {
  LANGUAGE: '@language',
  ONBOARDING: '@onboarding_done',
  SITES: '@sites',
  WORKERS: '@workers',
  HAJARI: '@hajari',
  EXPENSES: '@expenses',
  PAYMENTS: '@payments',
  PHOTOS: '@photos',
};

export async function migrateFromAsyncStorage(): Promise<void> {
  // Skip if already migrated
  const alreadyDone = await AsyncStorage.getItem(MIGRATION_KEY);
  if (alreadyDone === 'true') return;

  const db = await getDB();

  try {
    // ── Settings ──
    const lang = await AsyncStorage.getItem(OLD_KEYS.LANGUAGE);
    if (lang) {
      await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['language', lang]);
    }

    const onboarding = await AsyncStorage.getItem(OLD_KEYS.ONBOARDING);
    if (onboarding) {
      await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['onboarding_done', onboarding]);
    }

    // ── Sites ──
    const sitesStr = await AsyncStorage.getItem(OLD_KEYS.SITES);
    if (sitesStr) {
      const sites: Site[] = JSON.parse(sitesStr);
      for (const s of sites) {
        await db.runAsync(
          `INSERT OR IGNORE INTO sites (id, name, type, location, startDate, endDate, isRunning, ownerName, contact, createdAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [s.id, s.name, s.type, s.location, s.startDate, s.endDate, s.isRunning ? 1 : 0, s.ownerName, s.contact, s.createdAt]
        );
      }
    }

    // ── Workers ──
    const workersStr = await AsyncStorage.getItem(OLD_KEYS.WORKERS);
    if (workersStr) {
      const workers: Worker[] = JSON.parse(workersStr);
      for (const w of workers) {
        await db.runAsync(
          `INSERT OR IGNORE INTO workers (id, siteId, name, age, contact, village, category, photoUri, joiningDate)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [w.id, w.siteId, w.name, w.age, w.contact, w.village, w.category, w.photoUri, w.joiningDate]
        );
      }
    }

    // ── Hajari ──
    const hajariStr = await AsyncStorage.getItem(OLD_KEYS.HAJARI);
    if (hajariStr) {
      const records: HajariRecord[] = JSON.parse(hajariStr);
      for (const r of records) {
        await db.runAsync(
          `INSERT OR IGNORE INTO hajari (id, siteId, workerId, workerName, workerCategory, amount, date, time)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [r.id, r.siteId, r.workerId, r.workerName, r.workerCategory, r.amount, r.date, r.time]
        );
      }
    }

    // ── Expenses ──
    const expensesStr = await AsyncStorage.getItem(OLD_KEYS.EXPENSES);
    if (expensesStr) {
      const records: ExpenseRecord[] = JSON.parse(expensesStr);
      for (const r of records) {
        await db.runAsync(
          `INSERT OR IGNORE INTO expenses (id, siteId, workerId, workerName, workerCategory, amount, date, time)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [r.id, r.siteId, r.workerId, r.workerName, r.workerCategory, r.amount, r.date, r.time]
        );
      }
    }

    // ── Payments ──
    const paymentsStr = await AsyncStorage.getItem(OLD_KEYS.PAYMENTS);
    if (paymentsStr) {
      const records: PaymentRecord[] = JSON.parse(paymentsStr);
      for (const r of records) {
        await db.runAsync(
          `INSERT OR IGNORE INTO payments (id, siteId, workerId, workerName, workerCategory, amount, date, time)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [r.id, r.siteId, r.workerId, r.workerName, r.workerCategory, r.amount, r.date, r.time]
        );
      }
    }

    // ── Photos ──
    const photosStr = await AsyncStorage.getItem(OLD_KEYS.PHOTOS);
    if (photosStr) {
      const photos: SitePhoto[] = JSON.parse(photosStr);
      for (const p of photos) {
        await db.runAsync(
          `INSERT OR IGNORE INTO photos (id, siteId, uri, description, date, time)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [p.id, p.siteId, p.uri, p.description, p.date, p.time]
        );
      }
    }

    // Mark migration complete
    await AsyncStorage.setItem(MIGRATION_KEY, 'true');
    console.log('[DB] AsyncStorage → SQLite migration complete');
  } catch (err) {
    console.error('[DB] Migration failed:', err);
    // Don't mark as done so it retries next launch
  }
}

// ── Cleanup records older than 3 years ───────────────────────────────
export async function cleanupOldRecords(): Promise<void> {
  const db = await getDB();
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 3);
  const cutoffISO = cutoff.toISOString().split('T')[0]; // YYYY-MM-DD

  await db.runAsync('DELETE FROM hajari WHERE date < ?', [cutoffISO]);
  await db.runAsync('DELETE FROM expenses WHERE date < ?', [cutoffISO]);
  await db.runAsync('DELETE FROM payments WHERE date < ?', [cutoffISO]);
  console.log('[DB] Cleaned up records older than', cutoffISO);
}

// ── Initialise DB (call once at app startup) ─────────────────────────
let _initPromise: Promise<void> | null = null;

export function initDatabase(): Promise<void> {
  if (!_initPromise) {
    _initPromise = (async () => {
      await createTables();
      await migrateFromAsyncStorage();
      await cleanupOldRecords();
      console.log('[DB] Initialised successfully');
    })();
  }
  return _initPromise;
}
