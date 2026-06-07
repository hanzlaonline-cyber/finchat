import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  limit,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Transaction, Budget, Goal, Notification, User } from '@/types';

// ─── User ────────────────────────────────────────────────────────────────────
export async function createUserProfile(uid: string, data: Partial<User>) {
  await setDoc(doc(db, 'users', uid), {
    ...data,
    currency: data.currency || 'PKR',
    createdAt: new Date().toISOString(),
  });
}

export async function getUserProfile(uid: string): Promise<User | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return { uid: snap.id, ...snap.data() } as User;
}

export async function updateUserProfile(uid: string, data: Partial<User>) {
  await updateDoc(doc(db, 'users', uid), data as Record<string, unknown>);
}

// ─── Transactions ─────────────────────────────────────────────────────────────
// Strip undefined values — Firestore rejects documents containing `undefined`
function stripUndefined(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null)
  );
}

export async function addTransaction(tx: Omit<Transaction, 'id'>) {
  const payload = stripUndefined({
    ...tx,
    // Ensure correct types
    amount: Number(tx.amount),
    date: String(tx.date),
    userId: String(tx.userId),
    type: tx.type,
    category: String(tx.category),
    merchant: String(tx.merchant || 'Unknown'),
    paymentMethod: String(tx.paymentMethod || 'Cash'),
    notes: tx.notes ? String(tx.notes) : '',
    description: tx.description ? String(tx.description) : '',
    // Split fields — only include if split is true
    ...(tx.split === true && tx.participants
      ? {
          split: true,
          participants: Number(tx.participants),
          perPersonAmount: Number(tx.perPersonAmount || tx.amount),
        }
      : { split: false }),
    createdAt: new Date().toISOString(),
  });

  const ref = await addDoc(collection(db, 'transactions'), payload);
  return ref.id;
}

export async function updateTransaction(id: string, tx: Partial<Transaction>) {
  await updateDoc(doc(db, 'transactions', id), tx as Record<string, unknown>);
}

export async function deleteTransaction(id: string) {
  await deleteDoc(doc(db, 'transactions', id));
}

export async function getTransactions(
  userId: string,
  startDate?: Date,
  endDate?: Date
): Promise<Transaction[]> {
  // Single-field where — no composite index needed; sort client-side
  const q = query(
    collection(db, 'transactions'),
    where('userId', '==', userId)
  );

  const snap = await getDocs(q);
  let txs = snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Transaction))
    .sort((a, b) => (b.date > a.date ? 1 : -1));

  if (startDate && endDate) {
    const start = startDate.toISOString().split('T')[0];
    const end   = endDate.toISOString().split('T')[0];
    txs = txs.filter((tx) => tx.date >= start && tx.date <= end);
  }

  return txs;
}

export async function getRecentTransactions(userId: string, count = 10): Promise<Transaction[]> {
  const q = query(
    collection(db, 'transactions'),
    where('userId', '==', userId),
    limit(count * 3) // fetch extra, sort client-side
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Transaction))
    .sort((a, b) => (b.date > a.date ? 1 : -1))
    .slice(0, count);
}

// ─── Budgets ──────────────────────────────────────────────────────────────────
export async function addBudget(budget: Omit<Budget, 'id'>) {
  const ref = await addDoc(collection(db, 'budgets'), budget);
  return ref.id;
}

export async function updateBudget(id: string, budget: Partial<Budget>) {
  await updateDoc(doc(db, 'budgets', id), budget as Record<string, unknown>);
}

export async function deleteBudget(id: string) {
  await deleteDoc(doc(db, 'budgets', id));
}

export async function getBudgets(userId: string, month?: string): Promise<Budget[]> {
  const constraints: Parameters<typeof query>[1][] = [where('userId', '==', userId)];
  if (month) constraints.push(where('month', '==', month));
  const q = query(collection(db, 'budgets'), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Budget));
}

// ─── Goals ────────────────────────────────────────────────────────────────────
export async function addGoal(goal: Omit<Goal, 'id'>) {
  const ref = await addDoc(collection(db, 'goals'), {
    ...goal,
    createdAt: new Date().toISOString(),
  });
  return ref.id;
}

export async function updateGoal(id: string, goal: Partial<Goal>) {
  await updateDoc(doc(db, 'goals', id), goal as Record<string, unknown>);
}

export async function deleteGoal(id: string) {
  await deleteDoc(doc(db, 'goals', id));
}

export async function getGoals(userId: string): Promise<Goal[]> {
  const q = query(collection(db, 'goals'), where('userId', '==', userId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Goal));
}

// ─── Notifications ────────────────────────────────────────────────────────────
export async function addNotification(notif: Omit<Notification, 'id'>) {
  const ref = await addDoc(collection(db, 'notifications'), notif);
  return ref.id;
}

export async function getNotifications(userId: string): Promise<Notification[]> {
  // Simple single-field query — avoids composite index requirement
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    limit(50)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Notification))
    .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1))
    .slice(0, 20);
}

