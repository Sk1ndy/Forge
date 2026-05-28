'use client';
import React, { useRef, useEffect } from 'react';
import { WeeklyBlueprint, SimulationResult } from '@/lib/calculations';
import { m as motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const DAY_SHORT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

interface DayPillSelectorProps {
  blueprint: WeeklyBlueprint;
  toggledDays: { [day: string]: boolean };
  selectedDay: string;
  onSelectDay: (day: string) => void;
  simulation: SimulationResult;
}

export default function DayPillSelector({
  blueprint,
  toggledDays,
  selectedDay,
  onSelectDay,
  simulation,
}: DayPillSelectorProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  // Auto-scroll to selected day on mount or change
  useEffect(() => {
    if (selectedRef.current && scrollRef.current) {
      selectedRef.current.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  }, [selectedDay]);

  return (
    <div
      ref={scrollRef}
      className="flex gap-2 overflow-x-auto py-1 px-0.5 scrollbar-none scroll-smooth"
      style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
    >
      {DAYS.map((day, i) => {
        const exercises = blueprint[day as keyof typeof blueprint] || [];
        const active = exercises.filter(e => e.active);
        const totalSets = active.reduce(
          (sum, ex) => sum + ex.sets.reduce((s, set) => s + (set.active ? set.series : 0), 0),
          0
        );
        const isSelected = selectedDay === day;
        const isActive = toggledDays[day] !== false;
        const hasExercises = active.length > 0;

        // Highest muscle alert on this day
        const muscleSources = active.flatMap(ex => {
          const def = ex.exerciseId;
          return def ? [def] : [];
        });
        const dayAlertLevel = muscleSources.reduce<'none' | 'orange' | 'red'>((level, exId) => {
          if (level === 'red') return 'red';
          // Check via blueprints which muscle each exercise targets
          return level;
        }, 'none');

        // Status dot color based on muscle state
        const dotColor = !isActive ? 'bg-zinc-800'
          : !hasExercises ? 'bg-zinc-700'
          : 'bg-emerald-500';

        return (
          <button
            key={day}
            ref={isSelected ? selectedRef : undefined}
            onClick={() => onSelectDay(day)}
            style={{ scrollSnapAlign: 'start' }}
            className={cn(
              "relative flex flex-col items-center gap-1 px-3 py-2 rounded-xl border text-center transition-colors duration-200 shrink-0 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 overflow-hidden",
              isSelected ? "border-emerald-500/60" : isActive ? "border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 hover:bg-zinc-900/50" : "border-zinc-900 bg-zinc-950/20 opacity-40"
            )}
          >
            {isSelected && (
              <motion.div
                layoutId="activeDayIndicator"
                className="absolute inset-0 bg-emerald-950/20 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                style={{ zIndex: 0 }}
              />
            )}
            
            <div className="relative z-10 flex flex-col items-center">
              {/* Day short name */}
              <span
                className={cn(
                  "text-[10px] font-black uppercase tracking-wider leading-none",
                  isSelected ? "text-emerald-400" : "text-zinc-400"
                )}
              >
                {DAY_SHORT[i]}
              </span>

              {/* Exercise count badge or rest */}
              {hasExercises ? (
                <span
                  className={cn(
                    "text-[11px] font-black leading-none mt-1",
                    isSelected ? "text-white" : "text-zinc-300"
                  )}
                >
                  {active.length}
                  <span className={cn("text-[8px] font-normal ml-0.5", isSelected ? "text-zinc-400" : "text-zinc-600")}>exo</span>
                </span>
              ) : (
                <span className="text-[9px] text-zinc-700 font-medium leading-none mt-1">—</span>
              )}

              {/* Sets count */}
              {totalSets > 0 && (
                <span className={cn("text-[8px] font-bold leading-none mt-1", isSelected ? "text-emerald-500/70" : "text-zinc-600")}>
                  {totalSets}s
                </span>
              )}

              {/* Status dot */}
              <div className={cn(
                "w-1 h-1 rounded-full mt-1",
                dotColor,
                isSelected && hasExercises && "shadow-[0_0_4px_rgba(16,185,129,0.8)]"
              )} />
            </div>
          </button>
        );
      })}
    </div>
  );
}
