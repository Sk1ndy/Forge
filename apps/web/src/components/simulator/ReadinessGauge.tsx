'use client';
import React from 'react';
import { SimulationResult } from '@/lib/calculations';

interface ReadinessGaugeProps {
  score: number; // 0 to 100
  simulation?: SimulationResult; // optional for sub-metrics
  size?: 'sm' | 'lg';
}

export default function ReadinessGauge({ score, simulation, size = 'sm' }: ReadinessGaugeProps) {
  const isLarge = size === 'lg';

  let color = '#ef4444';
  let label = 'REPOS RECOMMANDÉ';
  let message = 'Risque de surentraînement. Privilégie la récupération.';
  let ringClass = 'stroke-red-500';
  let glowColor = 'rgba(239,68,68,0.15)';

  if (score >= 90) {
    color = '#10B981';
    label = 'OPTIMAL';
    message = 'Système nerveux rechargé. Prêt à performer.';
    ringClass = 'stroke-emerald-500';
    glowColor = 'rgba(16,185,129,0.15)';
  } else if (score >= 60) {
    color = '#F59E0B';
    label = 'RÉCUPÉRATION EN COURS';
    message = 'Fatigue résiduelle. Adapte ton volume si besoin.';
    ringClass = 'stroke-amber-500';
    glowColor = 'rgba(245,158,11,0.12)';
  }

  const svgSize = isLarge ? 140 : 110;
  const strokeWidth = isLarge ? 11 : 9;
  const radius = (svgSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const sncPct = simulation?.sncPercentage ?? 0;
  const sncColor = sncPct > 100 ? '#ef4444' : sncPct > 80 ? '#f59e0b' : '#10b981';

  return (
    <div
      className="relative flex flex-col gap-3 p-4 border border-zinc-900 bg-zinc-950/80 rounded-xl overflow-hidden"
      style={{ boxShadow: score < 60 ? `0 0 30px rgba(239,68,68,0.08)` : undefined }}
    >
      {/* Background radial glow */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-1000"
        style={{ background: `radial-gradient(ellipse at 15% 50%, ${glowColor}, transparent 65%)` }}
      />

      {/* Main row: Gauge + Text */}
      <div className="flex items-center gap-4 z-10">
        {/* Radial Gauge SVG */}
        <div className="relative shrink-0 flex items-center justify-center" style={{ width: svgSize, height: svgSize }}>
          <svg width={svgSize} height={svgSize} className="-rotate-90">
            {/* Track */}
            <circle cx={svgSize / 2} cy={svgSize / 2} r={radius} className="stroke-zinc-800/80 fill-none" strokeWidth={strokeWidth} />
            {/* Progress */}
            <circle
              cx={svgSize / 2} cy={svgSize / 2} r={radius}
              className={`fill-none transition-all duration-1000 ease-out ${ringClass}`}
              style={{
                strokeWidth,
                strokeDasharray: circumference,
                strokeDashoffset,
                strokeLinecap: 'round',
                filter: `drop-shadow(0 0 ${isLarge ? 8 : 6}px ${color}90)`,
              }}
            />
          </svg>
          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
            <span
              className={`font-black tracking-tighter leading-none ${isLarge ? 'text-4xl' : 'text-3xl'}`}
              style={{ color }}
            >
              {Math.round(score)}
            </span>
            <span className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest">/100</span>
          </div>
          {/* Pulse ring for low score */}
          {score < 60 && (
            <div
              className="absolute inset-0 rounded-full animate-ping opacity-10"
              style={{ border: `2px solid ${color}` }}
            />
          )}
        </div>

        {/* Labels */}
        <div className="flex flex-col flex-1 min-w-0">
          <p className="text-[9px] font-black text-zinc-500 tracking-[0.18em] uppercase mb-1">
            Forge Readiness Score
          </p>
          <div className={`font-bold tracking-tight mb-1 ${isLarge ? 'text-lg' : 'text-sm'}`} style={{ color }}>
            {label}
          </div>
          <p className="text-[11px] text-zinc-400 font-medium leading-relaxed">
            {message}
          </p>
        </div>
      </div>

      {/* Sub-metrics row (only if simulation provided) */}
      {simulation && (
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-zinc-900/80 z-10">
          {/* SNC */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[8px] uppercase font-bold tracking-wider text-zinc-600">SNC</span>
            <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, sncPct)}%`, backgroundColor: sncColor }}
              />
            </div>
            <span className="text-[9px] font-black font-mono" style={{ color: sncColor }}>
              {sncPct}%
            </span>
          </div>

          {/* Fatigue globale */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[8px] uppercase font-bold tracking-wider text-zinc-600">Fatigue</span>
            {(() => {
              const fatPct = Math.min(100, 100 - score);
              const fatColor = fatPct > 60 ? '#ef4444' : fatPct > 35 ? '#f59e0b' : '#10b981';
              return (
                <>
                  <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${fatPct}%`, backgroundColor: fatColor }}
                    />
                  </div>
                  <span className="text-[9px] font-black font-mono" style={{ color: fatColor }}>
                    {fatPct}%
                  </span>
                </>
              );
            })()}
          </div>

          {/* Muscles en alerte */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[8px] uppercase font-bold tracking-wider text-zinc-600">Alertes</span>
            {(() => {
              const redCount = Object.values(simulation.muscles).filter(m => m?.color === 'red').length;
              const orangeCount = Object.values(simulation.muscles).filter(m => m?.color === 'orange').length;
              const alertColor = redCount > 0 ? '#ef4444' : orangeCount > 0 ? '#f59e0b' : '#10b981';
              return (
                <>
                  <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: redCount > 0 ? '100%' : orangeCount > 0 ? '60%' : '5%', backgroundColor: alertColor }}
                    />
                  </div>
                  <span className="text-[9px] font-black font-mono" style={{ color: alertColor }}>
                    {redCount > 0 ? `${redCount} 🛑` : orangeCount > 0 ? `${orangeCount} ⚠️` : '✅ OK'}
                  </span>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
