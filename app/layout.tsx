import type { Metadata } from 'next';
import './globals.css';
import { WalletProvider } from '@/lib/wallet/WalletContext';
import { Navigation } from '@/components/layout/Navigation';

export const metadata: Metadata = {
  title: 'SplitPay | Stellar Collaborative Payment Distribution',
  description:
    'Automated, trustless collaborative payments and split distribution on Stellar and Soroban smart contracts.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0A0A0A] text-[#F5F5F5] font-sans antialiased selection:bg-white/20">
        <WalletProvider>
          <div className="flex flex-col min-h-screen">
            <Navigation />
            <main className="flex-1">{children}</main>
            <footer className="border-t border-white/5 py-6 px-6 text-center text-xs text-white/40">
              <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                <p>SplitPay — Non-custodial collaborative payments on Stellar.</p>
                <div className="flex items-center gap-4">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    Stellar Testnet
                  </span>
                </div>
              </div>
            </footer>
          </div>
        </WalletProvider>
      </body>
    </html>
  );
}
