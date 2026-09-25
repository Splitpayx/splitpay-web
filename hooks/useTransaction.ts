'use client';

import { useState, useCallback } from 'react';
import { TransactionState, TransactionStep } from '@/types';
import { getExplorerTxUrl } from '@/lib/stellar/config';
import { useWallet } from './useWallet';

export function useTransaction() {
  const { signTx } = useWallet();
  const [state, setState] = useState<TransactionState>({
    step: 'idle',
  });

  const reset = useCallback(() => {
    setState({ step: 'idle' });
  }, []);

  /**
   * Execute a transaction workflow:
   * 1. Awaiting wallet (prepare & sign)
   * 2. Signing
   * 3. Submitting to network
   * 4. Confirming
   * 5. Confirmed or Failed
   */
  const execute = useCallback(
    async (
      prepareTxFn: () => Promise<string>,
      submitTxFn: (signedXdr: string) => Promise<{ txHash: string }>
    ): Promise<string> => {
      try {
        setState({ step: 'awaiting_wallet' });
        const unsignedXdr = await prepareTxFn();

        setState({ step: 'signing' });
        const signedXdr = await signTx(unsignedXdr);

        setState({ step: 'submitting' });
        const { txHash } = await submitTxFn(signedXdr);

        setState({
          step: 'confirmed',
          txHash,
          explorerUrl: getExplorerTxUrl(txHash),
        });

        return txHash;
      } catch (err: any) {
        let msg = err?.message || 'Transaction execution failed.';
        if (msg.includes('User rejected') || msg.includes('cancelled')) {
          msg = 'Transaction was rejected by the wallet.';
        } else if (msg.includes('insufficient')) {
          msg = 'Insufficient balance to complete the transaction.';
        } else if (msg.includes('timed out')) {
          msg = 'Transaction submission timed out. Check explorer for confirmation.';
        }

        setState({
          step: 'failed',
          error: msg,
        });
        throw new Error(msg);
      }
    },
    [signTx]
  );

  return {
    state,
    reset,
    execute,
    isPending: ['awaiting_wallet', 'signing', 'submitting', 'confirming'].includes(state.step),
    isConfirmed: state.step === 'confirmed',
    isFailed: state.step === 'failed',
  };
}
