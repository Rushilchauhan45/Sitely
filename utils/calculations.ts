// ============================================================
// 🧮 SALARY CALCULATION UTILITIES
// Formula: Remaining = (Total Hajari - Total Expense) - Already Paid
// ============================================================

import type {
  Worker,
  HajariRecord,
  ExpenseRecord,
  PaymentRecord,
  WorkerSummary,
} from '../lib/types';

export function calculateWorkerSummary(
  worker: Worker,
  hajariRecords: HajariRecord[],
  expenseRecords: ExpenseRecord[],
  paymentRecords: PaymentRecord[],
): WorkerSummary {
  const workerHajari = hajariRecords.filter((h) => h.workerId === worker.id);
  const workerExpenses = expenseRecords.filter((e) => e.workerId === worker.id);
  const workerPayments = paymentRecords.filter((p) => p.workerId === worker.id);

  const totalHajari = workerHajari.reduce((sum, h) => sum + h.amount + (h.overtime || 0), 0);
  const totalExpense = workerExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalPaid = workerPayments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = totalHajari - totalExpense - totalPaid;

  // Find last payment date
  let lastPaymentDate: string | null = null;
  if (workerPayments.length > 0) {
    const sorted = [...workerPayments].sort((a, b) =>
      b.date.localeCompare(a.date),
    );
    lastPaymentDate = sorted[0].date;
  }

  return {
    worker,
    totalHajari,
    totalExpense,
    totalPaid,
    remaining,
    lastPaymentDate,
  };
}

export function calculateAllWorkerSummaries(
  workers: Worker[],
  hajariRecords: HajariRecord[],
  expenseRecords: ExpenseRecord[],
  paymentRecords: PaymentRecord[],
): WorkerSummary[] {
  return workers.map((w) =>
    calculateWorkerSummary(w, hajariRecords, expenseRecords, paymentRecords),
  );
}

export function calculateTotalWorkerCost(summaries: WorkerSummary[]): number {
  return summaries.reduce((sum, s) => sum + s.totalHajari, 0);
}

export function calculateTotalExpenses(summaries: WorkerSummary[]): number {
  return summaries.reduce((sum, s) => sum + s.totalExpense, 0);
}

export function calculateTotalPaid(summaries: WorkerSummary[]): number {
  return summaries.reduce((sum, s) => sum + s.totalPaid, 0);
}

export function formatCurrency(amount: number): string {
  return `₹ ${amount.toLocaleString('en-IN')}`;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getDayName(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { weekday: 'long' });
}
