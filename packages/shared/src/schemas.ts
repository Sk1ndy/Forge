import { z } from 'zod';

// ─── Muscle and Basic Types ─────────────────────────────────────────────────
export const MuscleIdSchema = z.enum([
  'abs', 'biceps', 'calves', 'chest', 'deltoids', 
  'feet', 'forearm', 'gluteal', 'hamstring', 'hands', 
  'head', 'knees', 'lowerBack', 'obliques', 'quadriceps', 
  'tibialis', 'trapezius', 'triceps', 'upperBack', 
  'rotatorCuff', 'serratus', 'rhomboids',
  'ankles', 'adductors', 'neck', 'hipFlexors', 
  'upperChest', 'lowerChest', 'innerQuad', 'outerQuad', 
  'upperAbs', 'lowerAbs', 'frontDeltoid', 'rearDeltoid', 
  'upperTrapezius', 'lowerTrapezius'
]);
export type MuscleId = z.infer<typeof MuscleIdSchema>;

export const MuscleStatusTokenSchema = z.enum(['REST', 'OPTIMAL', 'OVERLOAD', 'DANGER']);
export type MuscleStatusToken = z.infer<typeof MuscleStatusTokenSchema>;

// ─── User Profile ───────────────────────────────────────────────────────────
export const UserPRsSchema = z.object({
  squat:    z.number({ invalid_type_error: "Le squat doit être un nombre" }).min(0).max(1500),
  bench:    z.number({ invalid_type_error: "Le bench doit être un nombre" }).min(0).max(1000),
  deadlift: z.number({ invalid_type_error: "Le deadlift doit être un nombre" }).min(0).max(2000),
  ohp:      z.number({ invalid_type_error: "L'OHP doit être un nombre" }).min(0).max(500),
});
export type UserPRs = z.infer<typeof UserPRsSchema>;

export const UserProfileSchema = z.object({
  pdc:           z.number({ required_error: "Le Poids de Corps est requis" }).min(30).max(300),
  prs:           UserPRsSchema,
  maxSnc:        z.number().min(1).max(100),
  isBeginner:    z.boolean().optional(),
  age:           z.number().int().min(14).max(100).optional(),
  sleepHours:    z.number().min(0).max(24).optional(),
  dailyVFC:      z.number().min(0).max(200).optional(), // Variabilité de la Fréquence Cardiaque (en ms)
  caloricStatus: z.enum(['deficit', 'maintenance', 'surplus']).optional(),
  stressLevel:   z.enum(['low', 'moderate', 'high']).optional(),
});
export type UserProfile = z.infer<typeof UserProfileSchema>;

// ─── Exercises ──────────────────────────────────────────────────────────────
export const ExerciseSchema = z.object({
  id:                  z.string(),
  nom:                 z.string(),
  tier_snc:            z.union([z.literal(1), z.literal(2), z.literal(3)]),
  muscle_primaire:     MuscleIdSchema,
  muscles_secondaires: z.array(MuscleIdSchema),
  equipment:           z.enum(['poids_libre', 'machine', 'pdc']),
  ppl_category:        z.enum(['push', 'pull', 'legs', 'core', 'none']),
  tension_matrix:      z.record(z.string(), z.number()).optional(),
});
export type Exercise = z.infer<typeof ExerciseSchema>;

// ─── Blueprints & Planning ──────────────────────────────────────────────────
export const PlannedSetSchema = z.object({
  series: z.number({ invalid_type_error: "Séries doit être un nombre" }).int().min(1, "Minimum 1 série").max(20, "Maximum 20 séries"),
  reps:   z.number({ invalid_type_error: "Reps doit être un nombre" }).int().min(1, "Minimum 1 rep").max(100, "Maximum 100 reps"),
  poids:  z.number({ invalid_type_error: "Le poids doit être un nombre" }).min(0, "Le poids ne peut être négatif").max(1000, "Poids irréaliste"),
  rpe:    z.number({ invalid_type_error: "Le RPE doit être un nombre" }).min(1, "RPE min 1").max(10, "RPE max 10"),
  active: z.boolean()
});
export type PlannedSet = z.infer<typeof PlannedSetSchema>;

export const PlannedExerciseSchema = z.object({
  id:         z.string(),
  exerciseId: z.string(),
  sets:       z.array(PlannedSetSchema),
  active:     z.boolean()
});
export type PlannedExercise = z.infer<typeof PlannedExerciseSchema>;

export const WeeklyBlueprintSchema = z.record(
  z.enum(['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']),
  z.array(PlannedExerciseSchema)
);
export type WeeklyBlueprint = z.infer<typeof WeeklyBlueprintSchema>;

// ─── Engine & Simulation ────────────────────────────────────────────────────
export const MuscleStatusSchema = z.object({
  name:              z.string(),
  inol:              z.number(),
  sets:              z.number(),
  color:             z.enum(['grey', 'green', 'orange', 'red']),
  statusLabel:       MuscleStatusTokenSchema,
  contributors:      z.array(z.object({ nom: z.string(), percentage: z.number() })),
  remainingCapacity: z.number(),
  jointStress:       z.number(),
  readiness:         z.number(),
  fatigueHistory:    z.array(z.number()).optional(),
  uniqueSets:        z.custom<Set<string>>((val) => val instanceof Set).optional(),
});
export type MuscleStatus = z.infer<typeof MuscleStatusSchema>;

// ... (We keep other complex simulation output types in types.ts since they are mostly read-only outputs from engine.ts)

// ─── Logs & Sessions (Work Mode) ────────────────────────────────────────────
export const ExerciseLogSchema = z.object({
  id:             z.string().optional(),
  session_id:     z.string().optional(),
  user_id:        z.string().optional(),
  exercise_id:    z.string().min(1).max(100).regex(/^[a-z_]+$/, "L'ID de l'exercice doit être en snake_case"),
  day:            z.enum(['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']),
  week:           z.union([z.literal(1), z.literal(2)]).default(1).optional(),
  set_index:      z.number().int().min(0).max(50),
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
export type ExerciseLog = z.infer<typeof ExerciseLogSchema>;

export const WorkoutSessionSchema = z.object({
  id:            z.string().optional(),
  user_id:       z.string().optional(),
  date:          z.string().optional(),
  blueprint_id:  z.string().optional(),
  exercise_data: z.record(z.string(), z.unknown()).optional(),
  total_tonnage: z.number().optional()
});
export type WorkoutSession = z.infer<typeof WorkoutSessionSchema>;
