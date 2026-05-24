import { z } from 'zod';

export type MuscleId =
  | 'abs' | 'biceps' | 'calves' | 'chest' | 'deltoids' 
  | 'feet' | 'forearm' | 'gluteal' | 'hamstring' | 'hands' 
  | 'head' | 'knees' | 'lowerBack' | 'obliques' | 'quadriceps' 
  | 'tibialis' | 'trapezius' | 'triceps' | 'upperBack' 
  | 'rotatorCuff' | 'serratus' | 'rhomboids'
  | 'ankles' | 'adductors' | 'neck' | 'hipFlexors' 
  | 'upperChest' | 'lowerChest' | 'innerQuad' | 'outerQuad' 
  | 'upperAbs' | 'lowerAbs' | 'frontDeltoid' | 'rearDeltoid' 
  | 'upperTrapezius' | 'lowerTrapezius';

export interface Exercise {
  id: string;
  nom: string;
  tier_snc: 1 | 2 | 3;
  muscle_primaire: MuscleId;
  muscles_secondaires: MuscleId[];
  equipment: 'poids_libre' | 'machine' | 'pdc';
  ppl_category: 'push' | 'pull' | 'legs' | 'core' | 'none';
  tension_matrix?: Record<string, number>;
}

export interface UserPRs {
  squat: number;
  bench: number;
  deadlift: number;
  ohp: number;
}

export interface UserProfile {
  pdc: number; // Poids de Corps
  prs: UserPRs;
  maxSnc: number; // Capacité max SNC
  age?: number;
  sleepHours?: number;      // Heures de sommeil moyennes
  caloricStatus?: 'deficit' | 'maintenance' | 'surplus';
  stressLevel?: 'low' | 'moderate' | 'high';
}

export interface PlannedSet {
  series: number;
  reps: number;
  poids: number;
  rpe: number;
  active: boolean;
}

export const PlannedSetSchema = z.object({
  series: z.number().int().positive(),
  reps: z.number().int().positive(),
  poids: z.number().nonnegative(),
  rpe: z.number().min(1).max(10),
  active: z.boolean()
});

export interface PlannedExercise {
  id: string; // ID unique de l'instance planifiée
  exerciseId: string; // ID de l'exercice dans la bibliothèque
  sets: PlannedSet[];
  active: boolean;
}

export interface WeeklyBlueprint {
  [day: string]: PlannedExercise[]; // ex: { 'Lundi': [...], 'Mardi': [...] }
}

export interface MuscleStatus {
  name: string;
  inol: number; // Modélise l'accumulation cumulée de fatigue/volume
  sets: number;
  color: 'grey' | 'green' | 'orange' | 'red';
  statusLabel: string;
  contributors: { nom: string; percentage: number }[];
  remainingCapacity: number; // Valeur de 0 à 1 représentant le budget d'entraînement restant
  jointStress: number; // Jauge de stress articulaire/tendineux
  readiness: number; // État de forme net (fitness - fatigue)
  fatigueHistory?: number[]; // Historique de fatigue sur les 7 derniers jours
  uniqueSets?: Set<string>; // IDs uniques des séries pour éviter le double comptage
}

export interface WeeklyMacro {
  peakFatigue: Record<string, { value: number; day: string }>;
  weeklyEffectiveSets: Record<string, number>;
  pushPullRatio: { push: number; pull: number };
  axialSncLoad: number;
  traumaAlerts: string[];
}

export interface WeeklyTrauma {
  muscleName: string;
  peakInol: number;
  dayIndex: number; // 0 = Lundi … 6 = Dimanche
}

export interface SimulationResult {
  muscles: { [muscleId in MuscleId]?: MuscleStatus };
  sncScore: number;
  sncPercentage: number;
  cnsFailure: boolean;
  junkVolumeAlerts: string[]; // Alertes de junk volume basées sur l'INOL de la séance
  globalWorkCapacity: number; // Capacité de travail systémique restante (0-100)
  topSurcharged: MuscleStatus[];
  topNeglected: MuscleStatus[];
  pushPullLegsRatio: { push: number; pull: number; legs: number };
  weeklyMacro: WeeklyMacro;
  weeklyTraumas: WeeklyTrauma[];
}
