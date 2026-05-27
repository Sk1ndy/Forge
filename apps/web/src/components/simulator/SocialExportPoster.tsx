import React from 'react';
import HumanAvatar from './HumanAvatar';
import WeekDashboard from './WeekDashboard';
import { SimulationResult, WeeklyBlueprint, MuscleId, DEFAULT_EXERCISE_LIBRARY } from '@forge/shared';

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
    <div className="fixed top-0 left-[-10000px] z-[-50] pointer-events-none">
      <div
        id="forge-social-poster"
        className="w-[1400px] bg-zinc-950 p-10 flex flex-col gap-8"
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

      {/* Programme Détaillé (Blueprint) */}
      <div className="bg-black border border-zinc-900 rounded-2xl p-6">
        <h3 className="text-xl font-black text-white mb-6 uppercase tracking-wider">Programme Détaillé</h3>
        <div className="grid grid-cols-7 gap-4">
          {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].map((day) => {
            const dayPlan = blueprint[day as keyof typeof blueprint] || [];
            // Si la journée est désactivée via toggledDays, on la considère comme vide
            const isActiveDay = toggledDays[day] !== false;
            const activeExs = isActiveDay ? dayPlan.filter((ex) => ex.active) : [];

            return (
              <div key={day} className="flex flex-col gap-3">
                {/* En-tête du jour */}
                <div className="bg-zinc-900 rounded-lg p-2 text-center border border-zinc-800 shadow-inner">
                  <span className="text-zinc-300 font-bold text-sm uppercase tracking-widest">{day.substring(0, 3)}</span>
                </div>
                
                {/* Liste des exercices ou Repos */}
                {activeExs.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center p-4 border border-dashed border-zinc-800 rounded-xl bg-zinc-950/50">
                    <span className="text-zinc-600 text-xs font-semibold tracking-widest">REPOS</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {activeExs.map((ex) => {
                      const def = DEFAULT_EXERCISE_LIBRARY.find((d) => d.id === ex.exerciseId);
                      const name = def ? def.nom : ex.exerciseId;
                      const activeSets = ex.sets.filter((s) => s.active);
                      if (activeSets.length === 0) return null;

                      // Agrégation des séries
                      const totalSeries = activeSets.reduce((sum, s) => sum + s.series, 0);
                      const avgReps = Math.round(activeSets.reduce((sum, s) => sum + s.reps * s.series, 0) / totalSeries);
                      const avgRpe = (activeSets.reduce((sum, s) => sum + s.rpe * s.series, 0) / totalSeries).toFixed(1);

                      return (
                        <div key={ex.id} className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-3 flex flex-col gap-2 hover:border-zinc-700 transition-colors">
                          <span className="text-emerald-400 font-bold text-[11px] leading-tight line-clamp-2" title={name}>
                            {name}
                          </span>
                          <div className="flex justify-between items-center text-[10px] mt-auto pt-2 border-t border-zinc-800/50">
                            <span className="text-zinc-300 font-mono bg-zinc-950 px-1.5 py-0.5 rounded">
                              {totalSeries}×{avgReps}
                            </span>
                            <span className="text-orange-400 font-mono font-bold">
                              RPE {avgRpe}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Publicitaire */}
      <div className="mt-4 text-center border-t border-zinc-800 pt-6">
        <p className="text-zinc-500 font-medium">
          Généré par <strong className="text-emerald-400">FORGE</strong> — Optimise ton entraînement sur <span className="text-white">forge.app</span>
        </p>
      </div>
      </div>
    </div>
  );
}
