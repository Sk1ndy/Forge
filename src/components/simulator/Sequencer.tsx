import React, { useMemo, useCallback } from 'react';
import { WeeklyBlueprint, PlannedExercise, SimulationResult, Exercise } from '@/lib/calculations';
import { PPL_TEMPLATE, FULL_BODY_TEMPLATE } from '@/lib/templates';
import ExerciseCard from './ExerciseCard';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SequencerProps {
  blueprint: WeeklyBlueprint;
  toggledDays: { [day: string]: boolean };
  onUpdateExercise: (day: string, index: number, updatedEx: PlannedExercise) => void;
  onDeleteExercise: (day: string, index: number) => void;
  onReorderExercises?: (day: string, startIndex: number, endIndex: number) => void;
  onClearDay: (day: string) => void;
  onUpdateToggledDays: (updated: { [day: string]: boolean }) => void;
  selectedDay?: string;
  onSelectDay?: (day: string) => void;
  onAddExercise?: (exerciseId: string, day: string) => void;
  simulation: SimulationResult;
  exercises: Exercise[];
  onLoadTemplate?: (template: WeeklyBlueprint) => void;
  onHoverExerciseChange?: (exercise: Exercise | null) => void;
  selectedExercise?: Exercise | null;
  onSelectExercise?: (exercise: Exercise | null) => void;
  viewMode?: 'day' | 'week';
}

