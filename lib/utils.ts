import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { BPS_DENOMINATOR } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Truncate Stellar address (e.g. GAB...1234 -> GAB...1234)
 */
export function formatAddress(address: string, start = 4, end = 4): string {
  if (!address) return '';
  if (address.length <= start + end) return address;
  return `${address.slice(0, start)}...${address.slice(-end)}`;
}

/**
 * Format basis points to human percentage (e.g., 5000 -> "50%", 2550 -> "25.5%")
 */
export function formatBps(bps: number): string {
  const percent = bps / 100;
  return Number.isInteger(percent) ? `${percent}%` : `${percent.toFixed(2)}%`;
}

/**
 * Parse a percentage string (e.g. "50", "25.5") into integer basis points (5000, 2550)
 */
export function parseBps(percentageStr: string | number): number {
  const val = typeof percentageStr === 'number' ? percentageStr : parseFloat(percentageStr);
  if (isNaN(val) || val < 0) return 0;
  return Math.round(val * 100);
}

/**
 * Convert 7-decimal stroops/Stellar token units (bigint) to formatted decimal string
 */
export function formatUnits(amount: bigint | string | number, decimals = 7): string {
  const raw = typeof amount === 'bigint' ? amount.toString() : amount.toString();
  const isNegative = raw.startsWith('-');
  const abs = isNegative ? raw.slice(1) : raw;

  const padded = abs.padStart(decimals + 1, '0');
  const integerPart = padded.slice(0, -decimals) || '0';
  let fractionPart = padded.slice(-decimals);

  // Remove trailing zeros
  fractionPart = fractionPart.replace(/0+$/, '');
  const result = fractionPart ? `${integerPart}.${fractionPart}` : integerPart;
  return isNegative ? `-${result}` : result;
}

/**
 * Convert decimal string (e.g. "10.5") into 7-decimal integer minor units (bigint)
 */
export function parseUnits(amountStr: string, decimals = 7): bigint {
  if (!amountStr || amountStr.trim() === '') return BigInt(0);
  const parts = amountStr.trim().split('.');
  const integerPart = parts[0] || '0';
  let fractionPart = parts[1] || '';

  if (fractionPart.length > decimals) {
    fractionPart = fractionPart.slice(0, decimals);
  } else {
    fractionPart = fractionPart.padEnd(decimals, '0');
  }

  const combined = `${integerPart}${fractionPart}`.replace(/^0+(?=\d)/, '');
  return BigInt(combined || '0');
}
