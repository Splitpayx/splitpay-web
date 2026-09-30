'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useWallet } from '@/hooks/useWallet';
import { splitPayClient } from '@/lib/contract/splitpay';
import { getTrackedPayments } from '@/lib/registry';
import { Payment, Distribution, PaymentStatus } from '@/types';
import { formatAddress, formatBps, formatUnits } from '@/lib/utils';
import { getExplorerAccountUrl, getExplorerContractUrl } from '@/lib/stellar/config';
import { ArrowLeft, CreditCard, ExternalLink, CheckCircle2, Clock, RefreshCw, AlertCircle } from 'lucide-react';

export default function PaymentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const paymentId = resolvedParams.id;
  const { address } = useWallet();

  const [payment, setPayment] = useState<Payment | null>(null);
  const [distributions, setDistributions] = useState<Distribution[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPaymentData = async () => {
    setLoading(true);
    try {
      const onChain = await splitPayClient.getPayment(paymentId);
      if (onChain) {
        const tracked = getTrackedPayments().find((p) => p.id === paymentId);
        setPayment({ ...onChain, title: tracked?.title });
      }

      const dists = await splitPayClient.getDistributions(paymentId);
      setDistributions(dists);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentData();
  }, [paymentId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-white/50 text-sm">
        Fetching payment state from Stellar...
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Payment Not Found</h2>
        <p className="text-xs text-white/50">
          No on-chain payment with ID #{paymentId} exists on the contract.
        </p>
        <Link
          href="/payments"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-xs rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Payments
        </Link>
      </div>
    );
  }

  const isSettled = payment.status === PaymentStatus.Settled;

  return (
    <div className="w-full flex justify-center py-8 px-4 sm:px-6">
      <div className="w-full max-w-4xl space-y-8">
      <Link
        href="/payments"
        className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Payments
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {payment.title || `Payment #${payment.id}`}
            </h1>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] uppercase font-mono font-medium ${
                isSettled
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}
            >
              {isSettled ? (
                <>
                  <CheckCircle2 className="w-3 h-3" /> Settled
                </>
              ) : (
                <>
                  <Clock className="w-3 h-3" /> Pending
                </>
              )}
            </span>
          </div>
          <p className="text-xs font-mono text-white/40 mt-1">Payment ID: {payment.id}</p>
        </div>

        <button
          onClick={fetchPaymentData}
          title="Refresh"
          className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/70 hover:text-white transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-1">
          <p className="text-xs text-white/50">Total Amount</p>
          <p className="font-mono text-xl font-bold text-white">
            {formatUnits(payment.amount)} units
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-1">
          <p className="text-xs text-white/50">Target Pool</p>
          <Link
            href={`/pools/${payment.poolId}`}
            className="font-mono text-xs font-semibold text-white hover:underline block pt-1"
          >
            Pool #{payment.poolId} →
          </Link>
        </div>

        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-1">
          <p className="text-xs text-white/50">Payer Address</p>
          <div className="flex items-center justify-between pt-1">
            <span className="font-mono text-xs text-white/80">{formatAddress(payment.payer, 6, 6)}</span>
            <a
              href={getExplorerAccountUrl(payment.payer)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/40 hover:text-white"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Authoritative Distribution Breakdown */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Settlement Distributions</h2>
            <p className="text-xs text-white/50">
              Historical snapshot persisted on the Soroban ledger at time of settlement.
            </p>
          </div>
          <span className="text-xs text-white/40 font-mono">{distributions.length} Recipients</span>
        </div>

        {distributions.length === 0 ? (
          <div className="p-8 text-center rounded-xl border border-dashed border-white/10 bg-white/[0.01]">
            <p className="text-xs text-white/50">
              {isSettled
                ? 'No distribution records returned.'
                : 'Payment is pending. Distributions will be permanently recorded upon settlement.'}
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-white/10 bg-[#111111] overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 text-white/50 border-b border-white/5">
                <tr>
                  <th className="p-3.5 font-medium">Recipient Address</th>
                  <th className="p-3.5 font-medium text-right">Share Snapshot</th>
                  <th className="p-3.5 font-medium text-right">Distributed Amount</th>
                  <th className="p-3.5 font-medium text-center">Explorer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {distributions.map((d, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-3.5 font-mono text-white/90">
                      <div className="flex items-center gap-2">
                        <span>{d.recipient}</span>
                        {address && d.recipient.toLowerCase() === address.toLowerCase() && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/10 text-white font-sans">
                            You
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-white/70 text-right">{formatBps(d.shareBps)}</td>
                    <td className="p-3.5 font-mono font-semibold text-emerald-400 text-right">
                      {formatUnits(d.amount)} units
                    </td>
                    <td className="p-3.5 text-center">
                      <a
                        href={getExplorerAccountUrl(d.recipient)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex text-white/40 hover:text-white"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
    </div>
  );
}
