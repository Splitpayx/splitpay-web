/**
 * Client-side registry to track known Pool IDs and Payment IDs
 * Authoritative financial state for each ID is always fetched directly from the Soroban contract.
 */

const POOLS_KEY = 'splitpay_tracked_pools';
const PAYMENTS_KEY = 'splitpay_tracked_payments';

export interface TrackedPoolMetadata {
  id: string; // u64 string
  name: string;
  createdAt: number;
}

export interface TrackedPaymentMetadata {
  id: string; // u64 string
  poolId: string;
  title?: string;
  createdAt: number;
}

export function getTrackedPools(): TrackedPoolMetadata[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(POOLS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveTrackedPool(pool: TrackedPoolMetadata): void {
  if (typeof window === 'undefined') return;
  const list = getTrackedPools();
  const exists = list.some((p) => p.id === pool.id);
  if (!exists) {
    list.unshift(pool);
    localStorage.setItem(POOLS_KEY, JSON.stringify(list));
  }
}

export function getTrackedPayments(): TrackedPaymentMetadata[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PAYMENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveTrackedPayment(payment: TrackedPaymentMetadata): void {
  if (typeof window === 'undefined') return;
  const list = getTrackedPayments();
  const exists = list.some((p) => p.id === payment.id);
  if (!exists) {
    list.unshift(payment);
    localStorage.setItem(PAYMENTS_KEY, JSON.stringify(list));
  }
}
