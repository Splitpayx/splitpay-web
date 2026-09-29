'use client';

import React, { useState } from 'react';
import { STELLAR_CONFIG } from '@/lib/stellar/config';
import { splitPayClient } from '@/lib/contract/splitpay';
import { Settings, Save, CheckCircle2, AlertCircle } from 'lucide-react';

export default function SettingsPage() {
  const [contractId, setContractId] = useState(STELLAR_CONFIG.contractId);
  const [rpcUrl, setRpcUrl] = useState(STELLAR_CONFIG.rpcUrl);
  const [network, setNetwork] = useState(STELLAR_CONFIG.network);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    splitPayClient.setContractId(contractId);
    STELLAR_CONFIG.contractId = contractId;
    STELLAR_CONFIG.rpcUrl = rpcUrl;
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="space-y-1 border-b border-white/10 pb-4">
        <h1 className="text-2xl font-bold text-white tracking-tight">Protocol Settings</h1>
        <p className="text-sm text-white/50">Configure Stellar network and SplitPay smart contract targets.</p>
      </div>

      {saved && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Configuration saved for current session.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-[#111111] p-6 rounded-xl border border-white/10 space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs text-white/60">SplitPay Contract ID</label>
          <input
            type="text"
            placeholder="C... contract address"
            value={contractId}
            onChange={(e) => setContractId(e.target.value)}
            className="w-full px-3 py-2 text-xs font-mono bg-black/40 border border-white/10 rounded-lg text-white focus:outline-hidden"
          />
          <p className="text-[11px] text-white/40">
            Active Soroban smart contract ID on the target network.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-white/60">Soroban RPC URL</label>
          <input
            type="text"
            value={rpcUrl}
            onChange={(e) => setRpcUrl(e.target.value)}
            className="w-full px-3 py-2 text-xs font-mono bg-black/40 border border-white/10 rounded-lg text-white focus:outline-hidden"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-white/60">Stellar Network</label>
          <input
            type="text"
            value={network}
            onChange={(e) => setNetwork(e.target.value)}
            disabled
            className="w-full px-3 py-2 text-xs font-mono bg-black/40 border border-white/5 rounded-lg text-white/50 cursor-not-allowed"
          />
        </div>

        <button
          type="submit"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-black font-semibold text-xs rounded-lg hover:bg-white/90 transition-colors"
        >
          <Save className="w-3.5 h-3.5" /> Save Configuration
        </button>
      </form>
    </div>
  );
}
