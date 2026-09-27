'use client';

import React from 'react';
import Link from 'next/link';
import { useWallet } from '@/hooks/useWallet';
import { WalletButton } from '@/components/wallet/WalletButton';
import { Split, ShieldCheck, ArrowRight, Layers, Coins, CheckCircle2 } from 'lucide-react';

export default function LandingPage() {
  const { address } = useWallet();

  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-20 pb-16 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs text-white/70">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          Stellar Soroban Protocol
        </div>

        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white max-w-3xl mx-auto leading-tight">
          Collaborative payments without the manual splitting.
        </h1>

        <p className="text-base sm:text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
          Create collaborative payment pools, configure verified member shares, and distribute incoming
          funds automatically and atomically through Soroban smart contracts on Stellar.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          {address ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-semibold rounded-lg text-sm hover:bg-white/90 transition-all shadow-sm"
            >
              Go to Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <WalletButton />
          )}

          <Link
            href="/pools"
            className="inline-flex items-center gap-2 px-6 py-3 border border-white/10 bg-white/5 hover:bg-white/10 text-white font-medium rounded-lg text-sm transition-colors"
          >
            Explore Pools
          </Link>
        </div>
      </section>

      {/* Protocol Architecture Workflow */}
      <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-16 border-t border-white/5">
        <div className="text-center mb-12 space-y-2">
          <h2 className="text-2xl font-bold text-white">How SplitPay Works</h2>
          <p className="text-sm text-white/50">
            The blockchain is the financial source of truth. No middleman holds custody.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-6 rounded-xl bg-white/[0.02] border border-white/10 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-sm">
              01
            </div>
            <h3 className="font-semibold text-white text-base">Connect Wallet</h3>
            <p className="text-xs text-white/50 leading-relaxed">
              Authenticate directly with your non-custodial Stellar wallet. Your address is your identity.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-white/[0.02] border border-white/10 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-sm">
              02
            </div>
            <h3 className="font-semibold text-white text-base">Create Pool</h3>
            <p className="text-xs text-white/50 leading-relaxed">
              Deploy an on-chain configuration specifying member addresses and exact split shares.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-white/[0.02] border border-white/10 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-sm">
              03
            </div>
            <h3 className="font-semibold text-white text-base">Receive Payment</h3>
            <p className="text-xs text-white/50 leading-relaxed">
              Payers deposit supported Stellar assets (XLM or tokens) targeted directly to the pool.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-white/[0.02] border border-white/10 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-sm">
              04
            </div>
            <h3 className="font-semibold text-white text-base">Atomic Split</h3>
            <p className="text-xs text-white/50 leading-relaxed">
              The Soroban contract calculates distributions and transfers funds instantly to all members.
            </p>
          </div>
        </div>
      </section>

      {/* Financial Guarantees */}
      <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-16 border-t border-white/5">
        <div className="bg-[#111111] border border-white/10 rounded-2xl p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl">
            <div className="inline-flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4" />
              Mathematically Verified Invariants
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Zero Rounding Loss. 100% Deterministic Settlement.
            </h2>
            <p className="text-sm text-white/60 leading-relaxed">
              Built on basis points (10,000 = 100.00%) with integer arithmetic and snapshot preservation.
              Once settled, historical distributions remain immutable on the Stellar ledger.
            </p>
          </div>

          <div className="w-full md:w-auto flex flex-col gap-3">
            <div className="flex items-center gap-3 text-xs text-white/80 bg-white/5 px-4 py-2.5 rounded-lg border border-white/10">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Checked integer arithmetic (no floats)</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-white/80 bg-white/5 px-4 py-2.5 rounded-lg border border-white/10">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Immutable historical payment snapshots</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-white/80 bg-white/5 px-4 py-2.5 rounded-lg border border-white/10">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Atomic settlement across all recipients</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
