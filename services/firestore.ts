// ============================================================
// 🔥 FIRESTORE SERVICE — Cloud database operations
// Uses the Firebase JS SDK's Firestore module
// ============================================================

import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { app } from '@/lib/firebase';
import type {
  UserProfile,
  Site,
  Worker,
  HajariRecord,
  ExpenseRecord,
  PaymentRecord,
  Material,
  MaterialUsage,
  PhotoGroup,
  SitePhoto,
  SavedSite,
} from '@/lib/types';

// Initialize Firestore
const db = getFirestore(app);

// ── Helpers ────────────────────────────────────────────────

const now = () => new Date().toISOString();

// ── Users ──────────────────────────────────────────────────

export async function createUserProfile(profile: UserProfile): Promise<void> {
  await setDoc(doc(db, 'users', profile.uid), {
    ...profile,
    createdAt: now(),
  });
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

export async function updateUserProfile(
  uid: string,
  updates: Partial<UserProfile>,
): Promise<void> {
  await updateDoc(doc(db, 'users', uid), updates);
}

export async function checkUsernameAvailable(username: string): Promise<boolean> {
  const q = query(collection(db, 'users'), where('username', '==', username), limit(1));
  const snap = await getDocs(q);
  return snap.empty;
}

// ── Sites ──────────────────────────────────────────────────

export async function createSite(site: Omit<Site, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, 'sites'), {
    ...site,
    createdAt: now(),
  });
  return ref.id;
}

export async function getSite(siteId: string): Promise<Site | null> {
  const snap = await getDoc(doc(db, 'sites', siteId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Site) : null;
}

export async function getContractorSites(contractorId: string): Promise<Site[]> {
  const q = query(
    collection(db, 'sites'),
    where('contractorId', '==', contractorId),
    orderBy('createdAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Site));
}

export async function getSiteBySiteCode(siteCode: string): Promise<Site | null> {
  const q = query(collection(db, 'sites'), where('siteCode', '==', siteCode), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as Site;
}

export async function updateSite(siteId: string, updates: Partial<Site>): Promise<void> {
  await updateDoc(doc(db, 'sites', siteId), updates);
}

export async function deleteSite(siteId: string): Promise<void> {
  await deleteDoc(doc(db, 'sites', siteId));
}

// ── Unique Site Code ───────────────────────────────────────

export async function generateUniqueSiteCode(): Promise<string> {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code: string;
  let attempts = 0;
  do {
    code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    attempts++;
    const existing = await getSiteBySiteCode(code);
    if (!existing) return code;
  } while (attempts < 20);
  // Fallback: use timestamp suffix
  return code + Date.now().toString(36).slice(-2).toUpperCase();
}

// ── Workers ────────────────────────────────────────────────

export async function addWorker(siteId: string, worker: Omit<Worker, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, 'sites', siteId, 'workers'), worker);
  return ref.id;
}

export async function getWorkers(siteId: string): Promise<Worker[]> {
  const q = query(collection(db, 'sites', siteId, 'workers'), orderBy('joiningDate', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Worker));
}

export async function updateWorker(
  siteId: string,
  workerId: string,
  updates: Partial<Worker>,
): Promise<void> {
  await updateDoc(doc(db, 'sites', siteId, 'workers', workerId), updates);
}

export async function deleteWorker(siteId: string, workerId: string): Promise<void> {
  await deleteDoc(doc(db, 'sites', siteId, 'workers', workerId));
}

// ── Attendance (Hajari) ────────────────────────────────────

export async function addHajari(
  siteId: string,
  record: Omit<HajariRecord, 'id'>,
): Promise<string> {
  const ref = await addDoc(collection(db, 'sites', siteId, 'attendance'), record);
  return ref.id;
}

export async function getHajariRecords(siteId: string): Promise<HajariRecord[]> {
  const snap = await getDocs(collection(db, 'sites', siteId, 'attendance'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as HajariRecord));
}

export async function getWorkerHajari(
  siteId: string,
  workerId: string,
): Promise<HajariRecord[]> {
  const q = query(
    collection(db, 'sites', siteId, 'attendance'),
    where('workerId', '==', workerId),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as HajariRecord));
}

// ── Expenses ───────────────────────────────────────────────

export async function addExpense(
  siteId: string,
  record: Omit<ExpenseRecord, 'id'>,
): Promise<string> {
  const ref = await addDoc(collection(db, 'sites', siteId, 'expenses'), record);
  return ref.id;
}

export async function getExpenses(siteId: string): Promise<ExpenseRecord[]> {
  const snap = await getDocs(collection(db, 'sites', siteId, 'expenses'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ExpenseRecord));
}

export async function getWorkerExpenses(
  siteId: string,
  workerId: string,
): Promise<ExpenseRecord[]> {
  const q = query(
    collection(db, 'sites', siteId, 'expenses'),
    where('workerId', '==', workerId),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ExpenseRecord));
}

