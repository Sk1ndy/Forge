import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WeeklyBlueprint, ExerciseLog, PlannedExercise, PlannedSet } from '@forge/shared';
import { saveExerciseLog } from '../lib/supabase';

interface WorkoutSessionState {
  activeSessionId: string | null;
  activeDay: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun' | null;
  activeExercises: PlannedExercise[];
  completedSets: Record<string, boolean[]>; // exerciseId -> array of booleans indicating completed sets
  currentExerciseIndex: number;
  
  // Timer States
  timeLeft: number;
  timerRunning: boolean;
  
  // Metrics calculated locally
  sessionTonnage: number;
  
  // Action triggers
  startSession: (sessionId: string, day: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun', exercises: PlannedExercise[]) => void;
  completeSet: (exerciseId: string, setIndex: number, planned: PlannedSet, actual: { weight: number; reps: number; rpe: number }) => Promise<void>;
  skipSet: (exerciseId: string, setIndex: number, reason: 'fatigue' | 'injury' | 'time' | 'form' | 'other') => Promise<void>;
  endSession: () => void;
  
  // Timer Actions
  setTimeLeft: (time: number | ((prev: number) => number)) => void;
  setTimerRunning: (running: boolean) => void;
  nextExercise: () => void;
  prevExercise: () => void;
}

export const useWorkoutStore = create<WorkoutSessionState>()(
  persist(
    (set, get) => ({
      activeSessionId: null,
      activeDay: null,
      activeExercises: [],
      completedSets: {},
      currentExerciseIndex: 0,
      
      timeLeft: 90,
      timerRunning: false,
      sessionTonnage: 0,

      startSession: (sessionId, day, exercises) => {
        const initialCompletedSets: Record<string, boolean[]> = {};
        exercises.forEach((exo) => {
          initialCompletedSets[exo.id] = new Array(exo.sets.length).fill(false);
        });

        set({
          activeSessionId: sessionId,
          activeDay: day,
          activeExercises: exercises,
          completedSets: initialCompletedSets,
          currentExerciseIndex: 0,
          sessionTonnage: 0,
          timeLeft: 90,
          timerRunning: false,
        });
      },

      completeSet: async (exerciseId, setIndex, planned, actual) => {
        const { activeSessionId, activeDay, completedSets, sessionTonnage } = get();
        if (!activeSessionId || !activeDay) return;

        // 1. Validation de l'état local du set
        const exerciseCompletedSets = [...(completedSets[exerciseId] || [])];
        exerciseCompletedSets[setIndex] = true;

        const newTonnage = sessionTonnage + (actual.weight * actual.reps);

        set({
          completedSets: {
            ...completedSets,
            [exerciseId]: exerciseCompletedSets,
          },
          sessionTonnage: newTonnage,
          timeLeft: 90, // Réinitialise le timer de repos à 90s inter-séries
          timerRunning: true,
        });

        // 2. Formatage du Log brut
        const log: Omit<ExerciseLog, 'id' | 'created_at'> = {
          session_id: activeSessionId,
          exercise_id: exerciseId.toLowerCase().replace(/[^a-z_]/g, '_'), // format snake_case exigé
          day: activeDay,
          week: 1, // par défaut
          set_index: setIndex,
          planned_weight: planned.poids,
          planned_reps: planned.reps,
          planned_rpe: planned.rpe,
          actual_weight: actual.weight,
          actual_reps: actual.reps,
          actual_rpe: actual.rpe,
          is_completed: true,
        };

        // 3. Sauvegarde Offline-First via le connecteur local SQLite
        await saveExerciseLog(log);
      },

      skipSet: async (exerciseId, setIndex, reason) => {
        const { activeSessionId, activeDay, completedSets } = get();
        if (!activeSessionId || !activeDay) return;

        const exerciseCompletedSets = [...(completedSets[exerciseId] || [])];
        exerciseCompletedSets[setIndex] = false; // marqué comme sauté

        set({
          completedSets: {
            ...completedSets,
            [exerciseId]: exerciseCompletedSets,
          },
        });

        const log: Omit<ExerciseLog, 'id' | 'created_at'> = {
          session_id: activeSessionId,
          exercise_id: exerciseId.toLowerCase().replace(/[^a-z_]/g, '_'),
          day: activeDay,
          week: 1,
          set_index: setIndex,
          is_completed: false,
          skipped_reason: reason,
        };

        await saveExerciseLog(log);
      },

      endSession: () => {
        set({
          activeSessionId: null,
          activeDay: null,
          activeExercises: [],
          completedSets: {},
          currentExerciseIndex: 0,
          sessionTonnage: 0,
          timerRunning: false,
        });
      },

      setTimeLeft: (time) => {
        if (typeof time === 'function') {
          set((state) => ({ timeLeft: time(state.timeLeft) }));
        } else {
          set({ timeLeft: time });
        }
      },
      
      setTimerRunning: (running) => set({ timerRunning: running }),

      nextExercise: () => {
        const { currentExerciseIndex, activeExercises } = get();
        if (currentExerciseIndex < activeExercises.length - 1) {
          set({ currentExerciseIndex: currentExerciseIndex + 1 });
        }
      },

      prevExercise: () => {
        const { currentExerciseIndex } = get();
        if (currentExerciseIndex > 0) {
          set({ currentExerciseIndex: currentExerciseIndex - 1 });
        }
      },
    }),
    {
      name: 'forge-workout-session-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
