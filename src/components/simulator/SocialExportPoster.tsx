import React from 'react';
import HumanAvatar from './HumanAvatar';
import WeekDashboard from './WeekDashboard';
import { SimulationResult, WeeklyBlueprint, MuscleId } from '@/lib/types';

interface SocialExportPosterProps {
  simulation: SimulationResult;
  blueprint: WeeklyBlueprint;
  toggledDays: { [day: string]: boolean };
  selectedDay: string;
  selectedMuscle: string;
  highlightedMuscles: string[];
}

export default function SocialExportPoster({
  simulation,
  blueprint,
  toggledDays,
  selectedDay,
  selectedMuscle,
  highlightedMuscles
}: SocialExportPosterProps) {
  return (
    <div
      id="forge-social-poster"
      className="fixed top-0 left-[-10000px] z-[-50] pointer-events-none w-[1400px] bg-zinc-950 p-10 flex flex-col gap-8"
      style={{
        // On s'assure qu'il n'y a aucune restriction de hauteur pour forcer l'expansion complète
        height: 'auto',
        minHeight: '100%',
      }}
    >
      {/* Header Premium */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white mb-2">
            Rapport Hebdomadaire
          </h1>
          <p className="text-zinc-400 text-lg">Bilan complet et répartition du volume</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-black font-black text-2xl">
            F
          </div>
          <div>
            <h2 className="font-black text-xl text-white tracking-widest">FORGE</h2>
            <p className="text-xs text-zinc-500 font-medium">Sports CAD Simulator</p>
          </div>
        </div>
      </div>

      {/* Main Content (Avatar + Dashboard) sans scroll */}
      <div className="flex gap-8 items-start">
        {/* Left: Avatar (Fixed width to keep proportions) */}
        <div className="w-[400px] shrink-0 bg-black border border-zinc-900 rounded-2xl p-4 flex items-center justify-center">
          <div className="w-full h-[600px]">
            <HumanAvatar 
              simulation={simulation} 
              selectedDay={selectedDay} 
              selectedMuscle={selectedMuscle as MuscleId | 'all'}
              onMuscleClick={() => {}}
              highlightedMuscles={highlightedMuscles as MuscleId[]}
              viewMode="week"
            />
          </div>
        </div>

        {/* Right: Analytics Dashboard (Expanded fully) */}
        <div className="flex-1 bg-black border border-zinc-900 rounded-2xl p-6">
          <WeekDashboard 
            simulation={simulation} 
            blueprint={blueprint} 
            toggledDays={toggledDays} 
          />
        </div>
      </div>

      {/* Footer Publicitaire */}
      <div className="mt-4 text-center border-t border-zinc-800 pt-6">
        <p className="text-zinc-500 font-medium">
          Généré par <strong className="text-emerald-400">FORGE</strong> — Optimise ton entraînement sur <span className="text-white">forge.app</span>
        </p>
      </div>
    </div>
  );
}
