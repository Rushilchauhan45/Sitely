/**
 * Storage Module — SQLite-backed
 * ────────────────────────────────
 * Drop-in replacement for the old AsyncStorage JSON-blob layer.
 * Every public function signature is identical so all screens work unchanged.
 */

import { Site, Worker, HajariRecord, ExpenseRecord, PaymentRecord, SitePhoto } from './types';
import { Language } from './i18n';
import { getDB, initDatabase } from './database';

// Re-export auth functions from the new auth service
export {
  type AuthUser,
  getSession as getAuthUser,
  saveSession as saveAuthUser,
  clearSession as logoutUser,
  emailSignUp as signUp,
  emailSignIn as signIn,
  logout,
  updateUserProfile,
  forgotPassword,
  googleSignIn,
  sendPhoneOTP,
  verifyPhoneOTP,
} from './auth';

// Re-export initDatabase so AppContext can call it at startup
export { initDatabase } from './database';

// ── Helpers ──────────────────────────────────────────────────────────
function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function threeYearsAgoISO(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 3);
  return d.toISOString().split('T')[0]; // YYYY-MM-DD
}

// ── Settings (language, onboarding) ──────────────────────────────────
export async function getLanguage(): Promise<Language> {
  await initDatabase();
  const db = await getDB();
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', ['language']);
  return (row?.value as Language) || 'en';
}

export async function setLanguage(lang: Language): Promise<void> {
  await initDatabase();
  const db = await getDB();
  await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['language', lang]);
}

export async function isOnboardingDone(): Promise<boolean> {
  await initDatabase();
  const db = await getDB();
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', ['onboarding_done']);
  const dbDone = row?.value === 'true';
  // Fallback: also check localStorage on web (SQLite may not persist across sessions)
  if (!dbDone && typeof window !== 'undefined' && window.localStorage) {
    const lsDone = window.localStorage.getItem('onboarding_done') === 'true';
    if (lsDone) {
      // Sync back to DB
      await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['onboarding_done', 'true']);
      return true;
    }
  }
  return dbDone;
}

export async function setOnboardingDone(): Promise<void> {
  await initDatabase();
  const db = await getDB();
  await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['onboarding_done', 'true']);
  // Also persist to localStorage on web as backup
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem('onboarding_done', 'true');
  }
}

export async function resetOnboardingDone(): Promise<void> {
  await initDatabase();
  const db = await getDB();
  await db.runAsync('DELETE FROM settings WHERE key = ?', ['onboarding_done']);
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem('onboarding_done');
  }
}

// ── Sites ────────────────────────────────────────────────────────────
export async function getSites(userId?: string): Promise<Site[]> {
  await initDatabase();
  const db = await getDB();
  let rows;
  if (userId) {
    rows = await db.getAllAsync<{
      id: string; name: string; type: string; location: string;
      startDate: string; endDate: string; isRunning: number;
      ownerName: string; contact: string; createdAt: string;
    }>('SELECT * FROM sites WHERE userId = ? OR userId IS NULL ORDER BY createdAt DESC', [userId]);
  } else {
    rows = await db.getAllAsync<{
      id: string; name: string; type: string; location: string;
      startDate: string; endDate: string; isRunning: number;
      ownerName: string; contact: string; createdAt: string;
    }>('SELECT * FROM sites ORDER BY createdAt DESC');
  }
  return rows.map(r => ({
    ...r,
    isRunning: r.isRunning === 1,
    type: r.type as Site['type'],
  }));
}

export async function addSite(site: Omit<Site, 'id' | 'createdAt'>, userId?: string): Promise<Site> {
  await initDatabase();
  const db = await getDB();
  const id = generateId();
  const createdAt = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO sites (id, name, type, location, startDate, endDate, isRunning, ownerName, contact, createdAt, siteCode, userId)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, site.name, site.type, site.location, site.startDate, site.endDate, site.isRunning ? 1 : 0, site.ownerName, site.contact, createdAt, site.siteCode || null, userId || null]
  );
  return { ...site, id, createdAt };
}

export async function deleteSite(siteId: string): Promise<void> {
  await initDatabase();
  const db = await getDB();
  // With ON DELETE CASCADE, child rows are removed automatically
  await db.runAsync('DELETE FROM sites WHERE id = ?', [siteId]);
}

// ── Workers ──────────────────────────────────────────────────────────
export async function getWorkers(siteId: string): Promise<Worker[]> {
  await initDatabase();
  const db = await getDB();
  return db.getAllAsync<Worker>('SELECT * FROM workers WHERE siteId = ? ORDER BY joiningDate DESC', [siteId]);
}

