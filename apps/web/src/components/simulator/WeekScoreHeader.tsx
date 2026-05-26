'use client';
import React, { useMemo } from 'react';
import { SimulationResult, WeeklyBlueprint } from '@/lib/calculations';
import { calculateProgramScore } from './WeekDashboard';

interface WeekScoreHeaderProps {
  simulation: SimulationResult;
  blueprint: WeeklyBlueprint;
  toggledDays?: { [day: string]: boolean };
}

export default function WeekScoreHeader({ simulation, blueprint, toggledDays }: WeekScoreHeaderProps) {
  const { score, grade } = useMemo(
    () => calculateProgramScore(simulation, blueprint, toggledDays),
    [simulation, blueprint, toggledDays]
  );

  // Weekly tonnage
  const weeklyTonnage = useMemo(() => {
    let total = 0;
    Object.entries(blueprint).forEach(([day, dayExercises]) => {
      if (toggledDays && toggledDays[day] === false) return;
      dayExercises.forEach(ex => {
        if (!ex.active) return;
        ex.sets.forEach(set => {
          if (!set.active) return;
          total += set.series * set.reps * set.poids;
        });
      });
    });
    return total;
  }, [blueprint, toggledDays]);

  const macro = simulation.weeklyMacro;
  const totalSets = Object.values(macro?.weeklyEffectiveSets ?? {}).reduce((sum, v) => sum + (v as number), 0);
  const sncPct = simulation.sncPercentage;

  const gradeColor = grade === 'S' || grade === 'A' ? '#10b981'
    : grade === 'B' ? '#3b82f6'
    : grade === 'C' ? '#f59e0b'
    : '#ef4444';

  const sncColor = sncPct > 100 ? '#ef4444' : sncPct > 80 ? '#f59e0b' : '#10b981';
  const sncLabel = sncPct > 100 ? 'BURNOUT' : sncPct > 80 ? 'Élevé' : 'OK';

  const tonnageLabel = weeklyTonnage >= 1000
    ? `${(weeklyTonnage / 1000).toFixed(1)}t`
    : `${weeklyTonnage}kg`;

  return (
    <div className="flex items-center gap-2 px-1 py-2 shrink-0 flex-wrap">
      {/* Score Grade Chip */}
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all"
        style={{
          borderColor: `${gradeColor}40`,
          background: `linear-gradient(135deg, rgba(9,9,11,0.9), ${gradeColor}12)`,
          color: gradeColor,
        }}
      >
        <span className="text-base font-black font-mono leading-none">{grade}</span>
        <div className="flex flex-col leading-none">
          <span className="text-[9px] uppercase tracking-wider opacity-60 font-bold">Score</span>
          <span className="text-sm font-black">{score}</span>
        </div>
      </div>

      <div className="w-px h-6 bg-zinc-800 shrink-0" />

      {/* Volume Chip */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-800 bg-zinc-900/40 text-xs">
        <span className="text-zinc-500">📊</span>
        <div className="flex flex-col leading-none">
          <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Volume</span>
          <span className="text-white font-black">{totalSets} sér.</span>
        </div>
      </div>

      {/* SNC Chip */}
      <div
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs"
        style={{ borderColor: `${sncColor}30`, background: `${sncColor}08` }}
      >
        <span>⚡</span>
        <div className="flex flex-col leading-none">
          <span className="text-[9px] uppercase tracking-wider font-bold" style={{ color: sncColor, opacity: 0.7 }}>SNC</span>
          <span className="font-black" style={{ color: sncColor }}>{sncPct}% <span className="font-normal opacity-70">{sncLabel}</span></span>
        </div>
      </div>

      {/* Tonnage Chip */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-800 bg-zinc-900/40 text-xs">
        <span className="text-zinc-500">🏋️</span>
        <div className="flex flex-col leading-none">
          <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Tonnage</span>
          <span className="text-white font-black">{tonnageLabel}</span>
        </div>
      </div>

      {/* Readiness Chip */}
      {simulation.systemicReadiness !== undefined && (
        <>
          <div className="w-px h-6 bg-zinc-800 shrink-0" />
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs"
            style={{
              borderColor: simulation.systemicReadiness >= 90 ? 'rgba(16,185,129,0.3)'
                : simulation.systemicReadiness >= 60 ? 'rgba(245,158,11,0.3)'
                : 'rgba(239,68,68,0.3)',
              background: simulation.systemicReadiness >= 90 ? 'rgba(16,185,129,0.06)'
                : simulation.systemicReadiness >= 60 ? 'rgba(245,158,11,0.06)'
                : 'rgba(239,68,68,0.06)',
            }}
          >
            <span>🟢</span>
            <div className="flex flex-col leading-none">
              <span
                className="text-[9px] uppercase tracking-wider font-bold opacity-70"
                style={{
                  color: simulation.systemicReadiness >= 90 ? '#10b981'
                    : simulation.systemicReadiness >= 60 ? '#f59e0b'
                    : '#ef4444'
                }}
              >Readiness</span>
              <span
                className="font-black"
                style={{
                  color: simulation.systemicReadiness >= 90 ? '#10b981'
                    : simulation.systemicReadiness >= 60 ? '#f59e0b'
                    : '#ef4444'
                }}
              >{Math.round(simulation.systemicReadiness)}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
