'use client';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency } from '@/lib/utils';

/**
 * Returns the user's preferred currency code (defaults to PKR)
 * and a pre-bound formatCurrency function.
 *
 * Automatically re-renders when the user changes their currency in settings
 * because it reads directly from the Zustand authStore.
 */
export function useCurrency() {
  // Use a selector so this hook only re-renders when currency changes
  const currency = useAuthStore((s) => s.userProfile?.currency ?? 'PKR');
  const fmt = (amount: number) => formatCurrency(amount, currency);
  return { currency, fmt };
}
