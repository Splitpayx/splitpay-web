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
import Link from 'next/link';
import { parseBps } from '@/lib/utils';
import { Plus, Trash2, ArrowLeft, ShieldCheck, AlertCircle, Split } from 'lucide-react';

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
    <div className="w-full flex justify-center py-10 px-4 sm:px-6">
      <div className="w-full max-w-2xl space-y-8">
        <Link
          href="/pools"
          className="inline-flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Pools
        </Link>

        <div className="space-y-2 border-b border-white/10 pb-5">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs font-medium">
            <Split className="w-3.5 h-3.5" />
            Soroban On-Chain Configuration
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Create Payment Pool</h1>
          <p className="text-sm text-zinc-400">
            Configure collaborative distribution rules, asset targeting, and verified member shares.
          </p>
        </div>

        {clientError && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3 shadow-lg">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span className="font-medium">{clientError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card 1: Pool Metadata & Asset */}
          <div className="bg-[#111319] p-6 sm:p-7 rounded-2xl border border-white/10 shadow-xl space-y-5">
            <h2 className="font-semibold text-white text-base">Pool Details</h2>

            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-300">
                Pool Name <span className="text-zinc-500 font-normal">(Application Metadata)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Design Studio & Engineering Retainer"
                value={poolName}
                onChange={(e) => setPoolName(e.target.value)}
                required
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-300">
                Asset Contract Address <span className="text-zinc-500 font-normal">(Stellar SAC)</span>
              </label>
              <input
                type="text"
                value={assetAddress}
                onChange={(e) => setAssetAddress(e.target.value)}
                required
                className="w-full font-mono text-xs"
              />
              <p className="text-[11px] text-zinc-500">
                Default: Stellar Testnet Native XLM Asset Contract address.
              </p>
            </div>
          </div>

          {/* Card 2: Members & Basis Point Shares */}
          <div className="bg-[#111319] p-6 sm:p-7 rounded-2xl border border-white/10 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-white text-base">Members & Splits</h2>
                <p className="text-xs text-zinc-400">
                  Total split must equal exactly 100% (10,000 basis points).
                </p>
              </div>
              <button
                type="button"
                onClick={addMemberRow}
                className="inline-flex items-center gap-1.5 text-xs text-white bg-white/10 hover:bg-white/20 border border-white/10 px-3 py-1.5 rounded-lg transition-colors font-medium"
              >
                <Plus className="w-3.5 h-3.5" /> Add Member
              </button>
            </div>

            <div className="space-y-3 pt-1">
              {members.map((m, idx) => (
                <div key={idx} className="flex items-center gap-2.5">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="G... or C... Stellar Address"
                      value={m.address}
                      onChange={(e) => updateMember(idx, 'address', e.target.value)}
                      required
                      className="w-full font-mono text-xs"
                    />
                  </div>
                  <div className="w-28 relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      placeholder="50"
                      value={m.sharePercent}
                      onChange={(e) => updateMember(idx, 'sharePercent', e.target.value)}
                      required
                      className="w-full font-mono text-xs pr-7 text-right"
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-semibold text-zinc-400 pointer-events-none">
                      %
                    </span>
                  </div>
                  {members.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMemberRow(idx)}
                      title="Remove member"
                      className="p-2.5 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Basis Points Live Counter */}
            <div
              className={`p-4 rounded-xl border text-xs flex items-center justify-between transition-colors shadow-inner ${
                validation.valid
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                  : 'bg-amber-950/40 border-amber-500/30 text-amber-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span className="font-medium">
                  Total Allocated: {(validation.totalBps / 100).toFixed(2)}% ({validation.totalBps} / 10,000 BPS)
                </span>
              </div>
              <span className="font-semibold uppercase tracking-wider text-[11px]">
                {validation.valid ? 'Valid Configuration' : `${(validation.remainingBps / 100).toFixed(2)}% Needed`}
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={!address || !validation.valid || txState.step !== 'idle'}
            className="w-full py-3.5 px-6 bg-white text-black font-semibold text-sm rounded-xl hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md active:scale-[0.99]"
          >
            {!address ? 'Connect Wallet to Deploy Pool' : 'Deploy Pool to Soroban Contract'}
          </button>
        </form>

        <TransactionStatusModal state={txState} onClose={resetTx} title="Deploying Pool to Stellar" />
      </div>
    </div>
  );
}
