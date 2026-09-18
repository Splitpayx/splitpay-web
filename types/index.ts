/**
 * SplitPay Stellar Domain Types & Contract Definitions
 */

export const BPS_DENOMINATOR = 10000; // 10000 basis points = 100.00%

export enum PoolStatus {
  Active = 1,
  Inactive = 2,
}

export enum PaymentStatus {
  Pending = 1,
  Settled = 2,
}

export interface Pool {
  id: string; // u64 serialized as string
  owner: string; // Stellar Address (G... or C...)
  asset: string; // Stellar Asset Contract Address (C...)
  status: PoolStatus;
  createdAt: number; // Unix timestamp in seconds
  // Application metadata (off-chain convenience)
  name?: string;
  description?: string;
}

export interface Member {
  poolId: string;
  address: string; // Stellar Address (G... or C...)
  shareBps: number; // 1 to 10000 basis points
}

export interface Payment {
  id: string; // u64
  poolId: string;
  payer: string; // Stellar Address
  asset: string; // Stellar Asset Contract Address
  amount: bigint; // i128 minor units
  amountFormatted?: string; // Human readable
  status: PaymentStatus;
  createdAt: number;
  title?: string; // Off-chain metadata
}

export interface Distribution {
  paymentId: string;
  recipient: string;
  amount: bigint;
  shareBps: number;
  amountFormatted?: string;
}

export type TransactionStep =
  | 'idle'
  | 'awaiting_wallet'
  | 'signing'
  | 'submitting'
  | 'confirming'
  | 'confirmed'
  | 'failed';

export interface TransactionState {
  step: TransactionStep;
  txHash?: string;
  explorerUrl?: string;
  error?: string;
}

export interface WalletAccount {
  address: string;
  network: string;
  xlmBalance: string;
  assetBalances?: Record<string, string>;
}

export interface NetworkConfig {
  network: string;
  networkPassphrase: string;
  rpcUrl: string;
  contractId: string;
  explorerUrl: string;
  defaultAssetContract?: string;
}