export async function markNotificationRead(id: string) {
  await updateDoc(doc(db, 'notifications', id), { read: true });
}

// ─── Seed Data ────────────────────────────────────────────────────────────────
export async function seedSampleData(userId: string) {
  const batch = writeBatch(db);
  const now = new Date();

  const transactions: Omit<Transaction, 'id'>[] = [
    { userId, amount: 5000, type: 'income', category: 'Salary', merchant: 'Acme Corp', date: formatDateStr(now, 0), paymentMethod: 'Bank Transfer', notes: 'Monthly salary', createdAt: new Date().toISOString() },
    { userId, amount: 120, type: 'expense', category: 'Food & Dining', merchant: 'Whole Foods', date: formatDateStr(now, -1), paymentMethod: 'Credit Card', notes: '', createdAt: new Date().toISOString() },
    { userId, amount: 45, type: 'expense', category: 'Transportation', merchant: 'Uber', date: formatDateStr(now, -2), paymentMethod: 'Credit Card', notes: '', createdAt: new Date().toISOString() },
    { userId, amount: 200, type: 'expense', category: 'Shopping', merchant: 'Amazon', date: formatDateStr(now, -3), paymentMethod: 'Credit Card', notes: 'Electronics', createdAt: new Date().toISOString() },
    { userId, amount: 800, type: 'expense', category: 'Housing', merchant: 'Landlord', date: formatDateStr(now, -5), paymentMethod: 'Bank Transfer', notes: 'Rent', createdAt: new Date().toISOString() },
    { userId, amount: 1200, type: 'income', category: 'Freelance', merchant: 'Client XYZ', date: formatDateStr(now, -6), paymentMethod: 'Bank Transfer', notes: 'Design project', createdAt: new Date().toISOString() },
    { userId, amount: 75, type: 'expense', category: 'Entertainment', merchant: 'Netflix', date: formatDateStr(now, -7), paymentMethod: 'Credit Card', notes: '', createdAt: new Date().toISOString() },
    { userId, amount: 150, type: 'expense', category: 'Healthcare', merchant: 'CVS Pharmacy', date: formatDateStr(now, -8), paymentMethod: 'Debit Card', notes: '', createdAt: new Date().toISOString() },
    { userId, amount: 60, type: 'expense', category: 'Utilities', merchant: 'Electric Co', date: formatDateStr(now, -10), paymentMethod: 'Bank Transfer', notes: '', createdAt: new Date().toISOString() },
    { userId, amount: 300, type: 'expense', category: 'Food & Dining', merchant: 'Restaurant Week', date: formatDateStr(now, -12), paymentMethod: 'Credit Card', notes: '', createdAt: new Date().toISOString() },
    { userId, amount: 500, type: 'income', category: 'Investment Returns', merchant: 'Brokerage', date: formatDateStr(now, -14), paymentMethod: 'Bank Transfer', notes: '', createdAt: new Date().toISOString() },
    { userId, amount: 90, type: 'expense', category: 'Personal Care', merchant: 'Salon', date: formatDateStr(now, -15), paymentMethod: 'Cash', notes: '', createdAt: new Date().toISOString() },
  ];

  for (const tx of transactions) {
    const ref = doc(collection(db, 'transactions'));
    batch.set(ref, tx);
  }

  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const budgets: Omit<Budget, 'id'>[] = [
    { userId, category: 'Food & Dining', limit: 500, spent: 420, month: currentMonth },
    { userId, category: 'Transportation', limit: 200, spent: 45, month: currentMonth },
    { userId, category: 'Shopping', limit: 300, spent: 200, month: currentMonth },
    { userId, category: 'Entertainment', limit: 150, spent: 75, month: currentMonth },
    { userId, category: 'Healthcare', limit: 200, spent: 150, month: currentMonth },
    { userId, category: 'Housing', limit: 1000, spent: 800, month: currentMonth },
  ];

  for (const b of budgets) {
    const ref = doc(collection(db, 'budgets'));
    batch.set(ref, b);
  }

  const goals: Omit<Goal, 'id'>[] = [
    { userId, goalName: 'Emergency Fund', targetAmount: 10000, currentAmount: 3500, deadline: futureDate(6), notes: '6-month emergency fund', createdAt: new Date().toISOString() },
    { userId, goalName: 'Vacation to Europe', targetAmount: 5000, currentAmount: 1200, deadline: futureDate(8), notes: 'Summer vacation', createdAt: new Date().toISOString() },
    { userId, goalName: 'New Laptop', targetAmount: 2000, currentAmount: 1800, deadline: futureDate(2), notes: '', createdAt: new Date().toISOString() },
  ];

  for (const g of goals) {
    const ref = doc(collection(db, 'goals'));
    batch.set(ref, g);
  }

  await batch.commit();
}

function formatDateStr(base: Date, daysOffset: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
}

function futureDate(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split('T')[0];
}
