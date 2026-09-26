'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { WalletButton } from '@/components/wallet/WalletButton';
import { STELLAR_CONFIG } from '@/lib/stellar/config';
import { Split, Layers, CreditCard, WalletCards, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Navigation() {
  const pathname = usePathname();

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: Layers },
    { href: '/pools', label: 'Pools', icon: Split },
    { href: '/payments', label: 'Payments', icon: CreditCard },
    { href: '/wallet', label: 'Wallet', icon: WalletCards },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#0A0A0A]/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 font-semibold text-lg text-white">
            <div className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center font-bold">
              <Split className="w-5 h-5 text-black" />
            </div>
            <span>SplitPay</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || pathname?.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-white/10 text-white'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <WalletButton />
        </div>
      </div>
    </header>
  );
}
