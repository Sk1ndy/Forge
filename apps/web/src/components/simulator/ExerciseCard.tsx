import React from 'react';
import { PlannedExercise, Exercise, PlannedSet, SimulationResult } from '@/lib/calculations';
import { m as motion } from 'framer-motion';
import { cn } from '@/lib/utils';

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

  const targetMuscle = exercise.muscle_primaire;
  const muscleStatus = simulation?.muscles?.[targetMuscle];
  const inolScore = muscleStatus?.inol ?? 0;
  const muscleColor = muscleStatus?.color ?? 'grey';

  const handleUpdateSet = (index: number, updatedSet: Partial<PlannedSet>) => {
    const updatedSets = [...plannedEx.sets];
    updatedSets[index] = { ...updatedSets[index], ...updatedSet };
    onChange({ ...plannedEx, sets: updatedSets });
  };

  const handleAddSetRow = (e: React.MouseEvent) => {
    e.stopPropagation();
    const defaultSet: PlannedSet = {
      series: 3,
      reps: 8,
      poids: 60,
      rpe: 8,
      active: true
    };
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

  const handleRemoveSetRow = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedSets = plannedEx.sets.filter((_, i) => i !== index);
    if (updatedSets.length === 0) {
      onDelete();
    } else {
      onChange({ ...plannedEx, sets: updatedSets });
    }
  };

  const toggleExerciseActive = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...plannedEx, active: e.target.checked });
  };

  return (
    <motion.div
      layout
      layoutId={`ex-card-${plannedEx.id}`}
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      ref={setNodeRef}
      style={style}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest('input') || target.closest('select') || target.closest('button')) return;
        onSelect?.();
      }}
      className={cn(
        "border rounded-xl p-4 bg-zinc-900/40 backdrop-blur-sm transition-colors select-none cursor-pointer duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950",
        !plannedEx.active && 'border-zinc-950/10 opacity-30 bg-zinc-950/10',
        plannedEx.active && isSelected && 'border-emerald-500/50 bg-emerald-950/5 ring-1 ring-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.15)]',
        plannedEx.active && !isSelected && 'border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/60 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5'
      )}
    >
      {/* 1. LEFT METADATA SECTION */}
      <div className="flex items-center gap-2 min-w-0">
        {/* Drag Handle */}
        <div 
          className="cursor-grab touch-none p-1 text-zinc-650 hover:text-zinc-400 active:cursor-grabbing shrink-0"
          {...dragHandleProps}
          {...dragHandleListeners}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 8h16M4 16h16" />
          </svg>
        </div>

        {/* Active Checkbox */}
        <input
          type="checkbox"
          checked={plannedEx.active}
          onChange={toggleExerciseActive}
          className="rounded border-zinc-850 bg-zinc-950 text-emerald-500 focus:ring-emerald-500 h-6 w-6 sm:h-5 sm:w-5 cursor-pointer shrink-0"
        />

        {/* Name, Tier & Fatigue Badge */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-bold text-xs sm:text-sm text-zinc-200 truncate max-w-[130px] sm:max-w-[180px]" title={exercise.nom}>
            {exercise.nom}
          </span>
          
          <span
            className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full shrink-0 leading-none ${
              exercise.tier_snc === 1
                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                : exercise.tier_snc === 2
                ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
            }`}
          >
            T{exercise.tier_snc}
          </span>

          {plannedEx.active && (
            <span
              className={`text-[10px] font-black px-1.5 py-0.5 rounded border shrink-0 leading-none font-mono ${
                muscleColor === 'red'
                  ? 'bg-red-500/15 text-red-400 border-red-500/30'
                  : muscleColor === 'orange'
                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                  : muscleColor === 'green'
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30'
              }`}
              title={`Fatigue INOL accumulée sur le muscle cible (${muscleStatus?.name || targetMuscle}) : ${inolScore.toFixed(2)}`}
            >
              {inolScore.toFixed(1)}
            </span>
          )}
        </div>
      </div>

      {/* 2. RIGHT SETS LIST SECTION */}
      <div className="flex flex-col gap-1.5 sm:items-end w-full sm:w-auto shrink-0">
        {plannedEx.sets.map((set, idx) => (
          <div
            key={idx}
            className={`flex items-center gap-1.5 text-xs w-full justify-between sm:justify-start ${
              !set.active ? 'opacity-35' : ''
            }`}
          >
            <div className="flex items-center gap-1.5">
              {/* Toggle set active */}
              <input
                type="checkbox"
                checked={set.active}
                onChange={(e) => handleUpdateSet(idx, { active: e.target.checked })}
                className="rounded-full border-zinc-850 bg-zinc-950 text-emerald-500 focus:ring-emerald-500 h-6 w-6 sm:h-5 sm:w-5 cursor-pointer shrink-0"
              />

              {/* Series Input */}
              <input
                type="number"
                min="0"
                max="20"
                value={set.series === 0 ? '' : set.series}
                onChange={(e) => handleUpdateSet(idx, { series: e.target.value === '' ? 0 : Math.max(0, Number(e.target.value)) })}
                className="w-[48px] h-10 sm:h-8 text-center rounded-lg border border-zinc-800 bg-zinc-950/60 px-2 text-white font-mono text-[13px] sm:text-[11px] focus:border-emerald-500/50 focus:outline-none"
                title="Séries"
              />

              <span className="text-zinc-650 font-bold font-mono text-[12px] sm:text-[10px]">×</span>

              {/* Reps Input */}
              <input
                type="number"
                min="0"
                max="100"
                value={set.reps === 0 ? '' : set.reps}
                onChange={(e) => handleUpdateSet(idx, { reps: e.target.value === '' ? 0 : Math.max(0, Number(e.target.value)) })}
                className="w-[48px] h-10 sm:h-8 text-center rounded-lg border border-zinc-800 bg-zinc-950/60 px-2 text-white font-mono text-[13px] sm:text-[11px] focus:border-emerald-500/50 focus:outline-none"
                title="Répétitions"
              />

              {/* Weight Input */}
              <div className="flex items-center rounded-lg border border-zinc-800 bg-zinc-950/60 px-2 h-10 sm:h-8 focus-within:border-emerald-500/50 w-[80px] sm:w-[72px] justify-between">
                <input
                  type="number"
                  min="0"
                  max="1000"
                  value={set.poids === 0 ? '' : set.poids}
                  onChange={(e) => handleUpdateSet(idx, { poids: e.target.value === '' ? 0 : Math.max(0, Number(e.target.value)) })}
                  className="w-full text-center bg-transparent text-emerald-400 font-semibold font-mono text-[13px] sm:text-[11px] focus:outline-none"
                  title="Poids"
                />
                <span className="text-zinc-600 text-[10px] sm:text-[8px] font-bold select-none pr-0.5">kg</span>
              </div>

              {/* RPE Selector with Reps In Reserve (RIR) explanations */}
              <select
                value={set.rpe}
                onChange={(e) => handleUpdateSet(idx, { rpe: Number(e.target.value) })}
                className="w-[145px] h-10 sm:h-8 rounded-lg border border-zinc-800 bg-zinc-950/60 px-2 text-left text-emerald-500 font-extrabold focus:border-emerald-500/50 focus:outline-none text-[12px] sm:text-[11px] cursor-pointer"
                title="Nombre de Répétitions en Réserve (RIR) / Intensité"
              >
                {[
                  { v: 10, label: '0 RIR (Effort Max)' },
                  { v: 9.5, label: '0-1 RIR (Quasi-Max)' },
                  { v: 9, label: '1 RIR (1 en réserve)' },
                  { v: 8.5, label: '1-2 RIR' },
                  { v: 8, label: '2 RIR (2 en réserve)' },
                  { v: 7.5, label: '2-3 RIR' },
                  { v: 7, label: '3 RIR (3 en réserve)' },
                  { v: 6.5, label: '3-4 RIR' },
                  { v: 6, label: '4 RIR (4 en réserve)' },
                  { v: 5.5, label: '4-5 RIR' },
                  { v: 5, label: '5+ RIR (Effort Léger)' }
                ].map(item => (
                  <option key={item.v} value={item.v}>{item.label}</option>
                ))}
              </select>

              {/* Inline plus button or delete set row */}
              {idx === plannedEx.sets.length - 1 ? (
                <button
                  onClick={(e) => handleAddSetRow(e)}
                  className="w-10 h-10 sm:w-8 sm:h-8 rounded-lg border border-dashed border-zinc-800 hover:border-emerald-500/40 bg-zinc-950/40 text-zinc-500 hover:text-emerald-400 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                  title="Ajouter une série"
                >
                  <svg className="h-4 w-4 sm:h-3 sm:w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              ) : (
                <button
                  onClick={(e) => handleRemoveSetRow(idx, e)}
                  className="w-10 h-10 sm:w-8 sm:h-8 rounded-lg border border-zinc-800 hover:border-red-500/40 bg-zinc-950/40 text-zinc-500 hover:text-red-400 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                  title="Supprimer cette série"
                >
                  <svg className="h-4 w-4 sm:h-3 sm:w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Delete entire exercise button - displayed on the rightmost edge */}
            {idx === 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="text-zinc-600 hover:text-red-400 p-2 sm:p-1 rounded hover:bg-zinc-800/40 transition-colors ml-2 cursor-pointer shrink-0"
                title="Supprimer l'exercice"
              >
                <svg className="h-5 w-5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
});