// ── Payments ───────────────────────────────────────────────

export async function addPayment(
  siteId: string,
  record: Omit<PaymentRecord, 'id'>,
): Promise<string> {
  const ref = await addDoc(collection(db, 'sites', siteId, 'payments'), record);
  return ref.id;
}

export async function getPayments(siteId: string): Promise<PaymentRecord[]> {
  const snap = await getDocs(collection(db, 'sites', siteId, 'payments'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as PaymentRecord));
}

export async function getWorkerPayments(
  siteId: string,
  workerId: string,
): Promise<PaymentRecord[]> {
  const q = query(
    collection(db, 'sites', siteId, 'payments'),
    where('workerId', '==', workerId),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as PaymentRecord));
}

// ── Materials ──────────────────────────────────────────────

export async function addMaterial(
  siteId: string,
  material: Omit<Material, 'id'>,
): Promise<string> {
  const ref = await addDoc(collection(db, 'sites', siteId, 'materials'), material);
  return ref.id;
}

export async function getMaterials(siteId: string): Promise<Material[]> {
  const snap = await getDocs(collection(db, 'sites', siteId, 'materials'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Material));
}

export async function updateMaterial(
  siteId: string,
  materialId: string,
  updates: Partial<Material>,
): Promise<void> {
  await updateDoc(doc(db, 'sites', siteId, 'materials', materialId), updates);
}

export async function deleteMaterial(siteId: string, materialId: string): Promise<void> {
  await deleteDoc(doc(db, 'sites', siteId, 'materials', materialId));
}

// Material Usage
export async function addMaterialUsage(
  siteId: string,
  materialId: string,
  usage: Omit<MaterialUsage, 'id'>,
): Promise<string> {
  const ref = await addDoc(
    collection(db, 'sites', siteId, 'materials', materialId, 'usages'),
    usage,
  );
  return ref.id;
}

export async function getMaterialUsages(
  siteId: string,
  materialId: string,
): Promise<MaterialUsage[]> {
  const snap = await getDocs(
    collection(db, 'sites', siteId, 'materials', materialId, 'usages'),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as MaterialUsage));
}

// ── Photo Groups & Photos ──────────────────────────────────

export async function createPhotoGroup(
  siteId: string,
  name: string,
): Promise<string> {
  const ref = await addDoc(collection(db, 'sites', siteId, 'photoGroups'), {
    name,
    createdAt: now(),
  });
  return ref.id;
}

export async function getPhotoGroups(siteId: string): Promise<PhotoGroup[]> {
  const snap = await getDocs(collection(db, 'sites', siteId, 'photoGroups'));
  return snap.docs.map((d) => ({ id: d.id, siteId, ...d.data() } as PhotoGroup));
}

export async function addPhotoToGroup(
  siteId: string,
  groupId: string,
  photo: Omit<SitePhoto, 'id'>,
): Promise<string> {
  const ref = await addDoc(
    collection(db, 'sites', siteId, 'photoGroups', groupId, 'photos'),
    photo,
  );
  return ref.id;
}

export async function getGroupPhotos(
  siteId: string,
  groupId: string,
): Promise<SitePhoto[]> {
  const snap = await getDocs(
    collection(db, 'sites', siteId, 'photoGroups', groupId, 'photos'),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as SitePhoto));
}

export async function deletePhoto(
  siteId: string,
  groupId: string,
  photoId: string,
): Promise<void> {
  await deleteDoc(
    doc(db, 'sites', siteId, 'photoGroups', groupId, 'photos', photoId),
  );
}

// ── Owner Saved Sites ──────────────────────────────────────

export async function saveOwnerSite(
  userId: string,
  siteId: string,
  siteCode: string,
): Promise<void> {
  const ownerRef = doc(db, 'ownerSites', userId);
  const snap = await getDoc(ownerRef);
  const savedSites: SavedSite[] = snap.exists()
    ? (snap.data().savedSites ?? [])
    : [];

  if (!savedSites.find((s) => s.siteId === siteId)) {
    savedSites.push({ siteId, siteCode, savedAt: now() });
    await setDoc(ownerRef, { savedSites });
  }
}

export async function getOwnerSavedSites(userId: string): Promise<SavedSite[]> {
  const snap = await getDoc(doc(db, 'ownerSites', userId));
  return snap.exists() ? (snap.data().savedSites ?? []) : [];
}

export async function removeOwnerSite(userId: string, siteId: string): Promise<void> {
  const snap = await getDoc(doc(db, 'ownerSites', userId));
  if (!snap.exists()) return;
  const savedSites: SavedSite[] = snap.data().savedSites ?? [];
  await setDoc(doc(db, 'ownerSites', userId), {
    savedSites: savedSites.filter((s) => s.siteId !== siteId),
  });
}
