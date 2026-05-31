import { z } from 'zod';

// ─── Muscle and Basic Types ─────────────────────────────────────────────────
export const MuscleIdSchema = z.enum([
  'abs', 'biceps', 'calves', 'chest', 'deltoids', 
  'forearm', 'gluteal', 'hamstring', 
  'lowerBack', 'obliques', 'quadriceps', 
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
  bench:    z.number({ invalid_type_error: "Le bench doit être un nombre" }).min(0).max(2500),
  deadlift: z.number({ invalid_type_error: "Le deadlift doit être un nombre" }).min(0).max(2000),
  ohp:      z.number({ invalid_type_error: "L'OHP doit être un nombre" }).min(0).max(500),
}).partial();
export type UserPRs = z.infer<typeof UserPRsSchema>;

export const UserBiometricConstantsSchema = z.object({
  baseTauMetabolic: z.number().min(0.1).max(5.0).default(1.0),
  baseTauDamage: z.number().min(0.5).max(10.0).default(3.0),
  baseTauChronicSnc: z.number().min(5.0).max(60.0).default(21.0),
  baseTauFitness: z.number().min(10.0).max(120.0).default(45.0),
  k1: z.number().default(1.0),
  k2: z.number().default(2.0),
  cnsResilience: z.number().min(0.1).max(3.0).default(1.0)
});
export type UserBiometricConstants = z.infer<typeof UserBiometricConstantsSchema>;


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
  biometricConstants: UserBiometricConstantsSchema.optional()
});
export type UserProfile = z.infer<typeof UserProfileSchema>;

export const OnboardingPayloadSchema = z.object({
  pdc: z.number().min(30).max(300),
  gender: z.enum(['male', 'female']).default('male'),
  experience_level: z.enum(['beginner', 'intermediate', 'advanced']),
  known_prs: UserPRsSchema.optional(),
  recent_lifts: z.array(z.object({
    exo: z.enum([
      'squat', 'bench', 'deadlift', 'ohp',
      'leg_press', 'chest_press', 'lat_pulldown'
    ]),
    poids: z.number(),
    reps: z.number()
  })).optional()
});
export type OnboardingPayload = z.infer<typeof OnboardingPayloadSchema>;

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
  series: z.number({ invalid_type_error: "Séries doit être un nombre" }).int().min(1, "Minimum 1 série").max(50, "Maximum 50 séries"),
  reps:   z.number({ invalid_type_error: "Reps doit être un nombre" }).int().min(1, "Minimum 1 rep").max(100, "Maximum 100 reps"),
  poids:  z.number({ invalid_type_error: "Le poids doit être un nombre" }).min(0, "Le poids ne peut être négatif").max(2500, "Poids irréaliste"),
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
  z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']),
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
  fitnessHistory:    z.array(z.number()).optional(), // Courbe de fitness Banister [0..N jours]
});
export type MuscleStatus = z.infer<typeof MuscleStatusSchema>;

// ... (We keep other complex simulation output types in types.ts since they are mostly read-only outputs from engine.ts)

// ─── Logs & Sessions (Work Mode) ────────────────────────────────────────────
export const ExerciseLogSchema = z.object({
  id:             z.string().optional(),
  session_id:     z.string().optional(),
  user_id:        z.string().optional(),
  exercise_id:    z.string().min(1).max(100).regex(/^[a-z_]+$/, "L'ID de l'exercice doit être en snake_case"),
  day:            z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']),
  week:           z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6)]).default(1).optional(),
  set_index:      z.number().int().min(0).max(50),
  planned_weight: z.number().min(0).max(2500).optional(),
  planned_reps:   z.number().int().min(0).max(100).optional(),
  planned_rpe:    z.number().min(1).max(10).optional(),
  actual_weight:  z.number().min(0).max(2500).optional(),
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

// ─── Biometric Constants (Moved up) ──────────────────────────────────────────
// ─── Telemetry Data (Raw Wearables input) ────────────────────────────────────
export const RawWearableDataSchema = z.object({
  source: z.enum(['apple', 'garmin', 'whoop', 'manual']),
  timestamp: z.string().datetime().optional(), // ISO string
  
  hrv_ms: z.number().min(0).max(300).optional(),           // Heart Rate Variability
  resting_hr: z.number().min(30).max(150).optional(),      // Resting Heart Rate
  
  sleep_total_minutes: z.number().min(0).max(1440).optional(),
  sleep_deep_minutes: z.number().min(0).max(720).optional(),
  sleep_rem_minutes: z.number().min(0).max(720).optional(),
  
  readiness_score: z.number().min(0).max(100).optional(),  // e.g. Garmin Body Battery or Manual input
  stress_score: z.number().min(0).max(100).optional()
});
export type RawWearableData = z.infer<typeof RawWearableDataSchema>;

// ─── Normalized Stress Factors (For Engine Consumption) ──────────────────────
export const StressFactorsSchema = z.object({
  recoveryMultiplier: z.number().min(0.1).max(2.0), // 1.0 = normal, > 1.0 = super recup, < 1.0 = danger
  cnsStressDelta: z.number(),                       // Acute CNS impact (positive adds stress, negative removes)
  confidence: z.number().min(0).max(1.0),           // 0.0 to 1.0 depending on data quality
  logs: z.array(z.string())                         // Traceability of adaptation
});
export type StressFactors = z.infer<typeof StressFactorsSchema>;
