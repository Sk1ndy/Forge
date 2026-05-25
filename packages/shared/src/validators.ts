import { z } from 'zod';
import type { ExerciseLog } from './types';

// ─── Séries : validation avant entrée dans le moteur ─────────────────────────
export const PlannedSetEngineSchema = z.object({
  series:  z.number().int().min(1).max(20),
  reps:    z.number().int().min(1).max(100),
  poids:   z.number().min(0).max(1000),
  rpe:     z.number().min(1).max(10),
  active:  z.boolean(),
});

// ─── Profil utilisateur : validation avant calcul de fatigue ─────────────────
export const UserProfileEngineSchema = z.object({
  pdc:           z.number().min(30).max(300),
  maxSnc:        z.number().min(1).max(100),
  isBeginner:    z.boolean().optional(),
  age:           z.number().int().min(14).max(100).optional(),
  sleepHours:    z.number().min(0).max(24).optional(),
  caloricStatus: z.enum(['deficit', 'maintenance', 'surplus']).optional(),
  stressLevel:   z.enum(['low', 'moderate', 'high']).optional(),
  prs: z.object({
    squat:    z.number().min(0).max(1500),
    bench:    z.number().min(0).max(1000),
    deadlift: z.number().min(0).max(2000),
    ohp:      z.number().min(0).max(500),
  }),
});

// ─── Logs réels (mobile) : validation avant injection dans la simulation ──────
export const ExerciseLogEngineSchema = z.object({
  id:             z.string().optional(),
  session_id:     z.string().optional(),
  exercise_id:    z.string().min(1).max(100).regex(/^[a-z_]+$/, 'ID doit être snake_case'),
  day:            z.enum(['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']),
  set_index:      z.number().int().min(0).max(50),
  week:           z.union([z.literal(1), z.literal(2)]).default(1),
  planned_weight: z.number().min(0).max(1000).optional(),
  planned_reps:   z.number().int().min(0).max(100).optional(),
  planned_rpe:    z.number().min(1).max(10).optional(),
  actual_weight:  z.number().min(0).max(1000).optional(),
  actual_reps:    z.number().int().min(0).max(100).optional(),
  actual_rpe:     z.number().min(1).max(10).optional(),
  is_completed:   z.boolean().optional(),
  skipped_reason: z.enum(['fatigue', 'injury', 'time', 'form', 'other']).optional().nullable(),
  created_at:     z.string().optional(),
});

/**
 * Filtre et valide un tableau de logs bruts avant injection dans le moteur.
 * Les logs invalides sont silencieusement ignorés (logged en dev).
 */
export function sanitizeLogs(rawLogs: unknown[]): ExerciseLog[] {
  return rawLogs.reduce<ExerciseLog[]>((acc, log) => {
    const result = ExerciseLogEngineSchema.safeParse(log);
    if (result.success) {
      acc.push(result.data as ExerciseLog);
    } else if (process.env.NODE_ENV === 'development') {
      console.warn('[FORGE ENGINE] Log rejeté (validation):', result.error.flatten());
    }
    return acc;
  }, []);
}
