import { PlannedSet, Exercise, UserProfile, UserPRs } from '../../types';
import { BiomechanicsConfig } from '../config';

export function estimate1RM(weight: number, reps: number, rpe: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  // RIR = 10 - RPE. 
  // Effective reps = reps actually done + reps in reserve
  const rir = Math.max(0, 10 - rpe);
  const effectiveReps = reps + rir;
  
  // Epley Formula: 1RM = weight * (1 + reps / 30)
  return weight * (1 + effectiveReps / 30);
}

export function getApplicable1RM(exerciseId: string, userPrs: UserPRs, weight: number, reps: number, rpe: number): number {
  if (exerciseId === 'squat' && userPrs.squat) return Math.max(userPrs.squat, estimate1RM(weight, reps, rpe));
  if (exerciseId === 'bench_press' && userPrs.bench) return Math.max(userPrs.bench, estimate1RM(weight, reps, rpe));
  if (exerciseId === 'deadlift' && userPrs.deadlift) return Math.max(userPrs.deadlift, estimate1RM(weight, reps, rpe));
  if (exerciseId === 'ohp' && userPrs.ohp) return Math.max(userPrs.ohp, estimate1RM(weight, reps, rpe));
  return estimate1RM(weight, reps, rpe);
}

export function calculateSetImpact(
  set: PlannedSet,
  exercise: Exercise,
  profile: UserProfile,
  config: BiomechanicsConfig,
  currentMuscleFatigue: number = 0
): { inol: number; sncPoints: number } {
  if (!set.active || set.series <= 0 || set.reps <= 0) {
    return { inol: 0, sncPoints: 0 };
  }

  const safeSeries = Math.max(1, Math.min(20, Math.floor(set.series)));
  const safeReps   = Math.max(1, Math.min(100, Math.floor(set.reps)));
  const safePoids  = Math.max(0, Math.min(1000, set.poids));
  const safeRpe    = Math.max(1, Math.min(10, set.rpe));
  const safePdc    = Math.max(30, Math.min(300, profile.pdc || 75));

  let effectiveWeight = safePoids;
  if (exercise.equipment === 'pdc') {
    const bodyweightContribution = (exercise.id === 'pull_ups' || exercise.id === 'dips') ? 0.90 : 0.65;
    effectiveWeight = safePoids + (safePdc * bodyweightContribution);
  }

  const pr = getApplicable1RM(exercise.id, profile.prs, effectiveWeight, safeReps, safeRpe);
  let intensity = 70;
  if (pr > 0) {
    intensity = (effectiveWeight / pr) * 100;
  }
  // Clamp intensity to realistic bounds for INOL
  intensity = Math.min(99.9, Math.max(30, intensity));

  // True Prilepin/Hristov INOL formula: sets * reps / (100 - intensity)
  // Example: 3 sets of 5 at 80% = 15 / 20 = 0.75 INOL
  const baseInol = (safeSeries * safeReps) / (100 - intensity);
  
  // Beginners get a multiplier to reflect lower adaptation capacity
  let totalInol = baseInol;
  if (profile.isBeginner) totalInol *= 1.2;

  // CNS impact uses actual weight relative to bodyweight, tier, and RPE exponential scaling
  const weightRatio = effectiveWeight / safePdc;
  let sncTierMultiplier = exercise.tier_snc === 1 ? 1.0 : (exercise.tier_snc === 2 ? 0.5 : 0.05);
  if (exercise.id === 'deadlift') sncTierMultiplier *= 1.4;

  const rpeStressFactor = Math.pow(1.35, safeRpe - 10);
  
  // CNS Resilience injected from ML-ready config
  let sncPoints = (weightRatio * sncTierMultiplier * rpeStressFactor * safeSeries) / config.cnsResilience;
  
  // GOUVERNEUR CENTRAL : Si le muscle principal est déjà détruit (Fatigue > 2.0),
  // le corps bride le recrutement des fibres et le système nerveux central doit 
  // forcer exponentiellement plus pour générer la même force.
  if (currentMuscleFatigue > 2.0) {
    sncPoints *= 1.0 + (currentMuscleFatigue - 2.0) * 0.5; // +50% de coût SNC par point de fatigue au-dessus de 2.0
  }
  
  return { inol: totalInol, sncPoints };
}