export default function Sequencer({
  blueprint,
  toggledDays,
  onUpdateExercise,
  onDeleteExercise,
  onClearDay,
  onUpdateToggledDays,
  selectedDay,
  onAddExercise,
  simulation,
  onReorderExercises,
  exercises,
  onLoadTemplate,
  onHoverExerciseChange,
  selectedExercise,
  onSelectExercise,
  viewMode = 'day'
}: SequencerProps) {
  const [isDragOver, setIsDragOver] = React.useState(false);

  const groupSeries = useMemo(() => {
    let chest = 0;
    let back = 0;
    let shoulders = 0;
    let biceps = 0;
    let triceps = 0;
    let quads = 0;
    let posterior = 0;

    Object.values(blueprint).forEach(dayExercises => {
      dayExercises.forEach(plannedEx => {
        if (!plannedEx.active) return;
        const exDef = exercises.find(e => e.id === plannedEx.exerciseId);
        if (!exDef) return;

        const m = exDef.muscle_primaire;
        const setsCount = plannedEx.sets.reduce((sum, s) => sum + (s.active ? s.series : 0), 0);

        if (m === 'chest' || m === 'upperChest' || m === 'lowerChest') {
          chest += setsCount;
        } else if (m === 'upperBack' || m === 'lowerBack' || m === 'rhomboids' || m === 'trapezius' || m === 'upperTrapezius' || m === 'lowerTrapezius') {
          back += setsCount;
        } else if (m === 'deltoids' || m === 'frontDeltoid' || m === 'rearDeltoid') {
          shoulders += setsCount;
        } else if (m === 'biceps') {
          biceps += setsCount;
        } else if (m === 'triceps') {
          triceps += setsCount;
        } else if (m === 'quadriceps' || m === 'innerQuad' || m === 'outerQuad') {
          quads += setsCount;
        } else if (m === 'hamstring' || m === 'gluteal') {
          posterior += setsCount;
        }
      });
    });

    return { chest, back, shoulders, biceps, triceps, quads, posterior };
  }, [blueprint, exercises]);

  const posturaleRatio = useMemo(() => {
    const push = groupSeries.chest + groupSeries.shoulders + groupSeries.triceps;
    const pull = groupSeries.back + groupSeries.biceps;
    const total = push + pull;
    
    const pushPct = total > 0 ? Math.round((push / total) * 100) : 50;
    const pullPct = total > 0 ? 100 - pushPct : 50;
    
    return { pushPct, pullPct, push, pull };
  }, [groupSeries]);

  // DND Sensors (distance 5 to allow clicks inside inputs)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleToggleDay = useCallback((day: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering day selection if just toggling
    onUpdateToggledDays({
      ...toggledDays,
      [day]: !toggledDays[day]
    });
  }, [toggledDays, onUpdateToggledDays]);

  const handleClearDayConfirm = useCallback((day: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering day selection if just clearing
    if (confirm(`Voulez-vous vider la séance de ${day} ?`)) {
      onClearDay(day);
    }
  }, [onClearDay]);

  // Helper to calculate summary for a day
  const getDaySummary = useCallback((day: string) => {
    const exercises = blueprint[day] || [];
    const isDayActive = toggledDays[day] !== false;
    
    if (!isDayActive) {
      return { text: 'Désactivé', subtext: 'Jour ignoré', isRest: true };
    }
    
    const activeExercises = exercises.filter(e => e.active);
    if (activeExercises.length === 0) {
      return { text: 'Repos ⚡', subtext: 'Récupération', isRest: true };
    }
    
    const totalSets = activeExercises.reduce(
      (sum, ex) => sum + ex.sets.reduce((sSum, s) => sSum + (s.active ? s.series : 0), 0),
      0
    );
    
    return {
      text: `${activeExercises.length} exo${activeExercises.length > 1 ? 's' : ''}`,
      subtext: `${totalSets} série${totalSets > 1 ? 's' : ''}`,
      isRest: false
    };
  }, [blueprint, toggledDays]);

  // Safe selected day fallback (ensure a day is always selected)
  const currentDay = selectedDay || 'Dimanche';
  const currentExercises = useMemo(() => blueprint[currentDay] || [], [blueprint, currentDay]);
  const isCurrentDayActive = toggledDays[currentDay] !== false;
  const currentSummary = useMemo(() => getDaySummary(currentDay), [getDaySummary, currentDay]);

  const isBlueprintEmpty = useMemo(() => {
    return Object.values(blueprint).every(dayExercises => dayExercises.length === 0);
  }, [blueprint]);

  const globalCapacity = simulation?.globalWorkCapacity ?? 100;

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = currentExercises.findIndex((ex) => ex.id === active.id);
      const newIndex = currentExercises.findIndex((ex) => ex.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1 && onReorderExercises) {
        onReorderExercises(currentDay, oldIndex, newIndex);
      }
    }
  }, [currentExercises, currentDay, onReorderExercises]);

  return (
    <div className="w-full h-full select-none min-h-0 flex flex-col">
      {viewMode === 'week' ? (
        <div className="flex-1 border rounded-xl p-4 flex flex-col min-h-0 border-zinc-900 bg-zinc-900/20">
          {/* Workspace Header */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-900 shrink-0">
            <h4 className="font-extrabold text-base text-zinc-100 flex items-center gap-1.5 font-sans">
              Rapport Hebdomadaire Analytique
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Cumulé Semaine
              </span>
            </h4>
          </div>

          {/* 3 columns macro analysis dashboard */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 mt-4 min-h-0 overflow-y-auto pr-1">
            
            {/* Column 1: Volume de croissance (Séries réelles) */}
            <div className="bg-zinc-900/10 border border-zinc-900 rounded-xl p-4.5 flex flex-col justify-between h-full">
              <div>
                <h5 className="text-xs font-bold text-emerald-450 uppercase tracking-wider flex items-center gap-2 mb-3">
                  📊 Volume Hebdomadaire (Séries)
                </h5>
                <p className="text-[11px] text-zinc-500 mb-4 leading-normal">
                  Séries effectives par grand groupe musculaire. Cible : 10 à 20 séries pour une croissance maximale.
                </p>
                
                <div className="space-y-2.5">
                  {[
                    { label: 'Pectoraux', value: groupSeries.chest, max: 20 },
                    { label: 'Dos', value: groupSeries.back, max: 20 },
                    { label: 'Épaules', value: groupSeries.shoulders, max: 20 },
                    { label: 'Biceps', value: groupSeries.biceps, max: 20 },
                    { label: 'Triceps', value: groupSeries.triceps, max: 20 },
                    { label: 'Quadriceps', value: groupSeries.quads, max: 20 },
                    { label: 'Ischios/Fessiers', value: groupSeries.posterior, max: 20 }
                  ].map((group) => {
                    let statusColor = 'text-zinc-400';
                    let barColor = 'bg-zinc-700';
                    if (group.value >= 10 && group.value <= 20) {
                      statusColor = 'text-emerald-400 font-bold';
                      barColor = 'bg-emerald-500';
                    } else if (group.value > 20) {
                      statusColor = 'text-red-400 font-bold';
                      barColor = 'bg-red-500 animate-pulse';
                    } else if (group.value > 0) {
                      statusColor = 'text-sky-400 font-semibold';
                      barColor = 'bg-sky-500';
                    }
                    const pct = Math.min(100, (group.value / group.max) * 100);

                    return (
                      <div key={group.label} className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-zinc-300 font-medium">{group.label}</span>
                          <span className={statusColor}>{group.value} / {group.max} sér.</span>
                        </div>
                        <div className="h-1.5 w-full bg-zinc-950 border border-zinc-900 rounded-full overflow-hidden">
                          <div className={`h-full ${barColor} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Column 2: Balance Posturale */}
            <div className="bg-zinc-900/10 border border-zinc-900 rounded-xl p-4.5 flex flex-col justify-between h-full">
              <div>
                <h5 className="text-xs font-bold text-sky-450 uppercase tracking-wider flex items-center gap-2 mb-3">
                  ⚖️ Balance Posturale (Poussée / Tirage)
                </h5>
                <p className="text-[11px] text-zinc-500 mb-4 leading-normal">
                  Équilibre agoniste/antagoniste entre les mouvements de poussée et de tirage pour la santé de l&apos;épaule.
                </p>

                <div className="space-y-5 pt-3">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex flex-col">
                      <span className="text-zinc-400 font-semibold">Poussée (Push)</span>
                      <span className="text-[10px] text-zinc-500 mt-0.5">{posturaleRatio.push} séries</span>
                    </div>
                    <span className="text-sky-400 font-black text-sm">{posturaleRatio.pushPct}%</span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <div className="flex flex-col">
                      <span className="text-zinc-400 font-semibold">Tirage (Pull)</span>
                      <span className="text-[10px] text-zinc-500 mt-0.5">{posturaleRatio.pull} séries</span>
                    </div>
                    <span className="text-amber-400 font-black text-sm">{posturaleRatio.pullPct}%</span>
                  </div>

                  {/* Visual ratio bar */}
                  <div className="h-3 w-full bg-zinc-950 border border-zinc-900 rounded-full overflow-hidden flex">
                    <div className="h-full bg-sky-500" style={{ width: `${posturaleRatio.pushPct}%` }} />
                    <div className="h-full bg-amber-500" style={{ width: `${posturaleRatio.pullPct}%` }} />
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-zinc-400 bg-zinc-900/30 p-2.5 rounded-lg border border-zinc-850 mt-4 leading-relaxed shrink-0">
                💡 **Ratio Idéal** : Visez environ **45% Poussée / 55% Tirage** pour compenser la dominance naturelle antérieure et stabiliser la coiffe des rotateurs.
              </div>
            </div>

            {/* Column 3: Diagnostic SNC Global */}
            <div className="bg-zinc-900/10 border border-zinc-900 rounded-xl p-4.5 flex flex-col justify-between h-full">
              <div>
                <h5 className="text-xs font-bold text-red-450 uppercase tracking-wider flex items-center gap-2 mb-3">
                  🧠 Diagnostic SNC Global (Stress Axial)
                </h5>
                <p className="text-[11px] text-zinc-500 mb-4 leading-normal">
                  Évaluation de la charge accumulée sur le Système Nerveux Central par les exercices polyarticulaires lourds.
                </p>

                <div className="space-y-4 pt-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-400 font-semibold">Score cumulé</span>
                    <span className={`font-black font-mono ${simulation.cnsFailure ? 'text-red-400' : 'text-emerald-400'}`}>
                      {simulation.sncScore} pts
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-zinc-500">Saturation nerveuse</span>
                      <span className={simulation.cnsFailure ? 'text-red-400 font-extrabold animate-pulse' : 'text-zinc-300'}>
                        {simulation.sncPercentage}%
                      </span>
                    </div>
                    <div className="h-3.5 w-full bg-zinc-950 border border-zinc-900 rounded-full overflow-hidden p-0.5 relative">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          simulation.sncPercentage > 100
                            ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)] animate-pulse'
                            : simulation.sncPercentage > 80
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${simulation.sncPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-zinc-400 bg-zinc-900/30 p-2.5 rounded-lg border border-zinc-850 mt-4 leading-relaxed shrink-0">
                {simulation.cnsFailure ? (
                  <span className="text-red-400 font-semibold">🚨 **Alerte Rouge** : Le SNC est saturé. La fatigue accumulée altère le recrutement des fibres musculaires rapides. Allégez ou planifiez une semaine de deload.</span>
                ) : simulation.sncPercentage > 80 ? (
                  <span className="text-amber-400 font-semibold">⚠️ **Fatigue Importante** : Charge nerveuse très élevée. Surveillez votre sommeil et évitez d&apos;ajouter d&apos;autres exercices polyarticulaires Tier 1.</span>
                ) : (
                  <span className="text-emerald-400 font-semibold">✅ **SNC Stable** : La charge nerveuse globale est parfaitement tolérée. Vos capacités de récupération systémique sont optimales.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div 
          onDragOver={(e) => {
            e.preventDefault();
            if (isCurrentDayActive) {
              setIsDragOver(true);
              e.dataTransfer.dropEffect = 'copy';
            }
          }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          if (!isCurrentDayActive) return;
          const exerciseId = e.dataTransfer.getData('text/plain');
          if (exerciseId) {
            const exercise = exercises.find(ex => ex.id === exerciseId);
            if (exercise) {
              const muscleStatus = simulation?.muscles?.[exercise.muscle_primaire];
              if (muscleStatus?.color === 'red') {
                alert(`⚠️ Ajout Bloqué ! Le muscle cible (${muscleStatus.name || exercise.muscle_primaire}) a dépassé son Volume Récupérable Maximal (MRV).`);
                return;
              }
            }
            if (onAddExercise) {
              onAddExercise(exerciseId, currentDay);
            }
          }
        }}
        className={`flex-1 min-w-0 border rounded-xl p-4 flex flex-col min-h-0 transition-all duration-300 ${
          isDragOver 
            ? 'border-emerald-500 bg-emerald-950/10 shadow-[0_0_20px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/20' 
            : 'border-zinc-900 bg-zinc-900/20'
        }`}
      >
        
        {/* Workspace Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-900 shrink-0">
          <div className="flex items-center gap-2">
            <h4 className="font-extrabold text-base text-zinc-100 flex items-center gap-1.5 font-sans">
              Séance du {currentDay}
              {!isCurrentDayActive && (
                <span className="text-[10px] bg-zinc-800 text-zinc-500 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Désactivée
                </span>
              )}
              {isCurrentDayActive && currentSummary.isRest && (
                <span className="text-[10px] bg-emerald-950 text-emerald-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Repos ⚡
                </span>
              )}
              {isCurrentDayActive && !currentSummary.isRest && (
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Actif
                </span>
              )}
            </h4>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Quick Toggle Active status for current day */}
            <label className="flex items-center gap-1.5 text-xs text-zinc-400 cursor-pointer">
              <input
                type="checkbox"
                checked={isCurrentDayActive}
                onChange={(e) => handleToggleDay(currentDay, e as unknown as React.MouseEvent)}
                className="rounded border-zinc-800 bg-zinc-950 text-emerald-500 focus:ring-emerald-500 h-3.5 w-3.5 cursor-pointer"
              />
              <span>Journée d&apos;entraînement</span>
            </label>

            {currentExercises.length > 0 && isCurrentDayActive && (
              <button
                onClick={(e) => handleClearDayConfirm(currentDay, e)}
                className="text-[10px] text-zinc-400 hover:text-red-400 font-bold px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 transition-colors cursor-pointer"
              >
                Vider la séance
              </button>
            )}
          </div>
        </div>

        {/* Recovery Capacity Bar */}
        <div className="mt-3 bg-zinc-950/40 rounded-xl p-3 border border-zinc-900/50 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] font-extrabold tracking-wider uppercase text-zinc-500 font-sans">
              Capacité de Récupération Hebdomadaire
            </span>
            <span className={`text-xs font-extrabold mt-0.5 ${
              globalCapacity > 40
                ? 'text-emerald-400'
                : globalCapacity >= 15
                ? 'text-amber-400'
                : 'text-red-400 animate-pulse'
            }`}>
              {globalCapacity > 40
                ? 'Volume Optimal - Capacité disponible'
                : globalCapacity >= 15
                ? 'Surcharge Musculaire - Planification prudente'
                : 'Seuil Critique - Risque de surentraînement ⚠️'}
            </span>
          </div>
          
          <div className="flex items-center gap-3 flex-1 sm:max-w-md w-full">
            <div className="h-2 rounded-full bg-zinc-900 border border-zinc-850 w-full overflow-hidden relative">
              <div 
                className={`h-full rounded-full transition-all duration-500 ease-out ${
                  globalCapacity > 40
                    ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                    : globalCapacity >= 15
                    ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                    : 'bg-red-500 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.6)]'
                }`}
                style={{ width: `${globalCapacity}%` }}
              />
            </div>
            <span className={`font-mono text-xs font-extrabold w-12 text-right ${
              globalCapacity > 40
                ? 'text-emerald-400'
                : globalCapacity >= 15
                ? 'text-amber-400'
                : 'text-red-400 animate-pulse'
            }`}>
              {globalCapacity.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Exercises Scroll Area or Centered States */}
        {isBlueprintEmpty ? (
          <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 text-center space-y-4 sm:space-y-5 min-h-0 overflow-y-auto mt-2">
            <div className="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.03)] shrink-0">
              <svg className="h-6.5 w-6.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div className="shrink-0">
              <h2 className="text-lg font-bold text-zinc-200">Commencez votre programme</h2>
              <p className="text-xs text-zinc-500 mt-1.5 max-w-md mx-auto leading-relaxed">
                Votre Séquenceur Hebdomadaire est vide. Ajoutez des exercices depuis la bibliothèque, ou chargez l&apos;un de nos templates pour démarrer immédiatement.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full max-w-lg mt-2 shrink-0">
              <button
                onClick={() => onLoadTemplate?.(PPL_TEMPLATE)}
                className="group relative overflow-hidden rounded-xl border border-zinc-850 bg-zinc-900/40 hover:bg-zinc-850 p-4.5 text-left transition-all hover:border-emerald-500/50"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <h3 className="font-bold text-sm text-zinc-200 flex items-center gap-2">
                  <span>🏃</span> PPL Débutant
                </h3>
                <p className="text-[11px] text-zinc-450 mt-1 leading-normal">Push, Pull, Legs sur 6 jours. Idéal pour maximiser l&apos;hypertrophie.</p>
              </button>
              
              <button
                onClick={() => onLoadTemplate?.(FULL_BODY_TEMPLATE)}
                className="group relative overflow-hidden rounded-xl border border-zinc-850 bg-zinc-900/40 hover:bg-zinc-850 p-4.5 text-left transition-all hover:border-blue-500/50"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <h3 className="font-bold text-sm text-zinc-200 flex items-center gap-2">
                  <span>🏋️</span> Full Body Force
                </h3>
                <p className="text-[11px] text-zinc-450 mt-1 leading-normal">Squat, Bench, Deadlift sur 3 jours. Axé sur la progression en force.</p>
              </button>
            </div>
          </div>
        ) : !isCurrentDayActive ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto mt-2 min-h-0 overflow-y-auto">
            <div className="bg-zinc-900/50 p-3.5 rounded-full mb-3.5 border border-zinc-850 shrink-0">
              <svg className="h-6.5 w-6.5 text-zinc-550" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <h5 className="font-bold text-sm text-zinc-350 shrink-0">Journée Désactivée</h5>
            <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
              Cette journée est ignorée dans la simulation. Cochez &quot;Journée d&apos;entraînement&quot; ci-dessus pour la réactiver et planifier des séances.
            </p>
          </div>
        ) : currentExercises.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto mt-2 bg-emerald-950/5 border border-dashed border-emerald-900/10 rounded-xl min-h-0 overflow-y-auto">
            <div className="bg-emerald-950/20 p-3.5 rounded-full mb-3 border border-emerald-900/20 shrink-0">
              <svg className="h-6.5 w-6.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h5 className="font-bold text-sm text-emerald-450 shrink-0">Récupération Active 🌊</h5>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              Aucun exercice planifié. Profitez-en pour dissiper la fatigue avec de la <strong className="text-zinc-300">Récupération Active</strong> (marche, vélo léger, mobilité). Cela augmente le flux sanguin intramusculaire et accélère la reconstruction des tendons.
            </p>
            <p className="text-[11px] text-zinc-500 mt-3 font-semibold text-center leading-normal shrink-0">
              💡 Cliquez sur un exercice ou glissez-le directement ici pour ajouter une séance.
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto scrollbar-thin mt-4 min-h-0 pr-1">
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext 
                items={currentExercises.map(ex => ex.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex flex-col gap-2.5 pb-2">
                  {currentExercises.map((plannedEx, index) => {
                    const exerciseDef = exercises.find(ex => ex.id === plannedEx.exerciseId);
                    return (
                      <SortableExerciseWrapper
                        key={plannedEx.id}
                        plannedEx={plannedEx}
                        exerciseDef={exerciseDef}
                        index={index}
                        currentDay={currentDay}
                        onUpdateExercise={onUpdateExercise}
                        onDeleteExercise={onDeleteExercise}
                        simulation={simulation}
                        onHoverEnter={() => onHoverExerciseChange?.(exerciseDef || null)}
                        onHoverLeave={() => onHoverExerciseChange?.(null)}
                        isSelected={selectedExercise?.id === exerciseDef?.id}
                        onSelect={() => {
                          if (selectedExercise?.id === exerciseDef?.id) {
                            onSelectExercise?.(null);
                          } else {
                            onSelectExercise?.(exerciseDef || null);
                          }
                        }}
                      />
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        )}
      </div>
      )}
    </div>
  );
}

// Wrapper for Sortable DND integration
const SortableExerciseWrapper = React.memo(function SortableExerciseWrapper({ 
  plannedEx, 
  exerciseDef, 
  index, 
  currentDay, 
  onUpdateExercise, 
  onDeleteExercise, 
  simulation,
  onHoverEnter,
  onHoverLeave,
  isSelected,
  onSelect
}: { 
  plannedEx: PlannedExercise, 
  exerciseDef?: Exercise, 
  index: number, 
  currentDay: string, 
  onUpdateExercise: (day: string, idx: number, updated: PlannedExercise) => void, 
  onDeleteExercise: (day: string, idx: number) => void, 
  simulation: SimulationResult,
  onHoverEnter?: () => void,
  onHoverLeave?: () => void,
  isSelected?: boolean,
  onSelect?: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: plannedEx.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 0,
    opacity: isDragging ? 0.9 : 1,
    position: 'relative' as const,
  };

  return (
    <ExerciseCard
      setNodeRef={setNodeRef}
      style={style}
      dragHandleProps={attributes}
      dragHandleListeners={listeners}
      plannedEx={plannedEx}
      exerciseDef={exerciseDef}
      onChange={(updated) => onUpdateExercise(currentDay, index, updated)}
      onDelete={() => onDeleteExercise(currentDay, index)}
      simulation={simulation}
      onMouseEnter={onHoverEnter}
      onMouseLeave={onHoverLeave}
      isSelected={isSelected}
      onSelect={onSelect}
    />
  );
});
