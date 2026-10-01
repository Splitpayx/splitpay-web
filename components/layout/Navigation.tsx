'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { WalletButton } from '@/components/wallet/WalletButton';
import { GithubIcon } from '@/components/shared/GithubIcon';
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
    <header className="sticky top-0 z-40 w-full border-b border-[#1E3358] bg-[#0F2340]/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 font-semibold text-lg text-white">
            <Image
              src="/logo.jpg"
              alt="SplitPay Logo"
              width={32}
              height={32}
              className="rounded-lg object-cover"
              priority
            />
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
                      ? 'bg-[#14B8A6]/15 text-[#14B8A6]'
                      : 'text-[#94A3B8] hover:text-white hover:bg-white/5'
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
          <a
            href="http://splitpaydocs.samkiel.dev/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#94A3B8] hover:text-white hover:bg-white/5 transition-colors border border-transparent hover:border-[#1E3358]"
            title="SplitPay Documentation"
          >
            <span>Docs</span>
          </a>
          <WalletButton />
        </div>
      </div>
    </header>
  );
}
