import { PlannedSet, Exercise, UserProfile, UserPRs } from '../../types';

export function estimate1RM(weight: number, reps: number, rpe: number): number {
  if (reps <= 0 || weight < 0) return 0;
  const rpeDiff = 10 - Math.min(10, Math.max(0, rpe));
  const effectiveReps = reps + rpeDiff;
  
  if (effectiveReps <= 1) return weight;
  
  if (effectiveReps > 10) {
    const denom = 1.0278 - (0.0278 * effectiveReps);
    return weight / Math.max(0.1, denom);
  }
  
  return weight * (1 + effectiveReps / 30);
}

export function getApplicable1RM(exerciseId: string, userPrs: UserPRs, weight: number, reps: number, rpe: number): number {
  if (exerciseId === 'squat') return userPrs.squat || estimate1RM(weight, reps, rpe);
  if (exerciseId === 'bench_press') return userPrs.bench || estimate1RM(weight, reps, rpe);
  if (exerciseId === 'deadlift') return userPrs.deadlift || estimate1RM(weight, reps, rpe);
  if (exerciseId === 'ohp') return userPrs.ohp || estimate1RM(weight, reps, rpe);
  return estimate1RM(weight, reps, rpe);
}

export function calculateSetImpact(
  set: PlannedSet,
  exercise: Exercise,
  profile: UserProfile,
  isBeginner: boolean = false
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
  if (pr > 0) intensity = (effectiveWeight / pr) * 100;
  intensity = Math.min(99, Math.max(10, intensity));

  const clampedRpe = isBeginner ? Math.min(8, safeRpe) : Math.min(10, Math.max(5, safeRpe));
  const rpeFactor = Math.pow(1.35, clampedRpe - 10);
  const inolIntensity = Math.min(95, Math.max(10, intensity));
  const baseInol = safeReps / (100 - inolIntensity);
  let totalInol = baseInol * rpeFactor * safeSeries;

  if (isBeginner) totalInol *= 1.2;

  const weightRatio = effectiveWeight / safePdc;
  let sncMultiplier = exercise.tier_snc === 1 ? 1.0 : (exercise.tier_snc === 2 ? 0.5 : 0.05);
  if (exercise.id === 'deadlift') sncMultiplier *= 1.4;

  const sncPoints = weightRatio * sncMultiplier * rpeFactor * safeSeries * 1.2;
  return { inol: totalInol, sncPoints };
}
