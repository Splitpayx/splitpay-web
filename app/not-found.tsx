'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Split } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40">
        <Split className="w-8 h-8" />
      </div>

      <div className="space-y-2 max-w-md">
        <h1 className="text-4xl font-bold tracking-tight text-white">404</h1>
        <h2 className="text-lg font-semibold text-white/90">Page Not Found</h2>
        <p className="text-xs text-white/50 leading-relaxed">
          The requested route does not exist on this SplitPay deployment.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black hover:bg-white/90 text-xs font-semibold rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Home
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-medium rounded-lg transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
