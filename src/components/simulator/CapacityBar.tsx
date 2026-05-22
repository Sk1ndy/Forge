'use client';

import React from 'react';

interface CapacityBarProps {
  progress: number; // Value between 0 and 1
  showLabel?: boolean;
}

export default function CapacityBar({ progress, showLabel = true }: CapacityBarProps) {
  const percentage = Math.min(100, Math.max(0, Math.round(progress * 100)));
  
  // Visual threshold rules
  let barColorClass = '';
  let textColorClass = '';
  let shadowClass = '';
  let labelText = '';

  if (progress > 0.6) {
    barColorClass = 'bg-gradient-to-r from-emerald-500 to-teal-400';
    textColorClass = 'text-emerald-400';
    shadowClass = 'shadow-[0_0_8px_rgba(16,185,129,0.3)]';
    labelText = 'Approuvé';
  } else if (progress > 0.25) {
    barColorClass = 'bg-gradient-to-r from-amber-500 to-orange-400';
    textColorClass = 'text-amber-400';
    shadowClass = 'shadow-[0_0_8px_rgba(245,158,11,0.3)]';
    labelText = 'Attention';
  } else {
    barColorClass = 'bg-gradient-to-r from-red-600 to-red-400 animate-pulse';
    textColorClass = 'text-red-400 font-extrabold';
    shadowClass = 'shadow-[0_0_10px_rgba(239,68,68,0.5)]';
    labelText = 'Interdit';
  }

  return (
    <div className="w-full flex flex-col gap-1 select-none">
      {showLabel && (
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-zinc-400 font-medium tracking-wide">Capacité de Travail</span>
          <span className={`font-bold flex items-center gap-1 ${textColorClass}`}>
            {percentage}% <span className={`text-[8px] bg-zinc-900 border px-1 py-0.5 rounded uppercase tracking-wider font-semibold ${
              progress > 0.6 
                ? 'border-emerald-500/20 text-emerald-400' 
                : progress > 0.25 
                ? 'border-amber-500/20 text-amber-400' 
                : 'border-red-500/30 text-red-400 animate-pulse'
            }`}>{labelText}</span>
          </span>
        </div>
      )}
      
      {/* Outer track with premium border and glassmorphism */}
      <div className="w-full h-2 rounded-full bg-zinc-950/80 border border-zinc-900/90 p-[1px] relative overflow-hidden backdrop-blur-sm">
        {/* Fill bar */}
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${barColorClass} ${shadowClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
