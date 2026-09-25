'use client';

import React from 'react';
import { TransactionState } from '@/types';
import { Loader2, CheckCircle2, XCircle, ExternalLink, ArrowRight } from 'lucide-react';

interface TransactionStatusModalProps {
  state: TransactionState;
  onClose?: () => void;
  title?: string;
}

export function TransactionStatusModal({
  state,
  onClose,
  title = 'Processing Transaction',
}: TransactionStatusModalProps) {
  if (state.step === 'idle') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-[#111111] border border-white/10 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-5 text-white">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <h3 className="font-semibold text-lg text-white/90">{title}</h3>
          {(state.step === 'confirmed' || state.step === 'failed') && onClose && (
            <button
              onClick={onClose}
              className="text-white/40 hover:text-white text-sm transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex flex-col items-center justify-center py-4 text-center space-y-4">
          {state.step === 'awaiting_wallet' && (
            <>
              <div className="w-14 h-14 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 animate-pulse">
                <Loader2 className="w-7 h-7 animate-spin" />
              </div>
              <div className="space-y-1">
                <p className="font-medium text-white">Waiting for Wallet Confirmation</p>
                <p className="text-xs text-white/50">
                  Please approve the transaction in your connected wallet.
                </p>
              </div>
            </>
          )}

          {state.step === 'signing' && (
            <>
              <div className="w-14 h-14 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <Loader2 className="w-7 h-7 animate-spin" />
              </div>
              <div className="space-y-1">
                <p className="font-medium text-white">Signing Transaction</p>
                <p className="text-xs text-white/50">Generating cryptographic signature...</p>
              </div>
            </>
          )}

          {(state.step === 'submitting' || state.step === 'confirming') && (
            <>
              <div className="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400">
                <Loader2 className="w-7 h-7 animate-spin" />
              </div>
              <div className="space-y-1">
                <p className="font-medium text-white">Confirming on Stellar Network</p>
                <p className="text-xs text-white/50">Submitting to Soroban RPC and awaiting consensus...</p>
              </div>
            </>
          )}

          {state.step === 'confirmed' && (
            <>
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <p className="font-medium text-emerald-400 text-lg">Transaction Confirmed</p>
                <p className="text-xs text-white/50">The contract state has been updated on-chain.</p>
              </div>
              {state.explorerUrl && (
                <a
                  href={state.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 underline underline-offset-4 mt-2"
                >
                  View on Stellar Explorer <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </>
          )}

          {state.step === 'failed' && (
            <>
              <div className="w-14 h-14 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-400">
                <XCircle className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <p className="font-medium text-rose-400 text-lg">Transaction Failed</p>
                <p className="text-xs text-rose-200/80 max-w-xs">{state.error || 'An unexpected error occurred.'}</p>
              </div>
            </>
          )}
        </div>

        {(state.step === 'confirmed' || state.step === 'failed') && onClose && (
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-white/10 hover:bg-white/15 text-white font-medium text-sm rounded-lg transition-colors"
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
}
