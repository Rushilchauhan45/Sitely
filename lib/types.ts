// ============================================================
// 📦 SITELY TYPES
// Complete type definitions for the construction site management app
// ============================================================

// Re-export AuthUser from auth service for convenience
export type { AuthUser } from './auth';

// ── User ───────────────────────────────────────────────────

export type UserRole = 'owner' | 'contractor';

export interface UserProfile {
  uid: string;
  fullName: string;
  username: string;
  gender: 'male' | 'female' | 'other';
  age: number;
  mobile: string;
  role: UserRole;
  profilePhoto: string | null;
  language: 'en' | 'hi' | 'gu';
  createdAt: string;
}

// ── Site ───────────────────────────────────────────────────

export type SiteType = 'residential' | 'commercial' | 'rowhouse' | 'tenament' | 'shop' | 'other';

export interface Site {
  id: string;
  siteCode?: string; // 6-char unique alphanumeric code
  contractorId?: string;
  name: string;
  type: SiteType;
  location: string;
  startDate: string;
  endDate: string;
  isRunning: boolean;
  ownerName: string;
  contact: string;
  status?: 'active' | 'completed';
  createdAt: string;
}

// ── Worker ─────────────────────────────────────────────────

export type WorkerCategory = 'karigar' | 'majdur';

export interface Worker {
  id: string;
  siteId: string;
  name: string;
  age: string;
  contact: string;
  village: string;
  category: WorkerCategory;
  photoUri: string | null;
  joiningDate: string;
  isActive: boolean;
}

// ── Attendance (Hajari) ────────────────────────────────────

export interface HajariRecord {
  id: string;
  siteId: string;
  workerId: string;
  workerName: string;
  workerCategory: string;
  amount: number;
  overtime: number;
  date: string;
  time: string;
}

// ── Expense ────────────────────────────────────────────────

export interface ExpenseRecord {
  id: string;
  siteId: string;
  workerId: string;
  workerName: string;
  workerCategory: string;
  description: string;
  amount: number;
  date: string;
  time: string;
}

// ── Payment ────────────────────────────────────────────────

export interface PaymentRecord {
  id: string;
  siteId: string;
  workerId: string;
  workerName: string;
  workerCategory: string;
  amount: number;
  date: string;
  time: string;
  method?: 'cash' | 'upi' | 'bank';
}

// ── Material ───────────────────────────────────────────────

export type MaterialUnit = 'kg' | 'bag' | 'piece' | 'ton' | 'litre' | 'sqft' | 'cft' | 'nos' | 'other';

export interface Material {
  id: string;
  siteId: string;
  name: string;
  vendorName: string;
  vendorPhone: string;
  quantity: number;
  unit: MaterialUnit;
  ratePerUnit: number;
  totalAmount: number;
  amountPaid: number;
  billPhotoUrl: string | null;
  purchasedAt: string;
}

export interface MaterialUsage {
  id: string;
  materialId: string;
  siteId: string;
  description: string;
  quantityUsed: number;
  date: string;
}

// ── Photos ─────────────────────────────────────────────────

export interface PhotoGroup {
  id: string;
  siteId: string;
  name: string;
  createdAt: string;
}

export interface SitePhoto {
  id: string;
  siteId: string;
  groupId?: string | null;
  uri: string;
  description: string;
  date: string;
  time: string;
}

// ── To-Do ──────────────────────────────────────────────────

export type TodoType = 'daily' | 'monthly';

export interface TodoItem {
  id: string;
  title: string;
  description: string;
  type: TodoType;
  deadline: string; // ISO date string
  isCompleted: boolean;
  createdAt: string;
  completedAt: string | null;
  priority?: 'high' | 'medium' | 'low';
}

// ── Owner ──────────────────────────────────────────────────

export interface SavedSite {
  siteId: string;
  siteCode: string;
  savedAt: string;
}

// ── Worker Summary (calculated) ────────────────────────────

export interface WorkerSummary {
  worker: Worker;
  totalHajari: number;
  totalExpense: number;
  totalPaid: number;
  remaining: number; // (totalHajari - totalExpense) - totalPaid
  lastPaymentDate: string | null;
}
