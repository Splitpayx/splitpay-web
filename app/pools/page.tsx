'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@/hooks/useWallet';
import { splitPayClient } from '@/lib/contract/splitpay';
import { getTrackedPools } from '@/lib/registry';
import { Pool, PoolStatus } from '@/types';
import { formatAddress } from '@/lib/utils';
import { Plus, Split, ArrowRight, RefreshCw } from 'lucide-react';

export default function PoolsPage() {
  const { address } = useWallet();
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPools = async () => {
    setLoading(true);
    try {
      const tracked = getTrackedPools();
      const list = await Promise.all(
        tracked.map(async (t) => {
          const onChain = await splitPayClient.getPool(t.id);
          if (onChain) {
            return { ...onChain, name: t.name };
          }
          return null;
        })
      );
      setPools(list.filter(Boolean) as Pool[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPools();
  }, [address]);

  return (
    <div className="w-full flex justify-center py-8 px-4 sm:px-6">
      <div className="w-full max-w-6xl space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#1E3358] pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Payment Pools</h1>
          <p className="text-sm text-[#94A3B8]">
            Collaborative distribution configurations verified on Soroban.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchPools}
            className="p-2 bg-[#0F2340] hover:bg-[#1E3358] border border-[#1E3358] rounded-lg text-[#94A3B8] hover:text-white transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            href="/pools/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-[#0B1A33] hover:bg-white/90 text-sm font-semibold rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" /> New Pool
          </Link>
        </div>
      </div>

      {pools.length === 0 ? (
        <div className="p-12 text-center rounded-xl border border-dashed border-[#1E3358] bg-[#0F2340]/30 space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#0F2340] border border-[#1E3358] flex items-center justify-center mx-auto text-[#94A3B8]">
            <Split className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-medium text-white">No pools configured</p>
            <p className="text-xs text-[#94A3B8]">
              Create an on-chain pool to configure recipients and split shares.
            </p>
          </div>
          <Link
            href="/pools/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0B1A33] hover:bg-[#1E3358] border border-[#1E3358] text-white text-xs font-semibold rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Create Pool
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pools.map((pool) => (
            <Link
              key={pool.id}
              href={`/pools/${pool.id}`}
              className="group p-5 rounded-xl bg-[#0F2340] border border-[#1E3358] hover:border-[#14B8A6]/40 transition-all space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-white group-hover:text-white transition-colors">
                    {pool.name || `Pool #${pool.id}`}
                  </h3>
                  <p className="text-xs font-mono text-[#94A3B8]">ID: {pool.id}</p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono font-medium ${
                    pool.status === PoolStatus.Active
                      ? 'bg-[#14B8A6]/12 text-[#14B8A6] border border-[#14B8A6]/30'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}
                >
                  {pool.status === PoolStatus.Active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="text-xs space-y-1.5 text-[#94A3B8] border-t border-[#1E3358] pt-3">
                <div className="flex justify-between">
                  <span>Owner:</span>
                  <span className="font-mono text-white/80">{formatAddress(pool.owner)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Asset SAC:</span>
                  <span className="font-mono text-white/80">{formatAddress(pool.asset)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-[#94A3B8] pt-2 border-t border-[#1E3358]">
                <span>Manage &amp; Details</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
