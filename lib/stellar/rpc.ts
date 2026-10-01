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
  maxAttempts = 20,
  intervalMs = 2000
): Promise<rpc.Api.GetTransactionResponse> {
  const server = getRpcServer();

  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await server.getTransaction(txHash);

      if (res.status === rpc.Api.GetTransactionStatus.SUCCESS) {
        return res;
      }
      if (res.status === rpc.Api.GetTransactionStatus.FAILED) {
        throw new Error(`Transaction ${txHash} failed on-chain.`);
      }
    } catch (err: any) {
      if (err?.message?.includes('failed on-chain')) {
        throw err;
      }
      // If server.getTransaction throws due to SDK XDR parser mismatch (Protocol 21/22), fallback to raw RPC
      try {
        const rawRes = await fetch(STELLAR_CONFIG.rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: Date.now(),
            method: 'getTransaction',
            params: { hash: txHash },
          }),
        });
        const data = await rawRes.json();
        const txStatus = data?.result?.status;
        if (txStatus === 'SUCCESS') {
          return {
            status: rpc.Api.GetTransactionStatus.SUCCESS,
            latestLedger: data.result.latestLedger,
            latestLedgerCloseTime: data.result.latestLedgerCloseTime,
            oldestLedger: data.result.oldestLedger,
            oldestLedgerCloseTime: data.result.oldestLedgerCloseTime,
            applicationOrder: data.result.applicationOrder,
            feeBump: false,
            envelopeXdr: data.result.envelopeXdr,
            resultXdr: data.result.resultXdr,
            resultMetaXdr: data.result.resultMetaXdr,
            ledger: data.result.ledger,
            createdAt: data.result.createdAt,
          } as unknown as rpc.Api.GetTransactionResponse;
        }
        if (txStatus === 'FAILED') {
          throw new Error(`Transaction ${txHash} failed on-chain.`);
        }
      } catch (innerErr: any) {
        if (innerErr?.message?.includes('failed on-chain')) {
          throw innerErr;
        }
      }
    }

    // Wait before next check
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error(`Transaction ${txHash} timed out waiting for confirmation.`);
}
