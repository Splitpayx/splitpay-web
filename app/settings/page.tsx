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
    <div className="w-full flex justify-center py-10 px-4 sm:px-6">
      <div className="w-full max-w-2xl space-y-8">
        <div className="space-y-1 border-b border-[#1E3358] pb-4">
          <h1 className="text-3xl font-bold text-white tracking-tight">Protocol Settings</h1>
          <p className="text-sm text-[#94A3B8]">Configure Stellar network and SplitPay smart contract targets.</p>
        </div>

        {saved && (
          <div className="p-4 rounded-xl bg-[#14B8A6]/10 border border-[#14B8A6]/30 text-[#14B8A6] text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Configuration saved for current session.</span>
          </div>
        )}

        <form onSubmit={handleSave} className="bg-[#0F2340] p-6 sm:p-7 rounded-2xl border border-[#1E3358] shadow-xl space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-medium text-[#94A3B8]">SplitPay Contract ID</label>
          <input
            type="text"
            placeholder="C... contract address"
            value={contractId}
            onChange={(e) => setContractId(e.target.value)}
            className="w-full font-mono text-xs"
          />
          <p className="text-[11px] text-[#64748B]">
            Active Soroban smart contract ID on the target network.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-[#94A3B8]">Soroban RPC URL</label>
          <input
            type="text"
            value={rpcUrl}
            onChange={(e) => setRpcUrl(e.target.value)}
            className="w-full font-mono text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-[#94A3B8]">Stellar Network</label>
          <input
            type="text"
            value={network}
            onChange={(e) => setNetwork(e.target.value)}
            disabled
            className="w-full font-mono text-xs opacity-50 cursor-not-allowed"
          />
        </div>

        <button
          type="submit"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-[#0B1A33] font-semibold text-xs rounded-lg hover:bg-white/90 transition-colors"
        >
          <Save className="w-3.5 h-3.5" /> Save Configuration
        </button>
      </form>
      </div>
    </div>
  );
}
