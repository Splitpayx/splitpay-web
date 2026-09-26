'use client';

import React, { useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { formatAddress } from '@/lib/utils';
import { getExplorerAccountUrl } from '@/lib/stellar/config';
import { Wallet, LogOut, Copy, Check, ExternalLink, Key, Loader2 } from 'lucide-react';

export function WalletButton() {
  const {
    address,
    network,
    xlmBalance,
    isConnecting,
    hasFreighter,
    connect,
    connectDevWallet,
    disconnect,
    isDevWallet,
  } = useWallet();

  const [copied, setCopied] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [secretKeyInput, setSecretKeyInput] = useState('');
  const [funding, setFunding] = useState(false);
  const [fundMessage, setFundMessage] = useState<string | null>(null);

  const handleCopy = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fundWithFriendbot = async () => {
    if (!address) return;
    setFunding(true);
    setFundMessage(null);
    try {
      const res = await fetch(`https://friendbot.stellar.org?addr=${encodeURIComponent(address)}`);
      if (res.ok) {
        setFundMessage('Funded 10,000 Testnet XLM via Friendbot!');
      } else {
        setFundMessage('Friendbot request submitted. Balances will update shortly.');
      }
    } catch {
      setFundMessage('Failed to reach Friendbot.');
    } finally {
      setFunding(false);
    }
  };

  if (address) {
    return (
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex flex-col items-end text-xs">
          <div className="flex items-center gap-1.5 text-white/90 font-mono font-medium">
            <span>{parseFloat(xlmBalance).toFixed(2)} XLM</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 uppercase border border-emerald-500/20">
              {network}
            </span>
          </div>
          <span className="text-white/40 font-mono text-[11px]">{formatAddress(address)}</span>
        </div>

        <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-1">
          <button
            onClick={handleCopy}
            title="Copy address"
            className="p-1.5 hover:bg-white/10 rounded text-white/70 hover:text-white transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <a
            href={getExplorerAccountUrl(address)}
            target="_blank"
            rel="noopener noreferrer"
            title="View on Explorer"
            className="p-1.5 hover:bg-white/10 rounded text-white/70 hover:text-white transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={disconnect}
            title="Disconnect"
            className="p-1.5 hover:bg-rose-500/20 rounded text-white/70 hover:text-rose-400 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        disabled={isConnecting}
        className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black hover:bg-white/90 text-sm font-medium rounded-lg shadow-xs transition-all active:scale-[0.98]"
      >
        <Wallet className="w-4 h-4" />
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-[#111111] border border-white/10 rounded-xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-white">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="font-semibold text-base text-white">Connect Stellar Wallet</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-white/40 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5">
              <button
                onClick={() => {
                  connect();
                  setShowModal(false);
                }}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                    F
                  </div>
                  <div>
                    <p className="font-medium text-sm text-white">Freighter Wallet</p>
                    <p className="text-xs text-white/50">
                      {hasFreighter ? 'Detected browser extension' : 'Browser extension'}
                    </p>
                  </div>
                </div>
              </button>

              <div className="pt-2 border-t border-white/5">
                <p className="text-xs text-white/50 mb-2">Testnet Developer Mode</p>
                <button
                  onClick={() => {
                    connectDevWallet();
                    setShowModal(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-dashed border-white/20 bg-white/[0.02] hover:bg-white/[0.06] transition-colors text-left"
                >
                  <Key className="w-5 h-5 text-amber-400" />
                  <div>
                    <p className="font-medium text-sm text-amber-300">Generate Dev Keypair</p>
                    <p className="text-xs text-white/40">Instant Testnet identity for testing</p>
                  </div>
                </button>
              </div>

              <div className="space-y-1.5 pt-2">
                <input
                  type="password"
                  placeholder="Or paste S... secret key"
                  value={secretKeyInput}
                  onChange={(e) => setSecretKeyInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-black/40 border border-white/10 rounded-lg text-white font-mono placeholder:text-white/30 focus:outline-hidden focus:border-white/30"
                />
                {secretKeyInput && (
                  <button
                    onClick={() => {
                      connectDevWallet(secretKeyInput);
                      setShowModal(false);
                    }}
                    className="w-full py-1.5 text-xs bg-white/10 hover:bg-white/20 rounded font-medium text-white transition-colors"
                  >
                    Import Secret Key
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
