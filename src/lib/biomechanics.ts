import { PlannedSet, Exercise, UserProfile, UserPRs } from './types';

/**
 * Estime le 1RM théorique en utilisant la formule d'Epley modifiée par le RPE.
 */
export function estimate1RM(weight: number, reps: number, rpe: number): number {
  if (reps <= 0) return 0;
  const rpeDiff = 10 - Math.min(10, Math.max(0, rpe));
  const effectiveReps = reps + rpeDiff;
  
  if (effectiveReps <= 1) return weight;
  
  // Formule de Brzycki sécurisée pour les séries longues (> 10 reps) pour éviter la surévaluation d'Epley
  if (effectiveReps > 10) {
    const denom = 1.0278 - (0.0278 * effectiveReps);
    return weight / Math.max(0.1, denom);
  }
  
  return weight * (1 + effectiveReps / 30);
}

/**
 * Détermine le 1RM applicable pour un exercice et un profil donnés
 */
export function getApplicable1RM(exerciseId: string, userPrs: UserPRs, weight: number, reps: number, rpe: number): number {
  if (exerciseId === 'squat') return userPrs.squat || estimate1RM(weight, reps, rpe);
  if (exerciseId === 'bench_press') return userPrs.bench || estimate1RM(weight, reps, rpe);
  if (exerciseId === 'deadlift') return userPrs.deadlift || estimate1RM(weight, reps, rpe);
  if (exerciseId === 'ohp') return userPrs.ohp || estimate1RM(weight, reps, rpe);

  return estimate1RM(weight, reps, rpe);
}

// Fonction de normalisation pour éviter la dérive des virgules flottantes (float drift)
export const normalize = (val: number) => Math.round(val * 10000) / 10000;

/**
 * Calcule l'impact d'une série unique (INOL et SNC) avec la formule exponentielle continue du RPE
 */
export function calculateSetImpact(
  set: PlannedSet,
  exercise: Exercise,
  profile: UserProfile,
  isBeginner: boolean = false
): { inol: number; sncPoints: number } {
  if (!set.active || set.series <= 0 || set.reps <= 0) {
    return { inol: 0, sncPoints: 0 };
  }

  // Intégration de la charge réelle deplacée par le poids de corps (PDC)
  let effectiveWeight = set.poids;
  if (exercise.equipment === 'pdc') {
    const bodyweightContribution = (exercise.id === 'pull_ups' || exercise.id === 'dips') ? 0.90 : 0.65;
    effectiveWeight = set.poids + ((profile.pdc || 75) * bodyweightContribution);
  }

  // 1. Détermination du 1RM de référence
  const pr = getApplicable1RM(exercise.id, profile.prs, effectiveWeight, set.reps, set.rpe);
  
  // 2. Calcul de l'intensité relative (%)
  let intensity = 70;
  if (pr > 0) {
    intensity = (effectiveWeight / pr) * 100;
  }
  intensity = Math.min(99, Math.max(10, intensity));

  // 3. Multiplicateur RPE ajusté (Bride pour les débutants)
  const clampedRpe = isBeginner 
    ? Math.min(8, set.rpe) 
    : Math.min(10, Math.max(5, set.rpe || 8));
    
  const rpeFactor = Math.pow(1.35, clampedRpe - 10);

  // 4. Calcul de l'INOL brut accumulé par cette série
  const inolIntensity = Math.min(95, Math.max(10, intensity));
  const baseInol = set.reps / (100 - inolIntensity);
  let totalInol = baseInol * rpeFactor * set.series;

  // Pénalité articulaire/musculaire pour les débutants (besoin de plus de repos)
  if (isBeginner) {
    totalInol *= 1.2;
  }

  // 5. Calcul de l'impact SNC (Système Nerveux Central)
  const pdc = profile.pdc || 75;
  const weightRatio = effectiveWeight / pdc;
  
  // Fatigue axiale SNC de base : Tier 1 = 100%, Tier 2 = 50%, Tier 3 (isolation) = 5%
  let sncMultiplier = exercise.tier_snc === 1 ? 1.0 : (exercise.tier_snc === 2 ? 0.5 : 0.05);

  // Le "Deadlift Effect" : le soulevé de terre applique un multiplicateur spécifique de 1.4 pour sa fatigue axiale unique.
  if (exercise.id === 'deadlift') {
    sncMultiplier *= 1.4;
  }

  // Formule SNC finale
  const sncPoints = weightRatio * sncMultiplier * rpeFactor * set.series * 1.2;

  return { inol: totalInol, sncPoints };
}
