import React from 'react';
import { WeeklyBlueprint, PlannedExercise } from '@/lib/calculations';
import ExerciseCard from './ExerciseCard';

interface SequencerProps {
  blueprint: WeeklyBlueprint;
  toggledDays: { [day: string]: boolean };
  onUpdateExercise: (day: string, index: number, updatedEx: PlannedExercise) => void;
  onDeleteExercise: (day: string, index: number) => void;
  onClearDay: (day: string) => void;
  onUpdateToggledDays: (updated: { [day: string]: boolean }) => void;
}

const DAYS_OF_WEEK = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

export default function Sequencer({
  blueprint,
  toggledDays,
  onUpdateExercise,
  onDeleteExercise,
  onClearDay,
  onUpdateToggledDays
}: SequencerProps) {

  const handleToggleDay = (day: string) => {
    onUpdateToggledDays({
      ...toggledDays,
      [day]: !toggledDays[day]
    });
  };

  const handleClearDayConfirm = (day: string) => {
    if (confirm(`Voulez-vous vider la séance de ${day} ?`)) {
      onClearDay(day);
    }
  };

  return (
    <div className="w-full overflow-x-auto pb-4 scrollbar-thin select-none">
      <div className="flex gap-4 min-w-[1200px] p-1">
        {DAYS_OF_WEEK.map((day) => {
          const exercises = blueprint[day] || [];
          const isDayActive = toggledDays[day] !== false;

          return (
            <div
              key={day}
              className={`flex-1 min-w-[220px] rounded-xl border border-zinc-900 bg-zinc-950/40 p-3 flex flex-col transition-all duration-300 ${
                isDayActive
                  ? 'border-zinc-850 hover:border-zinc-800'
                  : 'border-zinc-950/10 bg-zinc-950/10 opacity-40'
              }`}
            >
              {/* Day Header */}
              <div className="flex items-center justify-between gap-1 pb-2 border-b border-zinc-900">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isDayActive}
                    onChange={() => handleToggleDay(day)}
                    className="rounded border-zinc-800 bg-zinc-950 text-emerald-500 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                    title={isDayActive ? "Désactiver le jour" : "Activer le jour"}
                  />
                  <span className="font-bold text-sm text-white tracking-wide">{day}</span>
                </div>
                
                {exercises.length > 0 && isDayActive && (
                  <button
                    onClick={() => handleClearDayConfirm(day)}
                    className="text-[10px] text-zinc-500 hover:text-red-400 font-medium px-1.5 py-0.5 rounded hover:bg-zinc-900 transition-colors"
                  >
                    Vider
                  </button>
                )}
              </div>

              {/* Exercises Stack */}
              <div className="mt-3 flex-1 space-y-3 min-h-[160px] flex flex-col justify-start">
                {exercises.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-zinc-900 rounded-lg p-4 text-center">
                    <span className="text-[10px] text-zinc-600 block">Repos</span>
                    <span className="text-[9px] text-zinc-700 mt-1 max-w-[130px] leading-tight">
                      Glissez ou cliquez sur un exercice dans la bibliothèque
                    </span>
                  </div>
                ) : (
                  exercises.map((plannedEx, index) => (
                    <ExerciseCard
                      key={plannedEx.id}
                      plannedEx={plannedEx}
                      onChange={(updated) => onUpdateExercise(day, index, updated)}
                      onDelete={() => onDeleteExercise(day, index)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
