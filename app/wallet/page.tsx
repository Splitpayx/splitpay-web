'use client';

import React, { useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { WalletButton } from '@/components/wallet/WalletButton';
import { STELLAR_CONFIG, getExplorerAccountUrl, getExplorerContractUrl } from '@/lib/stellar/config';
import { formatAddress } from '@/lib/utils';
import { Wallet, Coins, RefreshCw, ExternalLink, ShieldCheck, Check, Copy } from 'lucide-react';

export default function WalletPage() {
  const { address, network, xlmBalance, refreshBalances, isDevWallet } = useWallet();
  const [copied, setCopied] = useState(false);
  const [isFunding, setIsFunding] = useState(false);
  const [fundStatus, setFundStatus] = useState<string | null>(null);

  const handleCopy = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fundWithFriendbot = async () => {
    if (!address) return;
    setIsFunding(true);
    setFundStatus(null);
    try {
      const res = await fetch(`https://friendbot.stellar.org?addr=${encodeURIComponent(address)}`);
      if (res.ok) {
        setFundStatus('Success! 10,000 Testnet XLM funded.');
        await refreshBalances();
      } else {
        setFundStatus('Friendbot request dispatched. Balances updating...');
        setTimeout(() => refreshBalances(), 2000);
      }
    } catch {
      setFundStatus('Error contacting Friendbot.');
    } finally {
      setIsFunding(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Connected Wallet</h1>
          <p className="text-sm text-white/50">
            Non-custodial account identity and Stellar balances.
          </p>
        </div>

        {address && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => refreshBalances()}
              className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/70 hover:text-white transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {!address ? (
        <div className="p-12 text-center rounded-xl border border-dashed border-white/10 bg-white/[0.01] space-y-4">
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto text-white/50">
            <Wallet className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-medium text-white">No Wallet Connected</p>
            <p className="text-xs text-white/50">
              Connect your Freighter wallet or initialize a Testnet developer identity.
            </p>
          </div>
          <div className="flex justify-center">
            <WalletButton />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Identity Card */}
          <div className="bg-[#111111] border border-white/10 rounded-xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs text-white/40 block mb-1">Public Key</span>
                <p className="font-mono text-sm sm:text-base font-semibold text-white break-all">
                  {address}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-medium text-white transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy Address'}
                </button>
                <a
                  href={getExplorerAccountUrl(address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-medium text-white transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Explorer
                </a>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-white/5 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-white/40">Network:</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono uppercase text-[11px]">
                  {network}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white/40">Mode:</span>
                <span className="font-mono text-white/80">
                  {isDevWallet ? 'Dev Keypair (Testnet)' : 'Freighter Extension'}
                </span>
              </div>
            </div>
          </div>

          {/* Balances Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[#111111] border border-white/10 rounded-xl p-5 space-y-2">
              <div className="flex items-center justify-between text-xs text-white/50">
                <span>Native Stellar Lumens</span>
                <Coins className="w-4 h-4" />
              </div>
              <p className="font-mono text-2xl font-bold text-white">
                {parseFloat(xlmBalance).toFixed(4)} XLM
              </p>
              <p className="text-[11px] text-white/40">Used for transaction fees and native transfers.</p>
            </div>

            <div className="bg-[#111111] border border-white/10 rounded-xl p-5 space-y-2">
              <div className="flex items-center justify-between text-xs text-white/50">
                <span>Configured Protocol Contract</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="font-mono text-xs font-semibold text-white break-all">
                {STELLAR_CONFIG.contractId ? formatAddress(STELLAR_CONFIG.contractId, 10, 10) : 'Not configured'}
              </p>
              {STELLAR_CONFIG.contractId && (
                <a
                  href={getExplorerContractUrl(STELLAR_CONFIG.contractId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-blue-400 hover:underline inline-flex items-center gap-1"
                >
                  View Contract on Explorer <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>

          {/* Friendbot Testnet Faucet */}
          <div className="bg-[#111111] border border-white/10 rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-semibold text-sm text-white">Stellar Testnet Friendbot Faucet</h3>
              <p className="text-xs text-white/50">
                Fund this address with 10,000 free Testnet XLM to test pool creation and payment settlement.
              </p>
              {fundStatus && <p className="text-xs text-emerald-400 pt-1">{fundStatus}</p>}
            </div>

            <button
              onClick={fundWithFriendbot}
              disabled={isFunding}
              className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white font-medium text-xs rounded-lg transition-colors shrink-0"
            >
              {isFunding ? 'Funding...' : 'Fund 10,000 XLM'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
