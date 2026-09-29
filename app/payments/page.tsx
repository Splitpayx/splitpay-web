'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@/hooks/useWallet';
import { splitPayClient } from '@/lib/contract/splitpay';
import { getTrackedPayments } from '@/lib/registry';
import { Payment, PaymentStatus } from '@/types';
import { formatAddress, formatUnits } from '@/lib/utils';
import { Plus, CreditCard, ArrowRight, RefreshCw, ExternalLink } from 'lucide-react';

export default function PaymentsPage() {
  const { address } = useWallet();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const tracked = getTrackedPayments();
      const list = await Promise.all(
        tracked.map(async (t) => {
          const onChain = await splitPayClient.getPayment(t.id);
          if (onChain) {
            return { ...onChain, title: t.title };
          }
          return null;
        })
      );
      setPayments(list.filter(Boolean) as Payment[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [address]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Payments & Distributions</h1>
          <p className="text-sm text-white/50">
            Immutable on-chain payments settled and distributed via Soroban.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchPayments}
            className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/70 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            href="/payments/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black hover:bg-white/90 text-sm font-semibold rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" /> New Payment
          </Link>
        </div>
      </div>

      {payments.length === 0 ? (
        <div className="p-12 text-center rounded-xl border border-dashed border-white/10 bg-white/[0.01] space-y-4">
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto text-white/50">
            <CreditCard className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-medium text-white">No payments found</p>
            <p className="text-xs text-white/50">
              Create a payment targeting any active pool to trigger automatic split settlement.
            </p>
          </div>
          <Link
            href="/payments/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> New Payment
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 bg-[#111111] overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/5 text-white/50 border-b border-white/5">
              <tr>
                <th className="p-4 font-medium">Payment Title / ID</th>
                <th className="p-4 font-medium">Target Pool</th>
                <th className="p-4 font-medium">Payer Address</th>
                <th className="p-4 font-medium text-right">Amount</th>
                <th className="p-4 font-medium text-center">Status</th>
                <th className="p-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {payments.map((pmt) => (
                <tr key={pmt.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-4 font-medium text-white">
                    <div>{pmt.title || `Payment #${pmt.id}`}</div>
                    <div className="text-[11px] font-mono text-white/40">#{pmt.id}</div>
                  </td>
                  <td className="p-4">
                    <Link
                      href={`/pools/${pmt.poolId}`}
                      className="text-white/80 hover:text-white underline underline-offset-4"
                    >
                      Pool #{pmt.poolId}
                    </Link>
                  </td>
                  <td className="p-4 font-mono text-white/70">{formatAddress(pmt.payer, 6, 6)}</td>
                  <td className="p-4 font-mono font-semibold text-white text-right">
                    {formatUnits(pmt.amount)} units
                  </td>
                  <td className="p-4 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono font-medium ${
                        pmt.status === 2
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {pmt.status === 2 ? 'Settled' : 'Pending'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <Link
                      href={`/payments/${pmt.id}`}
                      className="inline-flex items-center gap-1 text-xs text-white/60 hover:text-white transition-colors"
                    >
                      Distribution <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
