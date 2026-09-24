'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { isConnected, requestAccess, getAddress, signTransaction, getNetworkDetails } from '@stellar/freighter-api';
import { Keypair } from '@stellar/stellar-sdk';
import { STELLAR_CONFIG } from '../stellar/config';
import { getAccountBalances } from '../stellar/rpc';

export interface WalletState {
  address: string | null;
  network: string;
  xlmBalance: string;
  isConnecting: boolean;
  hasFreighter: boolean;
  error: string | null;
  isDevWallet: boolean;
  connect: () => Promise<void>;
  connectDevWallet: (secretKey?: string) => Promise<void>;
  disconnect: () => void;
  signTx: (xdr: string) => Promise<string>;
  refreshBalances: () => Promise<void>;
}

const WalletContext = createContext<WalletState | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [network, setNetwork] = useState<string>(STELLAR_CONFIG.network);
  const [xlmBalance, setXlmBalance] = useState<string>('0');
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [hasFreighter, setHasFreighter] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [devKeypair, setDevKeypair] = useState<Keypair | null>(null);

  // Check for Freighter extension availability
  useEffect(() => {
    async function checkFreighter() {
      try {
        const connected = await isConnected();
        setHasFreighter(Boolean(connected));
      } catch {
        setHasFreighter(false);
      }
    }
    checkFreighter();

    // Rehydrate saved session if available
    const savedDevKey = localStorage.getItem('splitpay_dev_secret');
    if (savedDevKey) {
      try {
        const kp = Keypair.fromSecret(savedDevKey);
        setDevKeypair(kp);
        setAddress(kp.publicKey());
      } catch {}
    }
  }, []);

  // Fetch balances whenever address changes
  const refreshBalances = useCallback(async () => {
    if (!address) {
      setXlmBalance('0');
      return;
    }
    try {
      const { xlm } = await getAccountBalances(address);
      setXlmBalance(xlm);
    } catch {
      setXlmBalance('0');
    }
  }, [address]);

  useEffect(() => {
    if (address) {
      refreshBalances();
    }
  }, [address, refreshBalances]);

  // Connect via Freighter extension
  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const accessObj = await requestAccess();
      if (accessObj && accessObj.address) {
        setAddress(accessObj.address);
        setDevKeypair(null);
        localStorage.removeItem('splitpay_dev_secret');
      } else {
        const addrObj = await getAddress();
        if (addrObj && addrObj.address) {
          setAddress(addrObj.address);
          setDevKeypair(null);
          localStorage.removeItem('splitpay_dev_secret');
        } else {
          throw new Error('Could not retrieve address from Freighter wallet.');
        }
      }

      try {
        const details = await getNetworkDetails();
        if (details?.network) {
          setNetwork(details.network.toLowerCase());
        }
      } catch {}
    } catch (err: any) {
      setError(err?.message || 'Failed to connect to Freighter wallet.');
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Connect or generate a testnet developer keypair for rapid testing
  const connectDevWallet = useCallback(async (secretKey?: string) => {
    setIsConnecting(true);
    setError(null);
    try {
      let kp: Keypair;
      if (secretKey && secretKey.trim().startsWith('S')) {
        kp = Keypair.fromSecret(secretKey.trim());
      } else {
        kp = Keypair.random();
      }

      setDevKeypair(kp);
      setAddress(kp.publicKey());
      localStorage.setItem('splitpay_dev_secret', kp.secret());
    } catch (err: any) {
      setError(err?.message || 'Invalid secret key provided for developer wallet.');
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setDevKeypair(null);
    setXlmBalance('0');
    setError(null);
    localStorage.removeItem('splitpay_dev_secret');
  }, []);

  // Sign transaction
  const signTx = useCallback(
    async (xdrToSign: string): Promise<string> => {
      if (!address) {
        throw new Error('Wallet not connected.');
      }

      if (devKeypair) {
        // Sign directly with local test keypair
        const { TransactionBuilder } = await import('@stellar/stellar-sdk');
        const tx = TransactionBuilder.fromXDR(xdrToSign, STELLAR_CONFIG.networkPassphrase);
        tx.sign(devKeypair);
        return tx.toXDR();
      }

      // Sign with Freighter
      const result: any = await signTransaction(xdrToSign, {
        networkPassphrase: STELLAR_CONFIG.networkPassphrase,
      });

      const signedXdr = typeof result === 'string' ? result : result?.signedTxXdr;

      if (!signedXdr) {
        throw new Error(result?.error || 'User rejected or cancelled the transaction.');
      }
      return signedXdr;
    },
    [address, devKeypair]
  );

  return (
    <WalletContext.Provider
      value={{
        address,
        network,
        xlmBalance,
        isConnecting,
        hasFreighter,
        error,
        isDevWallet: Boolean(devKeypair),
        connect,
        connectDevWallet,
        disconnect,
        signTx,
        refreshBalances,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletState {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