export async function addWorker(worker: Omit<Worker, 'id' | 'joiningDate'>): Promise<Worker> {
  await initDatabase();
  const db = await getDB();
  const id = generateId();
  const joiningDate = new Date().toISOString().split('T')[0];
  await db.runAsync(
    `INSERT INTO workers (id, siteId, name, age, contact, village, category, photoUri, joiningDate)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, worker.siteId, worker.name, worker.age, worker.contact, worker.village, worker.category, worker.photoUri, joiningDate]
  );
  return { ...worker, id, joiningDate };
}

export async function deleteWorker(workerId: string): Promise<void> {
  await initDatabase();
  const db = await getDB();
  await db.runAsync('DELETE FROM workers WHERE id = ?', [workerId]);
}

export async function updateWorker(workerId: string, updates: Partial<Omit<Worker, 'id' | 'siteId' | 'joiningDate'>>): Promise<void> {
  await initDatabase();
  const db = await getDB();
  const fields: string[] = [];
  const values: any[] = [];
  if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
  if (updates.age !== undefined) { fields.push('age = ?'); values.push(updates.age); }
  if (updates.contact !== undefined) { fields.push('contact = ?'); values.push(updates.contact); }
  if (updates.village !== undefined) { fields.push('village = ?'); values.push(updates.village); }
  if (updates.category !== undefined) { fields.push('category = ?'); values.push(updates.category); }
  if (updates.photoUri !== undefined) { fields.push('photoUri = ?'); values.push(updates.photoUri); }
  if (fields.length === 0) return;
  values.push(workerId);
  await db.runAsync(`UPDATE workers SET ${fields.join(', ')} WHERE id = ?`, values);
}

// ── Hajari (attendance / daily wage) ─────────────────────────────────
export async function getHajari(siteId: string): Promise<HajariRecord[]> {
  await initDatabase();
  const db = await getDB();
  const cutoff = threeYearsAgoISO();
  return db.getAllAsync<HajariRecord>(
    'SELECT * FROM hajari WHERE siteId = ? AND date > ? ORDER BY date DESC, time DESC',
    [siteId, cutoff]
  );
}

export async function addHajariRecords(records: Omit<HajariRecord, 'id'>[]): Promise<void> {
  await initDatabase();
  const db = await getDB();
  for (const r of records) {
    await db.runAsync(
      `INSERT INTO hajari (id, siteId, workerId, workerName, workerCategory, amount, overtime, date, time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [generateId(), r.siteId, r.workerId, r.workerName, r.workerCategory, r.amount, r.overtime || 0, r.date, r.time]
    );
  }
}

// ── Expenses ─────────────────────────────────────────────────────────
export async function getExpenses(siteId: string): Promise<ExpenseRecord[]> {
  await initDatabase();
  const db = await getDB();
  const cutoff = threeYearsAgoISO();
  return db.getAllAsync<ExpenseRecord>(
    'SELECT * FROM expenses WHERE siteId = ? AND date > ? ORDER BY date DESC, time DESC',
    [siteId, cutoff]
  );
}

export async function addExpenseRecords(records: Omit<ExpenseRecord, 'id'>[]): Promise<void> {
  await initDatabase();
  const db = await getDB();
  for (const r of records) {
    await db.runAsync(
      `INSERT INTO expenses (id, siteId, workerId, workerName, workerCategory, amount, date, time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [generateId(), r.siteId, r.workerId, r.workerName, r.workerCategory, r.amount, r.date, r.time]
    );
  }
}

// ── Payments ─────────────────────────────────────────────────────────
export async function getPayments(siteId: string): Promise<PaymentRecord[]> {
  await initDatabase();
  const db = await getDB();
  const cutoff = threeYearsAgoISO();
  return db.getAllAsync<PaymentRecord>(
    'SELECT * FROM payments WHERE siteId = ? AND date > ? ORDER BY date DESC, time DESC',
    [siteId, cutoff]
  );
}

export async function addPayment(record: Omit<PaymentRecord, 'id'>): Promise<void> {
  await initDatabase();
  const db = await getDB();
  await db.runAsync(
    `INSERT INTO payments (id, siteId, workerId, workerName, workerCategory, amount, date, time, method)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), record.siteId, record.workerId, record.workerName, record.workerCategory, record.amount, record.date, record.time, record.method || 'cash']
  );
}

