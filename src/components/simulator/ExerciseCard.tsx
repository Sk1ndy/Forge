import React from 'react';
import { PlannedExercise, Exercise, PlannedSet, SimulationResult } from '@/lib/calculations';

interface ExerciseCardProps {
  plannedEx: PlannedExercise;
  exerciseDef?: Exercise;
  onChange: (updated: PlannedExercise) => void;
  onDelete: () => void;
  simulation: SimulationResult;
  setNodeRef?: (node: HTMLElement | null) => void;
  style?: React.CSSProperties;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dragHandleProps?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dragHandleListeners?: any;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  isSelected?: boolean;
  onSelect?: () => void;
}

export default React.memo(function ExerciseCard({ 
  plannedEx, 
  exerciseDef,
  onChange, 
  onDelete, 
  simulation,
  setNodeRef,
  style,
  dragHandleProps,
  dragHandleListeners,
  onMouseEnter,
  onMouseLeave,
  isSelected,
  onSelect
}: ExerciseCardProps) {
  const exercise = exerciseDef;

  if (!exercise) return null;

  const jointStress = simulation?.muscles?.[exercise.muscle_primaire]?.jointStress ?? 0;

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
      ref={setNodeRef}
      style={style}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest('input') || target.closest('select') || target.closest('button')) return;
        onSelect?.();
      }}
      className={`border rounded-xl p-3.5 bg-zinc-900/40 backdrop-blur-sm transition-all select-none cursor-pointer duration-300 ${
        !plannedEx.active
          ? 'border-zinc-950/10 opacity-40 bg-zinc-950/10'
          : isSelected
          ? 'border-emerald-500 bg-emerald-950/5 ring-1 ring-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.12)]'
          : 'border-zinc-900 hover:border-zinc-800 hover:bg-zinc-900/60 shadow-sm'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-1 pb-1.5 border-b border-zinc-850">
        <div className="flex items-center gap-1.5 overflow-hidden">
          {/* Drag Handle */}
          <div 
            className="cursor-grab touch-none p-1 -ml-1 text-zinc-600 hover:text-zinc-400 active:cursor-grabbing"
            {...dragHandleProps}
            {...dragHandleListeners}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 8h16M4 16h16" />
            </svg>
          </div>
          <input
            type="checkbox"
            checked={plannedEx.active}
            onChange={toggleExerciseActive}
            className="rounded border-zinc-800 bg-zinc-950 text-emerald-500 focus:ring-emerald-500 h-3.5 w-3.5 cursor-pointer shrink-0"
          />
          <h4 className="font-semibold text-[11px] text-zinc-100 truncate" title={exercise.nom}>
            {exercise.nom}
          </h4>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span
            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
              exercise.tier_snc === 1
                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                : exercise.tier_snc === 2
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
            }`}
          >
            T{exercise.tier_snc}
          </span>
          <button
            onClick={onDelete}
            className="text-zinc-500 hover:text-red-400 p-0.5 rounded hover:bg-zinc-850 transition-colors"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Joint Stress Alert */}
      {plannedEx.active && jointStress > 1.0 && (
        <div className="mt-1.5 px-2 py-1 bg-zinc-950/20 rounded border border-zinc-850/30 flex items-center justify-between text-[8px] font-medium">
          <span className="text-zinc-500">Contrainte Articulaire :</span>
          <span className={`font-bold px-1 rounded-full ${
            jointStress > 2.0 
              ? 'text-red-400 bg-red-950/30' 
              : 'text-amber-400 bg-amber-950/30'
          }`}>
            ⚠️ {jointStress > 2.0 ? 'Élevée' : 'Modérée'} ({jointStress.toFixed(1)})
          </span>
        </div>
      )}

      {/* Header des colonnes (uniquement s'il y a des séries et actif) */}
      {plannedEx.active && plannedEx.sets.length > 0 && (
        <div className="flex items-center gap-2 px-1 text-[8px] font-extrabold tracking-wider uppercase text-zinc-500 font-sans border-b border-zinc-900/50 pb-1.5 mb-2 mt-3 select-none">
          <div className="w-3.5 shrink-0"></div> {/* Checkbox spacer */}
          <div className="w-[42px] text-center">Séries</div>
          <div className="w-[42px] text-center">Reps</div>
          <div className="w-[58px] text-center">Poids</div>
          <div className="w-[64px] text-center">Intensité</div>
          <div className="flex-1"></div> {/* Spacer for delete button alignment */}
        </div>
      )}

      {/* Sets Rows */}
      <div className="space-y-2">
        {plannedEx.sets.map((set, idx) => (
          <div
            key={idx}
            className={`flex items-center gap-2 text-[10px] ${
              !set.active ? 'opacity-35' : ''
            }`}
          >
            {/* Active set toggle */}
            <input
              type="checkbox"
              checked={set.active}
              onChange={(e) => handleUpdateSet(idx, { active: e.target.checked })}
              className="rounded-full border-zinc-800 bg-zinc-950 text-emerald-500 focus:ring-emerald-500 h-3.5 w-3.5 cursor-pointer shrink-0"
            />

            {/* Series */}
            <input
              type="number"
              min="1"
              max="20"
              value={set.series}
              onChange={(e) => handleUpdateSet(idx, { series: Math.max(1, Number(e.target.value)) })}
              className="w-[42px] text-center rounded border border-zinc-850 bg-zinc-950 px-1 py-1 text-white text-[10px] focus:border-emerald-500/50 focus:outline-none"
              title="Séries"
            />

            {/* Reps */}
            <input
              type="number"
              min="1"
              max="100"
              value={set.reps}
              onChange={(e) => handleUpdateSet(idx, { reps: Math.max(1, Number(e.target.value)) })}
              className="w-[42px] text-center rounded border border-zinc-850 bg-zinc-950 px-1 py-1 text-white text-[10px] focus:border-emerald-500/50 focus:outline-none"
              title="Répétitions"
            />
            
            {/* Weight */}
            <div className="flex items-center rounded border border-zinc-850 bg-zinc-950 px-1 py-0.5 focus-within:border-emerald-500/50 w-[58px] justify-between">
              <input
                type="number"
                min="0"
                max="1000"
                value={set.poids}
                onChange={(e) => handleUpdateSet(idx, { poids: Math.max(0, Number(e.target.value)) })}
                className="w-[32px] text-center bg-transparent text-emerald-400 font-semibold text-[10px] focus:outline-none"
                title="Poids"
              />
              <span className="text-zinc-600 text-[8px] font-bold select-none pr-0.5">kg</span>
            </div>

            {/* RPE */}
            <select
              value={set.rpe}
              onChange={(e) => handleUpdateSet(idx, { rpe: Number(e.target.value) })}
              className="w-[64px] rounded border border-zinc-850 bg-zinc-950 px-1 py-1 text-center text-white focus:border-emerald-500/50 focus:outline-none text-[10px]"
              title="Intensité (RPE)"
            >
              {[10, 9.5, 9, 8.5, 8, 7.5, 7, 6.5, 6, 5.5, 5].map(v => (
                <option key={v} value={v}>@{v}</option>
              ))}
            </select>

            {/* Remove Row */}
            <div className="flex-1 flex justify-end">
              {plannedEx.sets.length > 1 && (
                <button
                  onClick={() => handleRemoveSetRow(idx)}
                  className="text-zinc-500 hover:text-red-400 p-1 shrink-0 transition-colors"
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Row Button */}
      {plannedEx.active && (
        <button
          onClick={handleAddSetRow}
          className="mt-2 flex items-center justify-center gap-1 w-full rounded border border-dashed border-zinc-850 hover:border-zinc-700 py-1 text-[9px] text-zinc-400 hover:text-emerald-400 transition-all cursor-pointer"
        >
          <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          + Séries
        </button>
      )}
    </div>
  );
});
