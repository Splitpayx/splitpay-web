import { NetworkConfig } from '@/types';

export const STELLAR_CONFIG: NetworkConfig = {
  network: process.env.NEXT_PUBLIC_STELLAR_NETWORK || 'testnet',
  rpcUrl: process.env.NEXT_PUBLIC_STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org',
  networkPassphrase:
    process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE || 'Test SDF Network ; September 2015',
  contractId:
    (typeof window !== 'undefined' && localStorage.getItem('splitpay_contract_id')) ||
    process.env.NEXT_PUBLIC_SPLITPAY_CONTRACT_ID ||
    'CCOXHXGFTYVRRCJ7U32QZJCWXDTNQLRMDS3IAGW5MGFEWOUEXNYYKLHF',
  explorerUrl: process.env.NEXT_PUBLIC_EXPLORER_URL || 'https://stellar.expert/explorer/testnet',
  // Default native XLM Stellar Asset Contract on Testnet (or configured asset)
  defaultAssetContract:
    process.env.NEXT_PUBLIC_DEFAULT_ASSET_CONTRACT ||
    'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC', // SAC for native XLM on testnet
};

export function getExplorerTxUrl(txHash: string): string {
  const base = STELLAR_CONFIG.explorerUrl.replace(/\/+$/, '');
  return `${base}/tx/${txHash}`;
}

export function getExplorerAccountUrl(address: string): string {
  const base = STELLAR_CONFIG.explorerUrl.replace(/\/+$/, '');
  return `${base}/account/${address}`;
}

export function getExplorerContractUrl(contractId: string): string {
  const base = STELLAR_CONFIG.explorerUrl.replace(/\/+$/, '');
  return `${base}/contract/${contractId}`;
}