// ── Photos ───────────────────────────────────────────────────────────
export async function getPhotos(siteId: string): Promise<SitePhoto[]> {
  await initDatabase();
  const db = await getDB();
  const resolvedId = Array.isArray(siteId) ? siteId[0] : siteId;
  console.log('[Storage] getPhotos called for siteId:', resolvedId);
  const results = await db.getAllAsync<SitePhoto>(
    'SELECT * FROM photos WHERE siteId = ? ORDER BY date DESC, time DESC',
    [resolvedId]
  );
  console.log('[Storage] getPhotos returned', results.length, 'photos');
  return results;
}

export async function addPhoto(photo: Omit<SitePhoto, 'id'>): Promise<void> {
  await initDatabase();
  const db = await getDB();
  const id = generateId();
  const desc = photo.description || '';
  console.log('[Storage] addPhoto called:', { id, siteId: photo.siteId, uri: photo.uri?.substring(0, 50), desc, date: photo.date, time: photo.time, groupId: photo.groupId });
  try {
    await db.runAsync(
      `INSERT INTO photos (id, siteId, uri, description, date, time, groupId)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, photo.siteId, photo.uri, desc, photo.date, photo.time, photo.groupId || null]
    );
    console.log('[Storage] Photo inserted successfully, id:', id);
  } catch (err: any) {
    console.error('[Storage] addPhoto SQL error:', err?.message, err);
    throw err;
  }
}

// ── Photo Groups ─────────────────────────────────────────────────────
import type { PhotoGroup } from './types';

export async function getPhotoGroups(siteId: string): Promise<PhotoGroup[]> {
  await initDatabase();
  const db = await getDB();
  return db.getAllAsync<PhotoGroup>(
    'SELECT * FROM photo_groups WHERE siteId = ? ORDER BY createdAt DESC',
    [siteId]
  );
}

export async function addPhotoGroup(group: Omit<PhotoGroup, 'id'>): Promise<PhotoGroup> {
  await initDatabase();
  const db = await getDB();
  const id = generateId();
  await db.runAsync(
    `INSERT INTO photo_groups (id, siteId, name, createdAt) VALUES (?, ?, ?, ?)`,
    [id, group.siteId, group.name, group.createdAt]
  );
  return { id, ...group };
}

// ── Site report data for CSV export ──────────────────────────────────
export async function getSiteReportCSV(siteId: string): Promise<string> {
  await initDatabase();
  const db = await getDB();
  const cutoff = threeYearsAgoISO();

  const workers = await db.getAllAsync<{ id: string; name: string; category: string }>(
    'SELECT id, name, category FROM workers WHERE siteId = ?',
    [siteId]
  );

  const lines: string[] = ['Worker Name,Category,Total Hajari,Total Expense,Total Paid,Remaining'];

  for (const w of workers) {
    const h = await db.getFirstAsync<{ total: number }>('SELECT COALESCE(SUM(amount + COALESCE(overtime, 0)),0) as total FROM hajari WHERE siteId=? AND workerId=? AND date>?', [siteId, w.id, cutoff]);
    const e = await db.getFirstAsync<{ total: number }>('SELECT COALESCE(SUM(amount),0) as total FROM expenses WHERE siteId=? AND workerId=? AND date>?', [siteId, w.id, cutoff]);
    const p = await db.getFirstAsync<{ total: number }>('SELECT COALESCE(SUM(amount),0) as total FROM payments WHERE siteId=? AND workerId=? AND date>?', [siteId, w.id, cutoff]);

    const hajari = h?.total ?? 0;
    const expense = e?.total ?? 0;
    const paid = p?.total ?? 0;
    const remaining = hajari - expense - paid;

    lines.push(`"${w.name}",${w.category},${hajari},${expense},${paid},${remaining}`);
  }

  return lines.join('\n');
}

export async function getPaymentHistoryCSV(siteId: string): Promise<string> {
  await initDatabase();
  const db = await getDB();
  const cutoff = threeYearsAgoISO();

  const payments = await db.getAllAsync<PaymentRecord>(
    'SELECT * FROM payments WHERE siteId = ? AND date > ? ORDER BY date DESC, time DESC',
    [siteId, cutoff]
  );

  const lines: string[] = ['No.,Worker Name,Category,Amount,Date,Time'];
  payments.forEach((p, i) => {
    lines.push(`${i + 1},"${p.workerName}",${p.workerCategory},${p.amount},${p.date},${p.time}`);
  });

  return lines.join('\n');
}

// ── Computed totals (uses SQL aggregation) ───────────────────────────
export async function getWorkerTotals(siteId: string, workerId: string) {
  await initDatabase();
  const db = await getDB();
  const cutoff = threeYearsAgoISO();

  const hRow = await db.getFirstAsync<{ total: number }>(
    'SELECT COALESCE(SUM(amount + COALESCE(overtime, 0)), 0) as total FROM hajari WHERE siteId = ? AND workerId = ? AND date > ?',
    [siteId, workerId, cutoff]
  );
  const eRow = await db.getFirstAsync<{ total: number }>(
    'SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE siteId = ? AND workerId = ? AND date > ?',
    [siteId, workerId, cutoff]
  );
  const pRow = await db.getFirstAsync<{ total: number }>(
    'SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE siteId = ? AND workerId = ? AND date > ?',
    [siteId, workerId, cutoff]
  );

  const totalHajari = hRow?.total ?? 0;
  const totalExpense = eRow?.total ?? 0;
  const totalPaid = pRow?.total ?? 0;
  const remaining = totalHajari - totalExpense - totalPaid;

  return { totalHajari, totalExpense, totalPaid, remaining };
}

// ── Materials (AsyncStorage based — later migrated to Firestore) ─────

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Material, MaterialUsage } from './types';

const MAT_KEY = (siteId: string) => `sitely_materials_${siteId}`;
const USAGE_KEY = (siteId: string, matId: string) => `sitely_usage_${siteId}_${matId}`;

// Migrate orphaned materials stored under empty siteId key
async function migrateOrphanedMaterials(siteId: string): Promise<void> {
  if (!siteId) return;
  try {
    const orphanKey = MAT_KEY('');
    const orphanJson = await AsyncStorage.getItem(orphanKey);
    if (!orphanJson) return;
    const orphanMats: Material[] = JSON.parse(orphanJson);
    if (orphanMats.length === 0) return;
    // Move orphaned materials to the correct siteId bucket
    const existing = await AsyncStorage.getItem(MAT_KEY(siteId));
    const existingMats: Material[] = existing ? JSON.parse(existing) : [];
    const existingIds = new Set(existingMats.map(m => m.id));
    const toMigrate = orphanMats.filter(m => !existingIds.has(m.id)).map(m => ({ ...m, siteId }));
    if (toMigrate.length > 0) {
      const merged = [...toMigrate, ...existingMats];
      await AsyncStorage.setItem(MAT_KEY(siteId), JSON.stringify(merged));
    }
    // Also migrate usages
    for (const m of orphanMats) {
      const oldUsageKey = USAGE_KEY('', m.id);
      const usageJson = await AsyncStorage.getItem(oldUsageKey);
      if (usageJson) {
        const newUsageKey = USAGE_KEY(siteId, m.id);
        const existingUsages = await AsyncStorage.getItem(newUsageKey);
        if (!existingUsages) {
          await AsyncStorage.setItem(newUsageKey, usageJson);
        }
        await AsyncStorage.removeItem(oldUsageKey);
      }
    }
    await AsyncStorage.removeItem(orphanKey);
  } catch (e) {
    console.warn('Material migration error:', e);
  }
}

export async function getMaterials(siteId: string): Promise<Material[]> {
  try {
    // One-time migration of orphaned materials
    await migrateOrphanedMaterials(siteId);
    const json = await AsyncStorage.getItem(MAT_KEY(siteId));
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
}

export async function addMaterial(siteId: string, material: Material): Promise<void> {
  const existing = await getMaterials(siteId);
  existing.unshift(material);
  await AsyncStorage.setItem(MAT_KEY(siteId), JSON.stringify(existing));
}

export async function updateMaterialInStore(siteId: string, materialId: string, updates: Partial<Material>): Promise<void> {
  const existing = await getMaterials(siteId);
  const updated = existing.map((m) => (m.id === materialId ? { ...m, ...updates } : m));
  await AsyncStorage.setItem(MAT_KEY(siteId), JSON.stringify(updated));
}

export async function deleteMaterialFromStore(siteId: string, materialId: string): Promise<void> {
  const existing = await getMaterials(siteId);
  const filtered = existing.filter((m) => m.id !== materialId);
  await AsyncStorage.setItem(MAT_KEY(siteId), JSON.stringify(filtered));
}

export async function getMaterialUsages(siteId: string, materialId: string): Promise<MaterialUsage[]> {
  try {
    const json = await AsyncStorage.getItem(USAGE_KEY(siteId, materialId));
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
}

export async function addMaterialUsage(siteId: string, materialId: string, usage: MaterialUsage): Promise<void> {
  const existing = await getMaterialUsages(siteId, materialId);
  existing.unshift(usage);
  await AsyncStorage.setItem(USAGE_KEY(siteId, materialId), JSON.stringify(existing));
}
