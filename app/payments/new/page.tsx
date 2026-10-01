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

      await executeTx(
        () => splitPayClient.prepareSettlePayment(address, paymentId),
        (signedXdr) => splitPayClient.submitSignedTx(signedXdr)
      );

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
    <div className="w-full flex justify-center py-10 px-4 sm:px-6">
      <div className="w-full max-w-2xl space-y-8">
        <Link
          href="/payments"
          className="inline-flex items-center gap-2 text-xs font-medium text-[#94A3B8] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Payments
        </Link>

        <div className="space-y-2 border-b border-[#1E3358] pb-5">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-400 text-xs font-medium">
            <CreditCard className="w-3.5 h-3.5" />
            Atomic Settlement Engine
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Create &amp; Settle Payment</h1>
          <p className="text-sm text-[#94A3B8]">
            Deposit funds to a pool for instant, atomic distribution via Soroban smart contracts.
          </p>
        </div>

        {clientError && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3 shadow-lg">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span className="font-medium">{clientError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-[#0F2340] p-6 sm:p-7 rounded-2xl border border-[#1E3358] shadow-xl space-y-5">
            <h2 className="font-semibold text-white text-base">Payment Details</h2>

          <div className="space-y-1.5">
            <label className="text-xs text-[#94A3B8]">Target Pool</label>
            <select
              value={selectedPoolId}
              onChange={(e) => setSelectedPoolId(e.target.value)}
              required
              className="w-full"
            >
              {availablePools.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name || `Pool #${p.id}`} (ID: {p.id})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-[#94A3B8]">Payment Title / Reference (Metadata)</label>
            <input
              type="text"
              placeholder="e.g. Q1 Milestone Payout"
              value={paymentTitle}
              onChange={(e) => setPaymentTitle(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-[#94A3B8]">Amount</label>
            <div className="relative">
              <input
                type="number"
                step="any"
                min="0.0000001"
                placeholder="100"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                required
                className="w-full font-mono pr-16"
              />
              <span className="absolute right-3 top-2.5 text-xs font-mono text-[#64748B]">UNITS</span>
            </div>
            {selectedPool && (
              <p className="text-[11px] font-mono text-[#64748B]">
                Asset SAC: {formatAddress(selectedPool.asset, 8, 8)}
              </p>
            )}
          </div>
        </div>

        {/* Contract Distribution Preview */}
        <div className="bg-[#0F2340] p-6 sm:p-7 rounded-2xl border border-[#1E3358] shadow-xl space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-white text-base">Deterministic Split Preview</h2>
              <p className="text-xs text-[#94A3B8]">Calculated directly according to contract rules.</p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#14B8A6]/30 bg-[#14B8A6]/10 text-xs text-[#14B8A6] font-mono">
              <ShieldCheck className="w-3.5 h-3.5" />
              100% Invariant
            </div>
          </div>

          {poolMembers.length === 0 ? (
            <p className="text-xs text-[#64748B] py-3">No members configured for this pool.</p>
          ) : (
            <div className="divide-y divide-[#1E3358] rounded-xl border border-[#1E3358] bg-[#0B1A33] overflow-hidden">
              {previewAllocations.map((alloc, idx) => (
                <div key={idx} className="flex items-center justify-between p-3.5 text-xs">
                  <div className="space-y-0.5">
                    <span className="font-mono text-white/90">{formatAddress(alloc.address, 8, 8)}</span>
                    <span className="block text-[11px] text-[#94A3B8]">{formatBps(alloc.shareBps)} share</span>
                  </div>
                  <div className="text-right font-mono font-semibold text-[#14B8A6]">
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
          className="w-full py-3.5 px-6 bg-white text-[#0B1A33] font-semibold text-sm rounded-xl hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md active:scale-[0.99]"
        >
          {!address ? 'Connect Wallet to Pay' : 'Sign & Settle Payment on Soroban'}
        </button>
      </form>

      <TransactionStatusModal state={txState} onClose={resetTx} title="Settling Payment on Stellar" />
      </div>
    </div>
  );
}

export default function CreatePaymentPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-[#94A3B8]">Loading...</div>}>
      <CreatePaymentContent />
    </Suspense>
  );
}
