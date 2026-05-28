import React from 'react';
import { useSubscription } from '@/hooks/useSubscription';

interface PaywallOverlayProps {
  children: React.ReactNode;
  featureName: string;
}

export default function PaywallOverlay({ children, featureName }: PaywallOverlayProps) {
  const { isPro, isLoading } = useSubscription();

  if (isLoading) {
    return (
      <div className="relative overflow-hidden rounded-xl border border-zinc-800 animate-pulse bg-zinc-900/50 min-h-[100px]">
        <div className="opacity-0">{children}</div>
      </div>
    );
  }

  if (isPro) return <>{children}</>;

  return (
    <div className="relative group overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/20">
      {/* Contenu sous-jacent flouté et inerte */}
      <div className="blur-[6px] select-none pointer-events-none opacity-40 transition-all duration-300">
        {children}
      </div>
      
      {/* Glassmorphism Overlay */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4 text-center">
        <div className="bg-zinc-900 p-3 rounded-full mb-3 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
          <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="font-bold text-zinc-100 mb-2">Débloquez {featureName}</h3>
        <p className="text-[11px] text-zinc-400 mb-4 max-w-xs leading-relaxed">
          Passez à <strong className="text-emerald-400">Forge PRO</strong> pour accéder à cette fonctionnalité experte et propulser votre hypertrophie.
        </p>
        <button className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold py-2 px-6 rounded-lg transition-colors text-xs uppercase tracking-wider">
          Passer PRO
        </button>
      </div>
    </div>
  );
}
