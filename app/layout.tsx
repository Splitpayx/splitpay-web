import type { Metadata } from 'next';
import './globals.css';
import { WalletProvider } from '@/lib/wallet/WalletContext';
import { Navigation } from '@/components/layout/Navigation';
import { GithubIcon } from '@/components/shared/GithubIcon';

export const metadata: Metadata = {
  title: 'SplitPay | Stellar Collaborative Payment Distribution',
  description:
    'Automated, trustless collaborative payments and split distribution on Stellar and Soroban smart contracts.',
  icons: {
    icon: '/logo.jpg',
    shortcut: '/logo.jpg',
    apple: '/logo.jpg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full bg-[#0B1A33]">
      <body className="min-h-screen w-full bg-[#0B1A33] text-white font-sans antialiased selection:bg-[#14B8A6]/20 m-0 p-0">
        <WalletProvider>
          <div className="flex flex-col min-h-screen w-full bg-[#0B1A33]">
            <Navigation />
            <main className="flex-1 w-full bg-[#0B1A33]">{children}</main>
            <footer className="w-full border-t border-[#1E3358] py-6 px-4 sm:px-6 bg-[#0B1A33] text-center text-xs text-[#94A3B8]">
              <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                <p>SplitPay — Non-custodial collaborative payments on Stellar.</p>
                <div className="flex items-center gap-4">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#14B8A6]"></span>
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
