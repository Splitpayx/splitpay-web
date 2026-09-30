'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@/hooks/useWallet';
import { splitPayClient } from '@/lib/contract/splitpay';
import { getTrackedPools, getTrackedPayments } from '@/lib/registry';
import { Pool, Payment, PoolStatus } from '@/types';
import { formatAddress, formatUnits } from '@/lib/utils';
import { getExplorerAccountUrl } from '@/lib/stellar/config';
import { Plus, Split, CreditCard, ArrowRight, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';

export default function DashboardPage() {
  const { address, xlmBalance, refreshBalances, isConnecting } = useWallet();
  const [pools, setPools] = useState<Pool[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load tracked pools
      const trackedPools = getTrackedPools();
      const poolPromises = trackedPools.map(async (tp) => {
        const onChain = await splitPayClient.getPool(tp.id);
        if (onChain) {
          return { ...onChain, name: tp.name };
        }
        return null;
      });
      const resolvedPools = (await Promise.all(poolPromises)).filter(Boolean) as Pool[];
      setPools(resolvedPools);

      // Load tracked payments
      const trackedPayments = getTrackedPayments();
      const paymentPromises = trackedPayments.map(async (tp) => {
        const onChain = await splitPayClient.getPayment(tp.id);
        if (onChain) {
          return { ...onChain, title: tp.title };
        }
        return null;
      });
      const resolvedPayments = (await Promise.all(paymentPromises)).filter(Boolean) as Payment[];
      setPayments(resolvedPayments);
    } catch {
      // Handled gracefully
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [address]);

  return (
    <div className="w-full flex justify-center py-10 px-4 sm:px-6">
      <div className="w-full max-w-6xl space-y-8">
        {/* Header with Quick Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Financial Dashboard</h1>
          <p className="text-sm text-white/50">
            Real-time Soroban on-chain pools and settlement activity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              refreshBalances();
              loadData();
            }}
            title="Refresh on-chain state"
            className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/70 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            href="/pools/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black hover:bg-white/90 text-sm font-semibold rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" /> Create Pool
          </Link>
          <Link
            href="/payments/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/10 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <CreditCard className="w-4 h-4" /> New Payment
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
          <p className="text-xs text-white/50 font-medium">Connected Account</p>
          {address ? (
            <div className="flex items-center justify-between">
              <span className="font-mono text-base font-semibold text-white">
                {formatAddress(address, 6, 6)}
              </span>
              <a
                href={getExplorerAccountUrl(address)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/40 hover:text-white"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          ) : (
            <p className="text-sm text-amber-400">Wallet not connected</p>
          )}
        </div>

        <div className="p-5 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
          <p className="text-xs text-white/50 font-medium">Stellar Native Balance</p>
          <p className="font-mono text-xl font-bold text-white">
            {address ? `${parseFloat(xlmBalance).toFixed(4)} XLM` : '—'}
          </p>
        </div>

        <div className="p-5 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
          <p className="text-xs text-white/50 font-medium">Active On-Chain Pools</p>
          <p className="font-mono text-xl font-bold text-white">
            {pools.filter((p) => p.status === PoolStatus.Active).length}
          </p>
        </div>
      </div>

      {/* Active Pools Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Split className="w-5 h-5 text-white/70" />
            Configured Pools
          </h2>
          <Link href="/pools" className="text-xs text-white/50 hover:text-white transition-colors">
            View all pools →
          </Link>
        </div>

        {pools.length === 0 ? (
          <div className="p-8 text-center rounded-xl border border-dashed border-white/10 bg-white/[0.01] space-y-3">
            <p className="text-sm text-white/60">No payment pools configured yet.</p>
            <Link
              href="/pools/new"
              className="inline-flex items-center gap-1.5 text-xs text-white underline underline-offset-4"
            >
              Create your first pool
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pools.map((pool) => (
              <Link
                key={pool.id}
                href={`/pools/${pool.id}`}
                className="group p-5 rounded-xl bg-[#111111] border border-white/10 hover:border-white/25 transition-all space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-white group-hover:text-white transition-colors">
                      {pool.name || `Pool #${pool.id}`}
                    </h3>
                    <p className="text-xs font-mono text-white/40">ID: {pool.id}</p>
                  </div>
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

                <div className="text-xs space-y-1 text-white/60 border-t border-white/5 pt-3">
                  <div className="flex justify-between">
                    <span>Owner:</span>
                    <span className="font-mono text-white/80">{formatAddress(pool.owner)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Asset:</span>
                    <span className="font-mono text-white/80">{formatAddress(pool.asset)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-white/50 pt-2 border-t border-white/5">
                  <span>View Details</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recent Payments Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-white/70" />
            Recent Payments
          </h2>
          <Link href="/payments" className="text-xs text-white/50 hover:text-white transition-colors">
            View all payments →
          </Link>
        </div>

        {payments.length === 0 ? (
          <div className="p-8 text-center rounded-xl border border-dashed border-white/10 bg-white/[0.01]">
            <p className="text-sm text-white/60">No payments created or settled yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5 rounded-xl border border-white/10 bg-[#111111] overflow-hidden">
            {payments.map((pmt) => (
              <Link
                key={pmt.id}
                href={`/payments/${pmt.id}`}
                className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium text-white">{pmt.title || `Payment #${pmt.id}`}</p>
                  <div className="flex items-center gap-3 text-xs text-white/50">
                    <span>Pool #{pmt.poolId}</span>
                    <span>•</span>
                    <span className="font-mono">{formatAddress(pmt.payer)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-mono font-semibold text-white">
                      {formatUnits(pmt.amount)} units
                    </p>
                    <span
                      className={`text-[10px] font-mono uppercase ${
                        pmt.status === 2 ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {pmt.status === 2 ? 'Settled' : 'Pending'}
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-white/30" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
