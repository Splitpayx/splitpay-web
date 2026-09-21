import { rpc, Horizon, Account, Keypair, Networks } from '@stellar/stellar-sdk';
import { STELLAR_CONFIG } from './config';

/**
 * Returns a Soroban RPC server instance
 */
export function getRpcServer(): rpc.Server {
  return new rpc.Server(STELLAR_CONFIG.rpcUrl, {
    allowHttp: STELLAR_CONFIG.rpcUrl.startsWith('http://'),
  });
}

/**
 * Fetch account balances from Stellar network
 */
export async function getAccountBalances(address: string): Promise<{
  xlm: string;
  balances: { asset: string; balance: string }[];
}> {
  try {
    const horizonUrl =
      STELLAR_CONFIG.network === 'public'
        ? 'https://horizon.stellar.org'
        : 'https://horizon-testnet.stellar.org';

    const horizon = new Horizon.Server(horizonUrl);
    const account = await horizon.loadAccount(address);

    let xlm = '0';
    const balances: { asset: string; balance: string }[] = [];

    for (const b of account.balances) {
      if (b.asset_type === 'native') {
        xlm = b.balance;
      } else {
        const assetCode = 'asset_code' in b ? b.asset_code : b.asset_type;
        balances.push({
          asset: assetCode,
          balance: b.balance,
        });
      }
    }

    return { xlm, balances };
  } catch (err: unknown) {
    // Account might not be funded on testnet yet
    return { xlm: '0', balances: [] };
  }
}

/**
 * Load an account sequence from RPC
 */
export async function loadAccount(address: string): Promise<Account> {
  const server = getRpcServer();
  return await server.getAccount(address);
}

/**
 * Poll for transaction status until confirmed or failed
 */
export async function pollTransactionStatus(
  txHash: string,
  maxAttempts = 15,
  intervalMs = 2000
): Promise<rpc.Api.GetTransactionResponse> {
  const server = getRpcServer();

  for (let i = 0; i < maxAttempts; i++) {
    const res = await server.getTransaction(txHash);

    if (res.status === rpc.Api.GetTransactionStatus.SUCCESS) {
      return res;
    }
    if (res.status === rpc.Api.GetTransactionStatus.FAILED) {
      throw new Error(`Transaction ${txHash} failed on-chain.`);
    }

    // Wait before next check
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error(`Transaction ${txHash} timed out waiting for confirmation.`);
}
