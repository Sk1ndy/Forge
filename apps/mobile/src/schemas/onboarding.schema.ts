import { z } from 'zod';

export const AnthropometricSchema = z.object({
  gender: z.enum(['male', 'female']),
  age: z.number().min(14, "Âge minimum 14 ans").max(100, "Âge maximum 100 ans"),
  heightCm: z.number().min(100, "Taille minimum 100 cm").max(250, "Taille maximum 250 cm"),
  weightKg: z.number().min(30, "Poids minimum 30 kg").max(300, "Poids maximum 300 kg"),
  femurRatio: z.enum(['short', 'average', 'long']).default('average'),
  armRatio: z.enum(['short', 'average', 'long']).default('average'),
});

export const MuscleMappingSchema = z.object({
  weakPoints: z.array(z.string()).max(5, "Maximum 5 points faibles"),
  strongPoints: z.array(z.string()).max(5, "Maximum 5 points forts"),
});

export const StrengthProfileSchema = z.object({
  experience: z.enum(['beginner', 'intermediate', 'advanced']),
  weeklyFrequency: z.number().min(2, "Minimum 2 séances").max(6, "Maximum 6 séances"),
  squat1RM: z.number().min(0).max(500).default(0),
  bench1RM: z.number().min(0).max(400).default(0),
  deadlift1RM: z.number().min(0).max(600).default(0),
});

export const CompleteOnboardingSchema = z.object({
  anthropometry: AnthropometricSchema,
  muscleMapping: MuscleMappingSchema,
  strengthProfile: StrengthProfileSchema,
});

export type AnthropometricData = z.infer<typeof AnthropometricSchema>;
export type MuscleMappingData = z.infer<typeof MuscleMappingSchema>;
export type StrengthProfileData = z.infer<typeof StrengthProfileSchema>;
export type CompleteOnboardingData = z.infer<typeof CompleteOnboardingSchema>;
