import AsyncStorage from '@react-native-async-storage/async-storage';
import { Site, Worker, HajariRecord, ExpenseRecord, PaymentRecord, SitePhoto } from './types';
import { Language } from './i18n';

const KEYS = {
  LANGUAGE: '@language',
  ONBOARDING: '@onboarding_done',
  SITES: '@sites',
  WORKERS: '@workers',
  HAJARI: '@hajari',
  EXPENSES: '@expenses',
  PAYMENTS: '@payments',
  PHOTOS: '@photos',
  AUTH_USER: '@auth_user',
};

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function threeYearsAgo(): number {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 3);
  return d.getTime();
}

function cleanOldRecords<T extends { date: string }>(records: T[]): T[] {
  const cutoff = threeYearsAgo();
  return records.filter(r => new Date(r.date).getTime() > cutoff);
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  photoUri: string | null;
}

export async function getAuthUser(): Promise<AuthUser | null> {
  const data = await AsyncStorage.getItem(KEYS.AUTH_USER);
  return data ? JSON.parse(data) : null;
}

export async function saveAuthUser(user: AuthUser): Promise<void> {
  await AsyncStorage.setItem(KEYS.AUTH_USER, JSON.stringify(user));
}

export async function updateAuthUser(updates: Partial<AuthUser>): Promise<AuthUser | null> {
  const user = await getAuthUser();
  if (!user) return null;
  const updated = { ...user, ...updates };
  await saveAuthUser(updated);
  return updated;
}

export async function logoutUser(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.AUTH_USER);
}

export async function signUp(name: string, email: string, password: string): Promise<AuthUser> {
  const usersRaw = await AsyncStorage.getItem('@all_users');
  const users: (AuthUser & { password: string })[] = usersRaw ? JSON.parse(usersRaw) : [];
  const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) throw new Error('Account already exists with this email');
  const newUser: AuthUser & { password: string } = {
    id: generateId(),
    name,
    email: email.toLowerCase(),
    photoUri: null,
    password,
  };
  users.push(newUser);
  await AsyncStorage.setItem('@all_users', JSON.stringify(users));
  const authUser: AuthUser = { id: newUser.id, name: newUser.name, email: newUser.email, photoUri: null };
  await saveAuthUser(authUser);
  return authUser;
}

export async function signIn(email: string, password: string): Promise<AuthUser> {
  const usersRaw = await AsyncStorage.getItem('@all_users');
  const users: (AuthUser & { password: string })[] = usersRaw ? JSON.parse(usersRaw) : [];
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
  if (!user) throw new Error('Invalid email or password');
  const authUser: AuthUser = { id: user.id, name: user.name, email: user.email, photoUri: user.photoUri };
  await saveAuthUser(authUser);
  return authUser;
}

export async function getLanguage(): Promise<Language> {
  const lang = await AsyncStorage.getItem(KEYS.LANGUAGE);
  return (lang as Language) || 'en';
}

export async function setLanguage(lang: Language): Promise<void> {
  await AsyncStorage.setItem(KEYS.LANGUAGE, lang);
}

export async function isOnboardingDone(): Promise<boolean> {
  const done = await AsyncStorage.getItem(KEYS.ONBOARDING);
  return done === 'true';
}

export async function setOnboardingDone(): Promise<void> {
  await AsyncStorage.setItem(KEYS.ONBOARDING, 'true');
}

async function getArray<T>(key: string): Promise<T[]> {
  const data = await AsyncStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

async function setArray<T>(key: string, data: T[]): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(data));
}

export async function getSites(): Promise<Site[]> {
  return getArray<Site>(KEYS.SITES);
}

export async function addSite(site: Omit<Site, 'id' | 'createdAt'>): Promise<Site> {
  const sites = await getSites();
  const newSite: Site = { ...site, id: generateId(), createdAt: new Date().toISOString() };
  sites.push(newSite);
  await setArray(KEYS.SITES, sites);
  return newSite;
}

