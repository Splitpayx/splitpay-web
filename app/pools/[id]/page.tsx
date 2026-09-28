'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useWallet } from '@/hooks/useWallet';
import { splitPayClient } from '@/lib/contract/splitpay';
import { getTrackedPools, getTrackedPayments } from '@/lib/registry';
import { Pool, Member, Payment, PoolStatus } from '@/types';
import { formatAddress, formatBps, formatUnits } from '@/lib/utils';
import { getExplorerAccountUrl, getExplorerContractUrl } from '@/lib/stellar/config';
import {
  ArrowLeft,
  Settings,
  CreditCard,
  Users,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

export default function PoolDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const poolId = resolvedParams.id;
  const { address } = useWallet();

  const [pool, setPool] = useState<Pool | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPoolData = async () => {
    setLoading(true);
    try {
      const onChainPool = await splitPayClient.getPool(poolId);
      if (onChainPool) {
        const tracked = getTrackedPools().find((p) => p.id === poolId);
        setPool({ ...onChainPool, name: tracked?.name });
      }

      const onChainMembers = await splitPayClient.getPoolMembers(poolId);
      setMembers(onChainMembers);

      // Load payments for this pool
      const trackedPayments = getTrackedPayments().filter((p) => p.poolId === poolId);
      const list = await Promise.all(
        trackedPayments.map(async (tp) => {
          const pmt = await splitPayClient.getPayment(tp.id);
          return pmt ? { ...pmt, title: tp.title } : null;
        })
      );
      setPayments(list.filter(Boolean) as Payment[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPoolData();
  }, [poolId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-white/50 text-sm">
        Loading pool details from Stellar...
      </div>
    );
  }

  if (!pool) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Pool Not Found</h2>
        <p className="text-xs text-white/50">
          No on-chain pool with ID #{poolId} exists on the configured contract.
        </p>
        <Link
          href="/pools"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-xs rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Pools
        </Link>
      </div>
    );
  }

  const isOwner = address && pool.owner.toLowerCase() === address.toLowerCase();
  const totalBps = members.reduce((sum, m) => sum + m.shareBps, 0);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <Link
        href="/pools"
        className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Pools
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {pool.name || `Pool #${pool.id}`}
            </h1>
            <span
              className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono font-medium ${
                pool.status === PoolStatus.Active
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}
            >
              {pool.status === PoolStatus.Active ? 'Active' : 'Inactive'}
            </span>
          </div>
          <p className="text-xs font-mono text-white/40 mt-1">Pool ID: {pool.id}</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchPoolData}
            title="Refresh"
            className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/70 hover:text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {isOwner && (
            <Link
              href={`/pools/${pool.id}/settings`}
              className="inline-flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-medium rounded-lg transition-colors"
            >
              <Settings className="w-3.5 h-3.5" /> Manage Pool
            </Link>
          )}
          <Link
            href={`/payments/new?poolId=${pool.id}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black hover:bg-white/90 text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            <CreditCard className="w-3.5 h-3.5" /> Make Payment
          </Link>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-1">
          <p className="text-xs text-white/50">Owner Address</p>
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-medium text-white">
              {formatAddress(pool.owner, 6, 6)}
            </span>
            <a
              href={getExplorerAccountUrl(pool.owner)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/40 hover:text-white"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-1">
          <p className="text-xs text-white/50">Asset SAC Address</p>
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-medium text-white">
              {formatAddress(pool.asset, 6, 6)}
            </span>
            <a
              href={getExplorerContractUrl(pool.asset)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/40 hover:text-white"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-1">
          <p className="text-xs text-white/50">Split Status</p>
          <div className="flex items-center gap-2">
            <span
              className={`font-mono text-xs font-semibold ${
                totalBps === 10000 ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {(totalBps / 100).toFixed(2)}% Configured
            </span>
          </div>
        </div>
      </div>

      {/* Members & Splits Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-white/70" />
            Configured Members ({members.length})
          </h2>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#111111] overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/5 text-white/50 border-b border-white/5">
              <tr>
                <th className="p-3.5 font-medium">Recipient Address</th>
                <th className="p-3.5 font-medium text-right">Share Percentage</th>
                <th className="p-3.5 font-medium text-right">Basis Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {members.map((m, idx) => (
                <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-3.5 font-mono text-white/90">
                    <div className="flex items-center gap-2">
                      <span>{m.address}</span>
                      {address && m.address.toLowerCase() === address.toLowerCase() && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/10 text-white font-sans">
                          You
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-3.5 font-mono font-medium text-emerald-400 text-right">
                    {formatBps(m.shareBps)}
                  </td>
                  <td className="p-3.5 font-mono text-white/50 text-right">{m.shareBps} BPS</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payments History for this Pool */}
      <div className="space-y-4 border-t border-white/5 pt-6">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-white/70" />
          Payments to this Pool ({payments.length})
        </h2>

        {payments.length === 0 ? (
          <div className="p-6 text-center rounded-xl border border-dashed border-white/10 bg-white/[0.01]">
            <p className="text-xs text-white/50">No payments have been recorded for this pool yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5 rounded-xl border border-white/10 bg-[#111111] overflow-hidden">
            {payments.map((pmt) => (
              <Link
                key={pmt.id}
                href={`/payments/${pmt.id}`}
                className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors text-xs"
              >
                <div className="space-y-1">
                  <p className="font-medium text-white">{pmt.title || `Payment #${pmt.id}`}</p>
                  <p className="font-mono text-white/40">Payer: {formatAddress(pmt.payer)}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono font-semibold text-white">{formatUnits(pmt.amount)} units</p>
                  <span
                    className={`text-[10px] font-mono uppercase ${
                      pmt.status === 2 ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {pmt.status === 2 ? 'Settled' : 'Pending'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
