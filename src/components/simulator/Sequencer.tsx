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
}

const DAYS_OF_WEEK = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

export default function Sequencer({
  blueprint,
  toggledDays,
  onUpdateExercise,
  onDeleteExercise,
  onClearDay,
  onUpdateToggledDays,
  selectedDay,
  onSelectDay,
  onAddExercise,
  simulation,
  onReorderExercises,
  exercises,
  onLoadTemplate,
  onHoverExerciseChange
}: SequencerProps) {
  const [isDragOver, setIsDragOver] = React.useState(false);

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
    <div className="w-full h-full flex flex-col lg:flex-row gap-4 select-none min-h-0">
      
      {/* 1. LEFT RAIL: Day Selector (Vertical scroll on desktop, horizontal on mobile) */}
      <div className="w-full lg:w-[220px] flex flex-row lg:flex-col gap-2 shrink-0 overflow-x-auto lg:overflow-y-auto scrollbar-thin pb-2 lg:pb-0">
        {DAYS_OF_WEEK.map((day) => {
          const exercises = blueprint[day] || [];
          const isDayActive = toggledDays[day] !== false;
          const isSelected = currentDay === day;
          const summary = getDaySummary(day);

          return (
            <div
              key={day}
              onClick={() => onSelectDay?.(day)}
              className={`flex-1 lg:flex-initial min-w-[120px] lg:min-w-0 rounded-xl border p-2.5 flex flex-col lg:flex-row lg:items-center justify-between transition-all duration-300 cursor-pointer ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-950/10 ring-1 ring-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.12)]'
                  : isDayActive
                  ? 'border-zinc-900 bg-zinc-950/40 hover:border-zinc-800'
                  : 'border-zinc-950/10 bg-zinc-950/10 opacity-40 hover:opacity-60'
              }`}
            >
              {/* Left Side: Checkbox & Titles */}
              <div className="flex items-center gap-2 min-w-0">
                <input
                  type="checkbox"
                  checked={isDayActive}
                  onChange={(e) => handleToggleDay(day, e as unknown as React.MouseEvent)}
                  className="rounded border-zinc-800 bg-zinc-950 text-emerald-500 focus:ring-emerald-500 h-3.5 w-3.5 cursor-pointer shrink-0"
                  onClick={(e) => e.stopPropagation()} // Avoid selection when checking
                  title={isDayActive ? "Désactiver le jour" : "Activer le jour"}
                />
                
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-xs text-white tracking-wide truncate">{day}</span>
                  <span className={`text-[9px] font-medium leading-none mt-0.5 ${
                    summary.isRest ? 'text-zinc-500' : 'text-emerald-400'
                  }`}>
                    {summary.text}
                    {!summary.isRest && <span className="text-zinc-500 ml-1">· {summary.subtext}</span>}
                  </span>
                </div>
              </div>

              {/* Right Side: Clear Button */}
              {exercises.length > 0 && isDayActive && (
                <button
                  onClick={(e) => handleClearDayConfirm(day, e)}
                  className="hidden lg:block text-[9px] text-zinc-500 hover:text-red-400 font-medium px-1.5 py-0.5 rounded hover:bg-zinc-900 transition-colors cursor-pointer shrink-0"
                  title="Vider la séance"
                >
                  Vider
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* 2. RIGHT WORKSPACE: Detailed Workout Day Editor */}
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

        {/* Alerte Junk Volume (Surcharge intra-séance basée sur l'intensité) */}
        {(() => {
          const junkAlerts = simulation?.junkVolumeAlerts || [];
          if (junkAlerts.length === 0) return null;
          return (
            <div className="mt-3 p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-400 text-xs flex items-start gap-2.5 shrink-0 animate-pulse">
              <span className="text-sm shrink-0">⚠️</span>
              <div>
                <span className="font-extrabold block">Volume de Séance Inadapté (Junk Volume)</span>
                <span className="text-[10px] text-amber-500/80 leading-normal block mt-0.5">
                  La charge d&apos;entraînement (Intensité + Volume) pour {junkAlerts.join(', ')} sature les récepteurs cellulaires de l&apos;hypertrophie. Ce volume excédentaire est physiologiquement inefficace (&quot;volume poubelle&quot;), ralentit la récupération et fatigue inutilement le SNC.
                </span>
              </div>
            </div>
          );
        })()}

        {/* Exercises Scroll Area */}
        <div className="flex-1 overflow-y-auto scrollbar-thin mt-4 min-h-0 pr-1">
          {isBlueprintEmpty ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-6 overflow-y-auto">
              <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.03)]">
                <svg className="h-8 w-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-zinc-200">Commencez votre programme</h2>
                <p className="text-sm text-zinc-500 mt-2 max-w-md mx-auto">
                  Votre Séquenceur Hebdomadaire est vide. Ajoutez des exercices manuellement depuis la bibliothèque, ou chargez l&apos;un de nos templates pour démarrer immédiatement.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg mt-4">
                <button
                  onClick={() => onLoadTemplate?.(PPL_TEMPLATE)}
                  className="group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 p-5 text-left transition-all hover:border-emerald-500/50"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <h3 className="font-bold text-zinc-200 flex items-center gap-2">
                    <span>🏃</span> PPL Débutant
                  </h3>
                  <p className="text-xs text-zinc-400 mt-2">Push, Pull, Legs sur 6 jours. Idéal pour maximiser l&apos;hypertrophie.</p>
                </button>
                
                <button
                  onClick={() => onLoadTemplate?.(FULL_BODY_TEMPLATE)}
                  className="group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 p-5 text-left transition-all hover:border-blue-500/50"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <h3 className="font-bold text-zinc-200 flex items-center gap-2">
                    <span>🏋️</span> Full Body Force
                  </h3>
                  <p className="text-xs text-zinc-400 mt-2">Squat, Bench, Deadlift sur 3 jours. Axé sur la progression en force.</p>
                </button>
              </div>
            </div>
          ) : !isCurrentDayActive ? (
            <div className="h-full flex flex-col items-center justify-center border border-dashed border-zinc-900 rounded-xl p-8 text-center max-w-md mx-auto my-6">
              <div className="bg-zinc-900/50 p-3 rounded-full mb-3">
                <svg className="h-6 w-6 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
              <h5 className="font-bold text-sm text-zinc-400">Journée Désactivée</h5>
              <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                Cette journée est ignorée dans la simulation. Cochez &quot;Journée d&apos;entraînement&quot; ci-dessus pour la réactiver et planifier des séances.
              </p>
            </div>
          ) : currentExercises.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center border border-dashed border-zinc-900 rounded-xl p-8 text-center max-w-md mx-auto my-6 bg-emerald-950/5">
              <div className="bg-emerald-950/20 p-3 rounded-full mb-3 border border-emerald-900/10">
                <svg className="h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h5 className="font-bold text-sm text-emerald-400">Récupération Active 🌊</h5>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Aucun exercice planifié. Profitez-en pour dissiper la fatigue avec de la <strong className="text-zinc-300">Récupération Active</strong> (marche, vélo léger, mobilité). Cela augmente le flux sanguin intramusculaire et accélère la reconstruction des tendons.
              </p>
              <p className="text-[11px] text-zinc-500 mt-3 font-semibold text-center leading-normal">
                💡 Cliquez sur un exercice ou glissez-le directement ici pour ajouter une séance.
              </p>
            </div>
          ) : (
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext 
                items={currentExercises.map(ex => ex.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 pb-2">
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
                      />
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>

        {/* Sticky Footer - Jauge de Récupération Globale */}
        <div className="mt-4 pt-3 border-t border-zinc-900 bg-zinc-950/40 rounded-xl p-3.5 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-zinc-800/20">
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-extrabold tracking-wider uppercase text-zinc-500 font-sans">
              Capacité de Récupération Hebdomadaire
            </span>
            <span className={`text-xs font-bold mt-0.5 ${
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
      </div>

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
  onHoverLeave
}: { 
  plannedEx: PlannedExercise, 
  exerciseDef?: Exercise, 
  index: number, 
  currentDay: string, 
  onUpdateExercise: (day: string, idx: number, updated: PlannedExercise) => void, 
  onDeleteExercise: (day: string, idx: number) => void, 
  simulation: SimulationResult,
  onHoverEnter?: () => void,
  onHoverLeave?: () => void
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
    />
  );
});
