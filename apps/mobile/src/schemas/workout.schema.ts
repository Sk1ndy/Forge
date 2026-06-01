import { z } from 'zod';

export const ExerciseSetSchema = z.object({
  session_id: z.string().uuid("ID de session invalide."),
  exercise_id: z.string().min(1, "ID d'exercice requis."),
  set_index: z.number().int().nonnegative(),
  planned_weight: z.number().nonnegative(),
  planned_reps: z.number().int().positive(),
  planned_rpe: z.number().min(1).max(10),
  actual_weight: z.number().nonnegative(),
  actual_reps: z.number().int().positive(),
  actual_rpe: z.number().min(1).max(10),
  is_completed: z.boolean().default(true),
  skipped_reason: z.string().optional(),
});

export type ExerciseSetData = z.infer<typeof ExerciseSetSchema>;

export const WorkoutSessionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  blueprint_id: z.string().uuid().optional(),
  name: z.string().min(1),
  day: z.string().default('Lundi'),
  week: z.number().int().positive().default(1),
  created_at: z.string(),
});

export type WorkoutSessionData = z.infer<typeof WorkoutSessionSchema>;
