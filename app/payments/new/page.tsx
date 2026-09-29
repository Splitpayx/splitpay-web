'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useWallet } from '@/hooks/useWallet';
import { useTransaction } from '@/hooks/useTransaction';
import { splitPayClient } from '@/lib/contract/splitpay';
import { getTrackedPools, saveTrackedPayment } from '@/lib/registry';
import { Pool, Member, PoolStatus } from '@/types';
import { formatAddress, formatBps, parseUnits, formatUnits } from '@/lib/utils';
import { calculateContractAllocations } from '@/lib/validation';
import { TransactionStatusModal } from '@/components/shared/TransactionStatusModal';
import { ArrowLeft, CreditCard, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';

function CreatePaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPoolId = searchParams.get('poolId') || '';

  const { address } = useWallet();
  const { state: txState, execute: executeTx, reset: resetTx } = useTransaction();

  const [availablePools, setAvailablePools] = useState<Pool[]>([]);
  const [selectedPoolId, setSelectedPoolId] = useState(initialPoolId);
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null);
  const [poolMembers, setPoolMembers] = useState<Member[]>([]);

  const [paymentTitle, setPaymentTitle] = useState('');
  const [amountInput, setAmountInput] = useState('100');
  const [clientError, setClientError] = useState<string | null>(null);
  const [loadingPool, setLoadingPool] = useState(false);

  // Load available pools
  useEffect(() => {
    async function loadPools() {
      const tracked = getTrackedPools();
      const list = await Promise.all(
        tracked.map(async (t) => {
          const onChain = await splitPayClient.getPool(t.id);
          return onChain ? { ...onChain, name: t.name } : null;
        })
      );
      const filtered = list.filter(Boolean) as Pool[];
      setAvailablePools(filtered);

      if (!selectedPoolId && filtered.length > 0) {
        setSelectedPoolId(filtered[0].id);
      }
    }
    loadPools();
  }, []);

  // When selectedPoolId changes, fetch pool details and members
  useEffect(() => {
    if (!selectedPoolId) return;
    async function loadSelected() {
      setLoadingPool(true);
      try {
        const p = await splitPayClient.getPool(selectedPoolId);
        setSelectedPool(p);
        const m = await splitPayClient.getPoolMembers(selectedPoolId);
        setPoolMembers(m);
      } finally {
        setLoadingPool(false);
      }
    }
    loadSelected();
  }, [selectedPoolId]);

  // Compute live split distribution preview
  const parsedAmount = parseUnits(amountInput, 7);
  const previewAllocations = calculateContractAllocations(parsedAmount, poolMembers);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setClientError(null);

    if (!address) {
      setClientError('Please connect your Stellar wallet.');
      return;
    }

    if (!selectedPool) {
      setClientError('Please select a valid pool.');
      return;
    }

    if (selectedPool.status !== PoolStatus.Active) {
      setClientError('The selected pool is inactive and cannot accept payments.');
      return;
    }

    if (parsedAmount <= BigInt(0)) {
      setClientError('Payment amount must be greater than zero.');
      return;
    }

    const totalBps = poolMembers.reduce((sum, m) => sum + m.shareBps, 0);
    if (totalBps !== 10000) {
      setClientError(
        `Pool configuration invalid: total member shares must equal 100% (current: ${(totalBps / 100).toFixed(2)}%).`
      );
      return;
    }

    const paymentId = Date.now().toString();

    try {
      // Step 1: Create payment on-chain
      await executeTx(
        () =>
          splitPayClient.prepareCreatePayment(
            address,
            paymentId,
            selectedPool.id,
            address,
            parsedAmount
          ),
        (signedXdr) => splitPayClient.submitSignedTx(signedXdr)
      );

      // Step 2: Settle payment atomically on-chain
      await executeTx(
        () => splitPayClient.prepareSettlePayment(address, paymentId),
        (signedXdr) => splitPayClient.submitSignedTx(signedXdr)
      );

      // Save to client registry
      saveTrackedPayment({
        id: paymentId,
        poolId: selectedPool.id,
        title: paymentTitle || `Payment #${paymentId}`,
        createdAt: Math.floor(Date.now() / 1000),
      });

      router.push(`/payments/${paymentId}`);
    } catch (err: any) {
      setClientError(err?.message || 'Payment execution failed.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <Link
        href="/payments"
        className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Payments
      </Link>

      <div className="space-y-1 border-b border-white/10 pb-4">
        <h1 className="text-2xl font-bold text-white tracking-tight">Create & Settle Payment</h1>
        <p className="text-sm text-white/50">
          Deposit funds to a pool for instant, atomic distribution via Soroban smart contracts.
        </p>
      </div>

      {clientError && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{clientError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-[#111111] p-6 rounded-xl border border-white/10 space-y-4">
          <h2 className="font-semibold text-white text-sm">Payment Details</h2>

          <div className="space-y-1.5">
            <label className="text-xs text-white/60">Target Pool</label>
            <select
              value={selectedPoolId}
              onChange={(e) => setSelectedPoolId(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm bg-black/40 border border-white/10 rounded-lg text-white focus:outline-hidden"
            >
              {availablePools.map((p) => (
                <option key={p.id} value={p.id} className="bg-[#111111] text-white">
                  {p.name || `Pool #${p.id}`} (ID: {p.id})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-white/60">Payment Title / Reference (Metadata)</label>
            <input
              type="text"
              placeholder="e.g. Q1 Milestone Payout"
              value={paymentTitle}
              onChange={(e) => setPaymentTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-black/40 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-hidden"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-white/60">Amount</label>
            <div className="relative">
              <input
                type="number"
                step="any"
                min="0.0000001"
                placeholder="100"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm font-mono bg-black/40 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-hidden pr-16"
              />
              <span className="absolute right-3 top-2.5 text-xs font-mono text-white/40">UNITS</span>
            </div>
            {selectedPool && (
              <p className="text-[11px] font-mono text-white/40">
                Asset SAC: {formatAddress(selectedPool.asset, 8, 8)}
              </p>
            )}
          </div>
        </div>

        {/* Contract Distribution Preview */}
        <div className="bg-[#111111] p-6 rounded-xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-white text-sm">Deterministic Split Preview</h2>
              <p className="text-xs text-white/50">Calculated directly according to contract rules.</p>
            </div>
            <div className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
              <ShieldCheck className="w-3.5 h-3.5" />
              100% Invariant
            </div>
          </div>

          {poolMembers.length === 0 ? (
            <p className="text-xs text-white/40 py-2">No members configured for this pool.</p>
          ) : (
            <div className="divide-y divide-white/5 rounded-lg border border-white/5 bg-black/30 overflow-hidden">
              {previewAllocations.map((alloc, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 text-xs">
                  <div className="space-y-0.5">
                    <span className="font-mono text-white/90">{formatAddress(alloc.address, 8, 8)}</span>
                    <span className="block text-[11px] text-white/40">{formatBps(alloc.shareBps)} share</span>
                  </div>
                  <div className="text-right font-mono font-semibold text-emerald-400">
                    {formatUnits(alloc.amount)} units
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={!address || !selectedPool || txState.step !== 'idle'}
          className="w-full py-3 px-4 bg-white text-black font-semibold text-sm rounded-lg hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
        >
          {!address ? 'Connect Wallet to Pay' : 'Sign & Settle Payment on Soroban'}
        </button>
      </form>

      <TransactionStatusModal state={txState} onClose={resetTx} title="Settling Payment on Stellar" />
    </div>
  );
}

export default function CreatePaymentPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-white/50">Loading...</div>}>
      <CreatePaymentContent />
    </Suspense>
  );
}
