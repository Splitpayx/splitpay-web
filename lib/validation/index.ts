import { StrKey } from '@stellar/stellar-sdk';
import { BPS_DENOMINATOR, Member } from '@/types';

export function isValidStellarAddress(address: string): boolean {
  if (!address || typeof address !== 'string') return false;
  return StrKey.isValidEd25519PublicKey(address) || StrKey.isValidContract(address);
}

export interface SharesValidationResult {
  valid: boolean;
  totalBps: number;
  remainingBps: number;
  error?: string;
}

/**
 * Validates pool members split shares.
 * Contract invariant: sum(all member shares) == 10000 BPS
 */
export function validateMemberShares(members: { shareBps: number }[]): SharesValidationResult {
  if (!members || members.length === 0) {
    return {
      valid: false,
      totalBps: 0,
      remainingBps: BPS_DENOMINATOR,
      error: 'At least one member is required.',
    };
  }

  for (const m of members) {
    if (m.shareBps <= 0 || m.shareBps > BPS_DENOMINATOR) {
      return {
        valid: false,
        totalBps: 0,
        remainingBps: BPS_DENOMINATOR,
        error: 'Each member share must be between 1 and 10,000 basis points.',
      };
    }
  }

  const totalBps = members.reduce((sum, m) => sum + m.shareBps, 0);
  const remainingBps = BPS_DENOMINATOR - totalBps;

  if (totalBps !== BPS_DENOMINATOR) {
    return {
      valid: false,
      totalBps,
      remainingBps,
      error: `Total shares must equal exactly 100% (10,000 BPS). Current total: ${(totalBps / 100).toFixed(2)}%`,
    };
  }

  return {
    valid: true,
    totalBps,
    remainingBps: 0,
  };
}

/**
 * Calculates deterministic member allocations matching the SplitPay Soroban contract.
 * Contract rule:
 *   member_amount = total_amount * share_bps / 10000
 *   remainder = total_amount - sum(member_amounts)
 *   if remainder > 0: remainder is assigned to member at index 0.
 */
export function calculateContractAllocations(
  totalAmount: bigint,
  members: { address: string; shareBps: number }[]
): { address: string; amount: bigint; shareBps: number }[] {
  if (totalAmount <= BigInt(0) || members.length === 0) {
    return [];
  }

  let allocatedSum = BigInt(0);
  const allocations: bigint[] = [];

  for (const m of members) {
    const alloc = (totalAmount * BigInt(m.shareBps)) / BigInt(BPS_DENOMINATOR);
    allocatedSum += alloc;
    allocations.push(alloc);
  }

  const remainder = totalAmount - allocatedSum;
  if (remainder > BigInt(0) && allocations.length > 0) {
    allocations[0] = allocations[0] + remainder;
  }

  return members.map((m, idx) => ({
    address: m.address,
    amount: allocations[idx],
    shareBps: m.shareBps,
  }));
}
