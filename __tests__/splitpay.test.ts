import { describe, it, expect } from 'vitest';
import {
  validateMemberShares,
  calculateContractAllocations,
  isValidStellarAddress,
} from '@/lib/validation';
import { formatBps, parseBps, formatUnits, parseUnits, formatAddress } from '@/lib/utils';
import { SplitPayContractClient } from '@/lib/contract/splitpay';
import { BPS_DENOMINATOR } from '@/types';

describe('SplitPay Validation & Basis-Points Math', () => {
  it('validates 10000 basis points correctly (100.00%)', () => {
    const validMembers = [
      { shareBps: 6000 },
      { shareBps: 4000 },
    ];
    const res = validateMemberShares(validMembers);
    expect(res.valid).toBe(true);
    expect(res.totalBps).toBe(10000);
    expect(res.remainingBps).toBe(0);
  });

  it('rejects shares that do not equal 10000 basis points', () => {
    const underMembers = [
      { shareBps: 6000 },
      { shareBps: 3000 },
    ];
    const underRes = validateMemberShares(underMembers);
    expect(underRes.valid).toBe(false);
    expect(underRes.totalBps).toBe(9000);
    expect(underRes.remainingBps).toBe(1000);
    expect(underRes.error).toContain('Total shares must equal exactly 100%');

    const overMembers = [
      { shareBps: 6000 },
      { shareBps: 5000 },
    ];
    const overRes = validateMemberShares(overMembers);
    expect(overRes.valid).toBe(false);
    expect(overRes.totalBps).toBe(11000);
  });

  it('rejects invalid or zero shares', () => {
    const invalidZero = [{ shareBps: 0 }, { shareBps: 10000 }];
    const res = validateMemberShares(invalidZero);
    expect(res.valid).toBe(false);
    expect(res.error).toContain('between 1 and 10,000 basis points');
  });

  it('calculates deterministic allocations with Soroban contract remainder assignment to member 0', () => {
    const members = [
      { address: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF', shareBps: 3333 },
      { address: 'GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBWHF', shareBps: 3333 },
      { address: 'GCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCWHF', shareBps: 3334 },
    ];

    // Total: 10,000 BPS
    expect(members.reduce((s, m) => s + m.shareBps, 0)).toBe(10000);

    // Amount: 100 stroops
    const totalAmount = BigInt(100);
    const allocations = calculateContractAllocations(totalAmount, members);

    // Sum of allocations must equal exact totalAmount (Contract Invariant)
    const sumAlloc = allocations.reduce((s, a) => s + a.amount, BigInt(0));
    expect(sumAlloc).toBe(totalAmount);

    // Remainder should go to member 0
    expect(allocations[0].amount).toBeGreaterThanOrEqual(allocations[1].amount);
  });

  it('calculates 60/40 exact splits with zero remainder loss', () => {
    const members = [
      { address: 'G_ALICE', shareBps: 6000 },
      { address: 'G_BOB', shareBps: 4000 },
    ];
    const totalAmount = BigInt(100_000_000); // 10 units (7 decimals)
    const allocations = calculateContractAllocations(totalAmount, members);

    expect(allocations[0].amount).toBe(BigInt(60_000_000));
    expect(allocations[1].amount).toBe(BigInt(40_000_000));
    expect(allocations[0].amount + allocations[1].amount).toBe(totalAmount);
  });
});

describe('Stellar Address Validation', () => {
  it('validates Ed25519 public keys and contracts', () => {
    // Valid standard Stellar G address
    expect(
      isValidStellarAddress('GDXGNF7KSGKQVLQCA6FGOICCIYQ32H7IJUHZOZLEJGXBDOEF6KXXRW7J')
    ).toBe(true);

    // Valid standard Stellar C contract address
    expect(
      isValidStellarAddress('CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC')
    ).toBe(true);

    // Invalid addresses
    expect(isValidStellarAddress('')).toBe(false);
    expect(isValidStellarAddress('invalid_random_string')).toBe(false);
    expect(isValidStellarAddress('0x1234567890abcdef1234567890abcdef12345678')).toBe(false);
  });
});

describe('Formatting and Unit Utilities', () => {
  it('formats basis points to percentage strings', () => {
    expect(formatBps(5000)).toBe('50%');
    expect(formatBps(3333)).toBe('33.33%');
    expect(formatBps(10000)).toBe('100%');
  });

  it('parses percentage strings to basis points', () => {
    expect(parseBps('50')).toBe(5000);
    expect(parseBps('33.33')).toBe(3333);
    expect(parseBps('100')).toBe(10000);
  });

  it('formats minor stroop units to major decimal string and vice versa', () => {
    const rawStroops = BigInt(105_000_000); // 10.5
    expect(formatUnits(rawStroops)).toBe('10.5');

    const parsed = parseUnits('10.5');
    expect(parsed).toBe(rawStroops);

    const smallUnits = parseUnits('0.0000001');
    expect(smallUnits).toBe(BigInt(1));
    expect(formatUnits(BigInt(1))).toBe('0.0000001');
  });

  it('truncates Stellar address safely', () => {
    expect(formatAddress('GA6HCMBLTZS5VYYBCATRBRZ3ACJROFEOE5QKZAS2SUAUQIXZQ2O7O5PA')).toBe(
      'GA6H...O5PA'
    );
    expect(formatAddress('')).toBe('');
  });
});

describe('SplitPay Contract Client API', () => {
  it('initializes with contract ID and exposes expected methods', () => {
    const client = new SplitPayContractClient('CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC');
    expect(client.getContractId()).toBe('CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC');
    expect(typeof client.getPool).toBe('function');
    expect(typeof client.getPoolMembers).toBe('function');
    expect(typeof client.getPayment).toBe('function');
    expect(typeof client.getDistributions).toBe('function');
    expect(typeof client.prepareCreatePool).toBe('function');
    expect(typeof client.prepareAddMember).toBe('function');
    expect(typeof client.prepareCreatePayment).toBe('function');
    expect(typeof client.prepareSettlePayment).toBe('function');
  });
});
