import React from 'react';

interface ReadinessGaugeProps {
  score: number; // 0 to 100
}

export default function ReadinessGauge({ score }: ReadinessGaugeProps) {
  // Déterminer la couleur et le label
  let color = '#ef4444'; // Red
  let label = 'REPOS RECOMMANDÉ';
  let message = 'Risque de surentraînement. Privilégie la récupération.';
  let ringClass = 'stroke-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]';

  if (score >= 90) {
    color = '#10B981'; // Emerald
    label = 'OPTIMAL';
    message = 'Système nerveux rechargé. Prêt à performer.';
    ringClass = 'stroke-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]';
  } else if (score >= 60) {
    color = '#F59E0B'; // Amber
    label = 'RÉCUPÉRATION EN COURS';
    message = 'Fatigue résiduelle. Adapte ton volume si besoin.';
    ringClass = 'stroke-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]';
  }

  // SVG dimensions
  const size = 120;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex items-center gap-6 p-4 border border-zinc-900 bg-zinc-950/80 rounded-xl relative overflow-hidden">
      {/* Background Glow */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none transition-colors duration-1000"
        style={{ background: `radial-gradient(circle at 10% 50%, ${color}, transparent 60%)` }}
      />
      
      {/* Radial Gauge */}
      <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className="stroke-zinc-800 fill-none"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className={`fill-none transition-all duration-1000 ease-out ${ringClass}`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black tracking-tighter" style={{ color }}>{Math.round(score)}</span>
        </div>
      </div>

      {/* Texts */}
      <div className="flex flex-col flex-1 min-w-0 z-10">
        <h2 className="text-[10px] font-black text-zinc-500 tracking-[0.2em] uppercase mb-1">
          Forge Readiness Score
        </h2>
        <div className="text-base sm:text-lg font-bold tracking-tight mb-1" style={{ color }}>
          {label}
        </div>
        <p className="text-xs text-zinc-400 font-medium leading-relaxed">
          {message}
        </p>
      </div>
    </div>
  );
}
