import React from 'react';
import { PlannedExercise, Exercise, EXERCISE_LIBRARY, PlannedSet } from '@/lib/calculations';

interface ExerciseCardProps {
  plannedEx: PlannedExercise;
  onChange: (updated: PlannedExercise) => void;
  onDelete: () => void;
}

export default function ExerciseCard({ plannedEx, onChange, onDelete }: ExerciseCardProps) {
  const exercise = EXERCISE_LIBRARY.find(e => e.id === plannedEx.exerciseId);

  if (!exercise) return null;

  const handleUpdateSet = (index: number, updatedSet: Partial<PlannedSet>) => {
    const updatedSets = [...plannedEx.sets];
    updatedSets[index] = { ...updatedSets[index], ...updatedSet };
    onChange({ ...plannedEx, sets: updatedSets });
  };

  const handleAddSetRow = () => {
    const defaultSet: PlannedSet = {
      series: 3,
      reps: 8,
      poids: 60,
      rpe: 8,
      active: true
    };
    // Copier les paramètres de la dernière ligne s'il y en a une
    if (plannedEx.sets.length > 0) {
      const last = plannedEx.sets[plannedEx.sets.length - 1];
      defaultSet.series = last.series;
      defaultSet.reps = last.reps;
      defaultSet.poids = last.poids;
      defaultSet.rpe = last.rpe;
    }
    onChange({
      ...plannedEx,
      sets: [...plannedEx.sets, defaultSet]
    });
  };

  const handleRemoveSetRow = (index: number) => {
    const updatedSets = plannedEx.sets.filter((_, i) => i !== index);
    if (updatedSets.length === 0) {
      onDelete();
    } else {
      onChange({ ...plannedEx, sets: updatedSets });
    }
  };

  const toggleExerciseActive = () => {
    onChange({ ...plannedEx, active: !plannedEx.active });
  };

  return (
    <div
      className={`border rounded-xl p-3 bg-zinc-900/60 backdrop-blur-sm transition-all ${
        plannedEx.active
          ? 'border-zinc-800 hover:border-zinc-700 shadow-md'
          : 'border-zinc-900/20 opacity-50 bg-zinc-950/20'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-zinc-850">
        <div className="flex items-center gap-2 overflow-hidden">
          <input
            type="checkbox"
            checked={plannedEx.active}
            onChange={toggleExerciseActive}
            className="rounded border-zinc-800 bg-zinc-950 text-emerald-500 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
          />
          <h4 className="font-semibold text-sm text-zinc-100 truncate" title={exercise.nom}>
            {exercise.nom}
          </h4>
        </div>
        <div className="flex items-center gap-1">
          <span
            className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
              exercise.tier_snc === 1
                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                : exercise.tier_snc === 2
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
            }`}
          >
            Tier {exercise.tier_snc}
          </span>
          <button
            onClick={onDelete}
            className="text-zinc-500 hover:text-red-400 p-1 rounded hover:bg-zinc-850 transition-colors"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Sets Rows */}
      <div className="mt-2 space-y-2">
        {plannedEx.sets.map((set, idx) => (
          <div
            key={idx}
            className={`flex items-center gap-1.5 text-xs ${
              !set.active ? 'opacity-40' : ''
            }`}
          >
            {/* Active set toggle */}
            <input
              type="checkbox"
              checked={set.active}
              onChange={(e) => handleUpdateSet(idx, { active: e.target.checked })}
              className="rounded-full border-zinc-800 bg-zinc-950 text-emerald-500 focus:ring-emerald-500 h-3.5 w-3.5 cursor-pointer"
            />

            {/* Series */}
            <div className="w-[45px]">
              <input
                type="number"
                min="1"
                max="20"
                value={set.series}
                onChange={(e) => handleUpdateSet(idx, { series: Math.max(1, Number(e.target.value)) })}
                className="w-full text-center rounded border border-zinc-800 bg-zinc-950 px-1 py-1 text-white focus:border-emerald-500 focus:outline-none"
                title="Séries"
              />
            </div>
            <span className="text-zinc-600">x</span>

            {/* Reps */}
            <div className="w-[45px]">
              <input
                type="number"
                min="1"
                max="100"
                value={set.reps}
                onChange={(e) => handleUpdateSet(idx, { reps: Math.max(1, Number(e.target.value)) })}
                className="w-full text-center rounded border border-zinc-800 bg-zinc-950 px-1 py-1 text-white focus:border-emerald-500 focus:outline-none"
                title="Répétitions"
              />
            </div>
            
            {/* Weight */}
            <div className="flex-1 min-w-[50px]">
              <input
                type="number"
                min="0"
                max="1000"
                value={set.poids}
                onChange={(e) => handleUpdateSet(idx, { poids: Math.max(0, Number(e.target.value)) })}
                className="w-full text-center rounded border border-zinc-800 bg-zinc-950 px-1 py-1 text-white focus:border-emerald-500 focus:outline-none font-semibold text-emerald-400"
                title="Poids (kg)"
              />
            </div>
            <span className="text-zinc-600">kg</span>

            {/* RPE */}
            <div className="w-[50px]">
              <select
                value={set.rpe}
                onChange={(e) => handleUpdateSet(idx, { rpe: Number(e.target.value) })}
                className="w-full rounded border border-zinc-800 bg-zinc-950 px-0.5 py-1 text-center text-white focus:border-emerald-500 focus:outline-none text-[11px]"
                title="RPE"
              >
                {[10, 9.5, 9, 8.5, 8, 7.5, 7, 6.5, 6, 5.5, 5].map(v => (
                  <option key={v} value={v}>RPE {v}</option>
                ))}
              </select>
            </div>

            {/* Remove Row */}
            {plannedEx.sets.length > 1 && (
              <button
                onClick={() => handleRemoveSetRow(idx)}
                className="text-zinc-600 hover:text-red-400 p-0.5"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add Row Button */}
      {plannedEx.active && (
        <button
          onClick={handleAddSetRow}
          className="mt-3 flex items-center justify-center gap-1 w-full rounded border border-dashed border-zinc-850 hover:border-zinc-700 py-1 text-[10px] text-zinc-400 hover:text-emerald-400 transition-all cursor-pointer"
        >
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Ajouter des séries
        </button>
      )}
    </div>
  );
}