export async function deleteSite(siteId: string): Promise<void> {
  let sites = await getSites();
  sites = sites.filter(s => s.id !== siteId);
  await setArray(KEYS.SITES, sites);
  let workers = await getArray<Worker>(KEYS.WORKERS);
  workers = workers.filter(w => w.siteId !== siteId);
  await setArray(KEYS.WORKERS, workers);
  let hajari = await getArray<HajariRecord>(KEYS.HAJARI);
  hajari = hajari.filter(h => h.siteId !== siteId);
  await setArray(KEYS.HAJARI, hajari);
  let expenses = await getArray<ExpenseRecord>(KEYS.EXPENSES);
  expenses = expenses.filter(e => e.siteId !== siteId);
  await setArray(KEYS.EXPENSES, expenses);
  let payments = await getArray<PaymentRecord>(KEYS.PAYMENTS);
  payments = payments.filter(p => p.siteId !== siteId);
  await setArray(KEYS.PAYMENTS, payments);
  let photos = await getArray<SitePhoto>(KEYS.PHOTOS);
  photos = photos.filter(p => p.siteId !== siteId);
  await setArray(KEYS.PHOTOS, photos);
}

export async function getWorkers(siteId: string): Promise<Worker[]> {
  const workers = await getArray<Worker>(KEYS.WORKERS);
  return workers.filter(w => w.siteId === siteId);
}

export async function addWorker(worker: Omit<Worker, 'id' | 'joiningDate'>): Promise<Worker> {
  const workers = await getArray<Worker>(KEYS.WORKERS);
  const newWorker: Worker = { ...worker, id: generateId(), joiningDate: new Date().toISOString().split('T')[0] };
  workers.push(newWorker);
  await setArray(KEYS.WORKERS, workers);
  return newWorker;
}

export async function deleteWorker(workerId: string): Promise<void> {
  let workers = await getArray<Worker>(KEYS.WORKERS);
  workers = workers.filter(w => w.id !== workerId);
  await setArray(KEYS.WORKERS, workers);
}

export async function getHajari(siteId: string): Promise<HajariRecord[]> {
  const records = await getArray<HajariRecord>(KEYS.HAJARI);
  return cleanOldRecords(records.filter(h => h.siteId === siteId));
}

export async function addHajariRecords(records: Omit<HajariRecord, 'id'>[]): Promise<void> {
  const existing = await getArray<HajariRecord>(KEYS.HAJARI);
  const newRecords = records.map(r => ({ ...r, id: generateId() }));
  await setArray(KEYS.HAJARI, [...existing, ...newRecords]);
}

export async function getExpenses(siteId: string): Promise<ExpenseRecord[]> {
  const records = await getArray<ExpenseRecord>(KEYS.EXPENSES);
  return cleanOldRecords(records.filter(e => e.siteId === siteId));
}

export async function addExpenseRecords(records: Omit<ExpenseRecord, 'id'>[]): Promise<void> {
  const existing = await getArray<ExpenseRecord>(KEYS.EXPENSES);
  const newRecords = records.map(r => ({ ...r, id: generateId() }));
  await setArray(KEYS.EXPENSES, [...existing, ...newRecords]);
}

export async function getPayments(siteId: string): Promise<PaymentRecord[]> {
  const records = await getArray<PaymentRecord>(KEYS.PAYMENTS);
  return cleanOldRecords(records.filter(p => p.siteId === siteId));
}

export async function addPayment(record: Omit<PaymentRecord, 'id'>): Promise<void> {
  const existing = await getArray<PaymentRecord>(KEYS.PAYMENTS);
  existing.push({ ...record, id: generateId() });
  await setArray(KEYS.PAYMENTS, existing);
}

export async function getPhotos(siteId: string): Promise<SitePhoto[]> {
  const photos = await getArray<SitePhoto>(KEYS.PHOTOS);
  return photos.filter(p => p.siteId === siteId);
}

export async function addPhoto(photo: Omit<SitePhoto, 'id'>): Promise<void> {
  const existing = await getArray<SitePhoto>(KEYS.PHOTOS);
  existing.push({ ...photo, id: generateId() });
  await setArray(KEYS.PHOTOS, existing);
}

export async function getWorkerTotals(siteId: string, workerId: string) {
  const hajari = await getHajari(siteId);
  const expenses = await getExpenses(siteId);
  const payments = await getPayments(siteId);
  const totalHajari = hajari.filter(h => h.workerId === workerId).reduce((s, h) => s + h.amount, 0);
  const totalExpense = expenses.filter(e => e.workerId === workerId).reduce((s, e) => s + e.amount, 0);
  const totalPaid = payments.filter(p => p.workerId === workerId).reduce((s, p) => s + p.amount, 0);
  const remaining = totalHajari - totalExpense - totalPaid;
  return { totalHajari, totalExpense, totalPaid, remaining };
}
