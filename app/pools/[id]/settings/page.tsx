'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/hooks/useWallet';
import { useTransaction } from '@/hooks/useTransaction';
import { splitPayClient } from '@/lib/contract/splitpay';
import { Pool, Member, PoolStatus } from '@/types';
import { formatAddress, parseBps, formatBps } from '@/lib/utils';
import { validateMemberShares, isValidStellarAddress } from '@/lib/validation';
import { TransactionStatusModal } from '@/components/shared/TransactionStatusModal';
import { ArrowLeft, Plus, Trash2, ShieldCheck, AlertCircle, Save, ToggleLeft, ToggleRight } from 'lucide-react';

export default function PoolSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const poolId = resolvedParams.id;
  const router = useRouter();
  const { address } = useWallet();
  const { state: txState, execute: executeTx, reset: resetTx } = useTransaction();

  const [pool, setPool] = useState<Pool | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [newMemberAddr, setNewMemberAddr] = useState('');
  const [newMemberShare, setNewMemberShare] = useState('');
  const [editingShares, setEditingShares] = useState<Record<string, string>>({});

  const loadData = async () => {
    setLoading(true);
    try {
      const p = await splitPayClient.getPool(poolId);
      setPool(p);
      const m = await splitPayClient.getPoolMembers(poolId);
      setMembers(m);

      const sharesMap: Record<string, string> = {};
      m.forEach((item) => {
        sharesMap[item.address] = (item.shareBps / 100).toString();
      });
      setEditingShares(sharesMap);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [poolId]);

  if (loading) {
    return <div className="max-w-2xl mx-auto py-16 text-center text-[#94A3B8] text-sm">Loading settings...</div>;
  }

  if (!pool) {
    return <div className="max-w-2xl mx-auto py-16 text-center text-rose-400 text-sm">Pool not found.</div>;
  }

  const isOwner = address && pool.owner.toLowerCase() === address.toLowerCase();

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!address) return;

    if (!isValidStellarAddress(newMemberAddr)) {
      setErrorMsg('Invalid member Stellar address.');
      return;
    }

    const shareBps = parseBps(newMemberShare);
    if (shareBps <= 0 || shareBps > 10000) {
      setErrorMsg('Share percentage must be between 0.01% and 100%.');
      return;
    }

    try {
      await executeTx(
        () => splitPayClient.prepareAddMember(address, poolId, newMemberAddr, shareBps),
        (signedXdr) => splitPayClient.submitSignedTx(signedXdr)
      );
      setNewMemberAddr('');
      setNewMemberShare('');
      await loadData();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to add member.');
    }
  };

  const handleRemoveMember = async (memberAddr: string) => {
    setErrorMsg(null);
    if (!address) return;

    try {
      await executeTx(
        () => splitPayClient.prepareRemoveMember(address, poolId, memberAddr),
        (signedXdr) => splitPayClient.submitSignedTx(signedXdr)
      );
      await loadData();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to remove member.');
    }
  };

  const handleUpdateShare = async (memberAddr: string) => {
    setErrorMsg(null);
    if (!address) return;

    const val = editingShares[memberAddr];
    const shareBps = parseBps(val);

    try {
      await executeTx(
        () => splitPayClient.prepareUpdateMemberShare(address, poolId, memberAddr, shareBps),
        (signedXdr) => splitPayClient.submitSignedTx(signedXdr)
      );
      await loadData();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to update member share.');
    }
  };

  const handleToggleStatus = async () => {
    setErrorMsg(null);
    if (!address || !pool) return;

    const newStatus = pool.status === PoolStatus.Active ? PoolStatus.Inactive : PoolStatus.Active;

    try {
      await executeTx(
        () => splitPayClient.prepareSetPoolStatus(address, poolId, newStatus),
        (signedXdr) => splitPayClient.submitSignedTx(signedXdr)
      );
      await loadData();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to update pool status.');
    }
  };

  return (
    <div className="w-full flex justify-center py-10 px-4 sm:px-6">
      <div className="w-full max-w-2xl space-y-8">
        <Link
          href={`/pools/${poolId}`}
          className="inline-flex items-center gap-2 text-xs font-medium text-[#94A3B8] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Pool Details
        </Link>

        <div className="space-y-1 border-b border-[#1E3358] pb-4">
          <h1 className="text-3xl font-bold text-white tracking-tight">Pool Settings</h1>
          <p className="text-sm text-[#94A3B8]">Manage operational status, members, and split shares.</p>
        </div>

      {!isOwner && (
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Only the pool owner ({formatAddress(pool.owner)}) can submit configuration changes.</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Operational Status Toggle */}
      <div className="bg-[#0F2340] p-5 rounded-xl border border-[#1E3358] flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">Pool Operational Status</h2>
          <p className="text-xs text-[#94A3B8]">
            {pool.status === PoolStatus.Active
              ? 'Active: Accepting payments for settlement.'
              : 'Inactive: Payments to this pool will be rejected by the contract.'}
          </p>
        </div>
        {isOwner && (
          <button
            onClick={handleToggleStatus}
            disabled={txState.step !== 'idle'}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0B1A33] hover:bg-[#1E3358] border border-[#1E3358] text-xs font-medium rounded-lg text-white transition-colors"
          >
            {pool.status === PoolStatus.Active ? (
              <>
                <ToggleRight className="w-4 h-4 text-[#14B8A6]" /> Deactivate
              </>
            ) : (
              <>
                <ToggleLeft className="w-4 h-4 text-rose-400" /> Activate
              </>
            )}
          </button>
        )}
      </div>

      {/* Existing Members Management */}
      <div className="bg-[#0F2340] p-5 rounded-xl border border-[#1E3358] space-y-4">
        <h2 className="text-sm font-semibold text-white">Current Members ({members.length})</h2>

        <div className="space-y-3">
          {members.map((m, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-[#0B1A33] border border-[#1E3358]">
              <div className="font-mono text-xs text-white/80">{formatAddress(m.address, 10, 10)}</div>

              <div className="flex items-center gap-2">
                <div className="w-20 relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={editingShares[m.address] ?? (m.shareBps / 100).toString()}
                    onChange={(e) =>
                      setEditingShares({
                        ...editingShares,
                        [m.address]: e.target.value,
                      })
                    }
                    disabled={!isOwner}
                    className="w-full px-2 py-1 text-xs font-mono rounded text-white focus:outline-hidden"
                  />
                  <span className="absolute right-2 top-1 text-[11px] text-[#64748B]">%</span>
                </div>

                {isOwner && (
                  <>
                    <button
                      onClick={() => handleUpdateShare(m.address)}
                      title="Update Share on-chain"
                      className="p-1.5 bg-[#0B1A33] hover:bg-[#1E3358] border border-[#1E3358] rounded text-white transition-colors"
                    >
                      <Save className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleRemoveMember(m.address)}
                      title="Remove Member from pool"
                      className="p-1.5 hover:bg-rose-500/20 text-[#94A3B8] hover:text-rose-400 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add New Member Section */}
      {isOwner && (
        <form onSubmit={handleAddMember} className="bg-[#0F2340] p-5 rounded-xl border border-[#1E3358] space-y-4">
          <h2 className="text-sm font-semibold text-white">Add New Member</h2>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs text-[#94A3B8]">Stellar Address</label>
              <input
                type="text"
                placeholder="G... or C... Stellar Address"
                value={newMemberAddr}
                onChange={(e) => setNewMemberAddr(e.target.value)}
                required
                className="w-full font-mono text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-[#94A3B8]">Share Percentage</label>
              <div className="w-32 relative">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="100"
                  placeholder="20"
                  value={newMemberShare}
                  onChange={(e) => setNewMemberShare(e.target.value)}
                  required
                  className="w-full font-mono text-xs pr-6"
                />
                <span className="absolute right-2.5 top-2 text-xs text-[#64748B]">%</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={txState.step !== 'idle'}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-[#0B1A33] font-semibold text-xs rounded-lg hover:bg-white/90 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Member on Soroban
            </button>
          </div>
        </form>
      )}

      <TransactionStatusModal state={txState} onClose={resetTx} title="Updating Pool Configuration" />
      </div>
    </div>
  );
}
