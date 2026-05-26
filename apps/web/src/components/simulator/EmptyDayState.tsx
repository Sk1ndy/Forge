'use client';
import React from 'react';

interface EmptyDayStateProps {
  day: string;
  onOpenLibrary: () => void;
}

export default function EmptyDayState({ day, onOpenLibrary }: EmptyDayStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[200px] gap-5 py-10 px-6 select-none">
      {/* Silhouette SVG — corps au repos */}
      <svg
        width="64"
        height="88"
        viewBox="0 0 64 88"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="opacity-20"
      >
        {/* Head */}
        <circle cx="32" cy="10" r="9" fill="#52525b" />
        {/* Neck */}
        <rect x="29" y="18" width="6" height="6" rx="2" fill="#52525b" />
        {/* Body */}
        <rect x="18" y="24" width="28" height="28" rx="6" fill="#52525b" />
        {/* Left arm */}
        <rect x="7" y="24" width="9" height="24" rx="4" fill="#52525b" transform="rotate(-5 7 24)" />
        {/* Right arm */}
        <rect x="48" y="24" width="9" height="24" rx="4" fill="#52525b" transform="rotate(5 48 24)" />
        {/* Left leg */}
        <rect x="18" y="50" width="11" height="30" rx="5" fill="#52525b" />
        {/* Right leg */}
        <rect x="35" y="50" width="11" height="30" rx="5" fill="#52525b" />
        {/* ZZZ — at rest indicator */}
        <text x="44" y="12" fontSize="10" fill="#3f3f46" fontWeight="bold" fontFamily="monospace">z</text>
        <text x="50" y="7" fontSize="8" fill="#3f3f46" fontWeight="bold" fontFamily="monospace">z</text>
        <text x="55" y="4" fontSize="6" fill="#3f3f46" fontWeight="bold" fontFamily="monospace">z</text>
      </svg>

      <div className="text-center space-y-2 max-w-[240px]">
        <p className="text-sm font-bold text-zinc-500">
          {day} — Jour de repos
        </p>
        <p className="text-[11px] text-zinc-600 leading-relaxed">
          Aucun exercice planifié. Ouvre la bibliothèque pour construire ta séance.
        </p>
      </div>

      <button
        onClick={onOpenLibrary}
        className="group flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500/60 text-emerald-400 hover:text-emerald-300 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer"
      >
        <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Ouvrir la Bibliothèque
      </button>
    </div>
  );
}
