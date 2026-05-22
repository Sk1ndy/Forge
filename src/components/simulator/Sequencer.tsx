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
    <div className="w-full h-full overflow-x-auto scrollbar-thin select-none">
      <div className="flex gap-3 min-w-[980px] h-full p-1 pb-2">
        {DAYS_OF_WEEK.map((day) => {
          const exercises = blueprint[day] || [];
          const isDayActive = toggledDays[day] !== false;

          return (
            <div
              key={day}
              className={`flex-1 min-w-[150px] max-w-[200px] rounded-xl border border-zinc-900 bg-zinc-950/40 p-2.5 flex flex-col transition-all duration-300 ${
                isDayActive
                  ? 'border-zinc-850 hover:border-zinc-800'
                  : 'border-zinc-950/10 bg-zinc-950/10 opacity-40'
              }`}
            >
              {/* Day Header */}
              <div className="flex items-center justify-between gap-1 pb-2 border-b border-zinc-900 shrink-0">
                <div className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={isDayActive}
                    onChange={() => handleToggleDay(day)}
                    className="rounded border-zinc-800 bg-zinc-950 text-emerald-500 focus:ring-emerald-500 h-3.5 w-3.5 cursor-pointer"
                    title={isDayActive ? "Désactiver le jour" : "Activer le jour"}
                  />
                  <span className="font-bold text-xs text-white tracking-wide">{day}</span>
                </div>
                
                {exercises.length > 0 && isDayActive && (
                  <button
                    onClick={() => handleClearDayConfirm(day)}
                    className="text-[9px] text-zinc-500 hover:text-red-400 font-medium px-1 py-0.5 rounded hover:bg-zinc-900 transition-colors"
                  >
                    Vider
                  </button>
                )}
              </div>

              {/* Exercises Stack — scrollable internally */}
              <div className="mt-2 flex-1 overflow-y-auto scrollbar-thin space-y-2 min-h-0">
                {exercises.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center border border-dashed border-zinc-900 rounded-lg p-3 text-center">
                    <span className="text-[10px] text-zinc-600 block">Repos</span>
                    <span className="text-[9px] text-zinc-700 mt-1 max-w-[110px] leading-tight">
                      Cliquez sur un exercice dans la bibliothèque
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
