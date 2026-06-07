import { create } from 'zustand';
import {
  collection,
  query,
  where,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Transaction } from '@/types';

interface TransactionState {
  // Live transaction list — always scoped to the signed-in user
  transactions: Transaction[];
  // Whether the first snapshot has been received
  loaded: boolean;
  // Internal listener reference so we can unsubscribe on logout
  _unsubscribe: Unsubscribe | null;

  // Public actions
  startListener: (userId: string) => void;
  stopListener: () => void;
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  loaded: false,
  _unsubscribe: null,

  startListener(userId: string) {
    // Prevent duplicate listeners
    const existing = get()._unsubscribe;
    if (existing) existing();

    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', userId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const txs = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as Transaction))
          // Sort newest first by date string (YYYY-MM-DD — lexicographic = chronological)
          .sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));
        set({ transactions: txs, loaded: true });
      },
      (error) => {
        // Silently ignore permission errors that happen during sign-out
        if (error.code !== 'permission-denied') {
          console.error('Transaction listener error:', error.message);
        }
      }
    );

    set({ _unsubscribe: unsubscribe, loaded: false });
  },

  stopListener() {
    const unsubscribe = get()._unsubscribe;
    if (unsubscribe) unsubscribe();
    set({ transactions: [], loaded: false, _unsubscribe: null });
  },
}));
