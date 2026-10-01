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
    <div className="w-full flex justify-center py-8 px-4 sm:px-6">
      <div className="w-full max-w-6xl space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#1E3358] pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Payments &amp; Distributions</h1>
          <p className="text-sm text-[#94A3B8]">
            Immutable on-chain payments settled and distributed via Soroban.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="http://splitpaydocs.samkiel.dev/docs/guides/execute-a-payment"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 bg-[#0F2340] hover:bg-[#1E3358] border border-[#1E3358] text-[#94A3B8] hover:text-[#14B8A6] text-xs font-medium rounded-lg transition-colors"
          >
            <span>Payment Docs</span>
          </a>
          <button
            onClick={fetchPayments}
            className="p-2 bg-[#0F2340] hover:bg-[#1E3358] border border-[#1E3358] rounded-lg text-[#94A3B8] hover:text-white transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            href="/payments/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-[#0B1A33] hover:bg-white/90 text-sm font-semibold rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" /> New Payment
          </Link>
        </div>
      </div>

      {payments.length === 0 ? (
        <div className="p-12 text-center rounded-xl border border-dashed border-[#1E3358] bg-[#0F2340]/30 space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#0F2340] border border-[#1E3358] flex items-center justify-center mx-auto text-[#94A3B8]">
            <CreditCard className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-medium text-white">No payments found</p>
            <p className="text-xs text-[#94A3B8]">
              Create a payment targeting any active pool to trigger automatic split settlement.
            </p>
          </div>
          <Link
            href="/payments/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0B1A33] hover:bg-[#1E3358] border border-[#1E3358] text-white text-xs font-semibold rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> New Payment
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-[#1E3358] bg-[#0F2340] overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B1A33] text-[#94A3B8] border-b border-[#1E3358]">
              <tr>
                <th className="p-4 font-medium">Payment Title / ID</th>
                <th className="p-4 font-medium">Target Pool</th>
                <th className="p-4 font-medium">Payer Address</th>
                <th className="p-4 font-medium text-right">Amount</th>
                <th className="p-4 font-medium text-center">Status</th>
                <th className="p-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E3358]">
              {payments.map((pmt) => (
                <tr key={pmt.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-4 font-medium text-white">
                    <div>{pmt.title || `Payment #${pmt.id}`}</div>
                    <div className="text-[11px] font-mono text-[#94A3B8]">#{pmt.id}</div>
                  </td>
                  <td className="p-4">
                    <Link
                      href={`/pools/${pmt.poolId}`}
                      className="text-[#94A3B8] hover:text-[#14B8A6] underline underline-offset-4 transition-colors"
                    >
                      Pool #{pmt.poolId}
                    </Link>
                  </td>
                  <td className="p-4 font-mono text-[#94A3B8]">{formatAddress(pmt.payer, 6, 6)}</td>
                  <td className="p-4 font-mono font-semibold text-white text-right">
                    {formatUnits(pmt.amount)} units
                  </td>
                  <td className="p-4 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono font-medium ${
                        pmt.status === 2
                          ? 'bg-[#14B8A6]/12 text-[#14B8A6] border border-[#14B8A6]/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {pmt.status === 2 ? 'Settled' : 'Pending'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <Link
                      href={`/payments/${pmt.id}`}
                      className="inline-flex items-center gap-1 text-xs text-[#94A3B8] hover:text-[#14B8A6] transition-colors"
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
    </div>
  );
}
