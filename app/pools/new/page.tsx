'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/hooks/useWallet';
import { useTransaction } from '@/hooks/useTransaction';
import { splitPayClient } from '@/lib/contract/splitpay';
import { STELLAR_CONFIG } from '@/lib/stellar/config';
import { saveTrackedPool } from '@/lib/registry';
import { validateMemberShares, isValidStellarAddress } from '@/lib/validation';
import { TransactionStatusModal } from '@/components/shared/TransactionStatusModal';
import { formatBps, parseBps } from '@/lib/utils';
import { Plus, Trash2, ArrowLeft, ShieldCheck, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface MemberEntry {
  address: string;
  sharePercent: string;
}

export default function CreatePoolPage() {
  const router = useRouter();
  const { address } = useWallet();
  const { state: txState, execute: executeTx, reset: resetTx } = useTransaction();

  const [poolName, setPoolName] = useState('');
  const [assetAddress, setAssetAddress] = useState(STELLAR_CONFIG.defaultAssetContract || '');
  const [members, setMembers] = useState<MemberEntry[]>([
    { address: address || '', sharePercent: '60' },
    { address: '', sharePercent: '40' },
  ]);
  const [clientError, setClientError] = useState<string | null>(null);

  const addMemberRow = () => {
    setMembers([...members, { address: '', sharePercent: '' }]);
  };

  const removeMemberRow = (idx: number) => {
    setMembers(members.filter((_, i) => i !== idx));
  };

  const updateMember = (idx: number, field: keyof MemberEntry, val: string) => {
    const updated = [...members];
    updated[idx][field] = val;
    setMembers(updated);
  };

  // Basis point validation
  const parsedShares = members.map((m) => ({
    address: m.address,
    shareBps: parseBps(m.sharePercent),
  }));
  const validation = validateMemberShares(parsedShares);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setClientError(null);

    if (!address) {
      setClientError('Please connect your Stellar wallet first.');
      return;
    }

    if (!isValidStellarAddress(assetAddress)) {
      setClientError('Please enter a valid Stellar SAC asset contract address (e.g. C...).');
      return;
    }

    for (const m of members) {
      if (!isValidStellarAddress(m.address)) {
        setClientError(`Invalid member address: ${m.address || 'empty'}`);
        return;
      }
    }

    if (!validation.valid) {
      setClientError(validation.error || 'Total member shares must equal exactly 100%.');
      return;
    }

    // Generate unique u64 pool ID (timestamp in millis)
    const poolId = Date.now().toString();

    try {
      // Step 1: Create Pool on-chain
      await executeTx(
        () => splitPayClient.prepareCreatePool(address, poolId, address, assetAddress),
        (signedXdr) => splitPayClient.submitSignedTx(signedXdr)
      );

      // Step 2: Add each member on-chain
      for (const m of parsedShares) {
        await executeTx(
          () => splitPayClient.prepareAddMember(address, poolId, m.address, m.shareBps),
          (signedXdr) => splitPayClient.submitSignedTx(signedXdr)
        );
      }

      // Save to client registry
      saveTrackedPool({
        id: poolId,
        name: poolName || `Pool #${poolId}`,
        createdAt: Math.floor(Date.now() / 1000),
      });

      router.push(`/pools/${poolId}`);
    } catch (err: any) {
      setClientError(err?.message || 'Failed to complete pool setup.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <Link
        href="/pools"
        className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Pools
      </Link>

      <div className="space-y-1 border-b border-white/10 pb-4">
        <h1 className="text-2xl font-bold text-white tracking-tight">Create Payment Pool</h1>
        <p className="text-sm text-white/50">
          Configure an on-chain collaborative distribution pool on Soroban.
        </p>
      </div>

      {clientError && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{clientError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4 bg-[#111111] p-6 rounded-xl border border-white/10">
          <h2 className="font-semibold text-white text-sm">Pool Configuration</h2>

          <div className="space-y-1.5">
            <label className="text-xs text-white/60">Pool Name (Application Metadata)</label>
            <input
              type="text"
              placeholder="e.g. Design Studio & Client Retainer"
              value={poolName}
              onChange={(e) => setPoolName(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm bg-black/40 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-hidden focus:border-white/30"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-white/60">Asset Contract Address (Stellar SAC)</label>
            <input
              type="text"
              value={assetAddress}
              onChange={(e) => setAssetAddress(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs font-mono bg-black/40 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-hidden focus:border-white/30"
            />
            <p className="text-[11px] text-white/40">
              Default: Testnet Native XLM Stellar Asset Contract address.
            </p>
          </div>
        </div>

        {/* Member Configuration */}
        <div className="space-y-4 bg-[#111111] p-6 rounded-xl border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-white text-sm">Members & Splits</h2>
              <p className="text-xs text-white/50">Total split must equal exactly 100% (10,000 BPS).</p>
            </div>
            <button
              type="button"
              onClick={addMemberRow}
              className="inline-flex items-center gap-1 text-xs text-white bg-white/10 hover:bg-white/15 px-2.5 py-1.5 rounded-md transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Member
            </button>
          </div>

          <div className="space-y-3">
            {members.map((m, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="G... or C... Stellar Address"
                  value={m.address}
                  onChange={(e) => updateMember(idx, 'address', e.target.value)}
                  required
                  className="flex-1 px-3 py-2 text-xs font-mono bg-black/40 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-hidden focus:border-white/30"
                />
                <div className="w-24 relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    placeholder="50"
                    value={m.sharePercent}
                    onChange={(e) => updateMember(idx, 'sharePercent', e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs font-mono bg-black/40 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-hidden focus:border-white/30 pr-6"
                  />
                  <span className="absolute right-2.5 top-2 text-xs text-white/40">%</span>
                </div>
                {members.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMemberRow(idx)}
                    className="p-2 text-white/40 hover:text-rose-400 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Basis Points Live Counter */}
          <div
            className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
              validation.valid
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              <span>
                Total Configured: {(validation.totalBps / 100).toFixed(2)}% ({validation.totalBps} / 10,000 BPS)
              </span>
            </div>
            <span>{validation.valid ? 'Valid Configuration' : `${(validation.remainingBps / 100).toFixed(2)}% Needed`}</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={!address || !validation.valid || txState.step !== 'idle'}
          className="w-full py-3 px-4 bg-white text-black font-semibold text-sm rounded-lg hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
        >
          {!address ? 'Connect Wallet to Deploy Pool' : 'Deploy Pool to Soroban'}
        </button>
      </form>

      <TransactionStatusModal state={txState} onClose={resetTx} title="Deploying Pool to Stellar" />
    </div>
  );
}
