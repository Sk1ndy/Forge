import { loadLatestBlueprint, createWorkoutSession, loadExercises, syncAll } from '../lib/supabase';
import { useWorkoutStore } from '../stores/workout.store';
import { WeeklyBlueprint, Exercise, PlannedExercise } from '@forge/shared';

/**
 * WorkoutService - Service applicatif de gestion des entraînements de Forge Mobile.
 * Encapsule toute la logique d'interrogation de l'infrastructure SQLite/Supabase
 * et le pilotage du store réactif Zustand.
 */
export const WorkoutService = {
  /**
   * Récupère le dernier programme (Blueprint) de l'utilisateur.
   * Utilise le cache local persistant s'il n'y a pas de réseau.
   */
  getLatestBlueprint: async (): Promise<{ id: string; name: string; blueprint: WeeklyBlueprint } | null> => {
    try {
      return await loadLatestBlueprint();
    } catch (e) {
      console.error('WorkoutService: Failed to load blueprint', e);
      return null;
    }
  },

  /**
   * Démarre une nouvelle séance d'entraînement.
   * Initialise le store Zustand et crée l'enregistrement en BDD locale/distante.
   */
  startWorkout: async (
    day: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun',
    blueprintId?: string,
    plannedExercises: PlannedExercise[] = []
  ): Promise<string | null> => {
    try {
      // 1. Crée la session d'entraînement (génère un UUID local/distant)
      const sessionId = await createWorkoutSession(blueprintId);
      
      if (!sessionId) {
        throw new Error("Impossible de générer l'ID de session d'entraînement.");
      }

      // 2. Démarre la session dans le store global réactif Zustand
      useWorkoutStore.getState().startSession(sessionId, day, plannedExercises);
      
      return sessionId;
    } catch (e) {
      console.error('WorkoutService: Failed to start workout', e);
      return null;
    }
  },

  /**
   * Termine la séance d'entraînement en cours.
   * Nettoie le store Zustand et déclenche une synchronisation passive.
   */
  endWorkout: async (): Promise<void> => {
    try {
      // 1. Vide le store d'entraînement actif
      useWorkoutStore.getState().endSession();

      // 2. Force une tentative de synchronisation complète stockée en local SQLite
      // vers Supabase de manière non bloquante.
      syncAll().catch((err) => {
        console.warn('WorkoutService: Passive background sync failed', err);
      });
    } catch (e) {
      console.error('WorkoutService: Failed to end workout', e);
    }
  },

  /**
   * Récupère tous les exercices configurés dans le système.
   * Fallback automatique sur la bibliothèque statique locale si hors-ligne.
   */
  getExercises: async (): Promise<Exercise[]> => {
    try {
      return await loadExercises();
    } catch (e) {
      console.error('WorkoutService: Failed to load exercises', e);
      return [];
    }
  },

  /**
   * Déclenche manuellement la synchronisation des données locales SQLite vers Supabase.
   */
  syncLogs: async (): Promise<void> => {
    try {
      await syncAll();
    } catch (e) {
      console.error('WorkoutService: Sync failed', e);
    }
  }
};
