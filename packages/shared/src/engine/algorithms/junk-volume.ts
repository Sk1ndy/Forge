import { MuscleId, MuscleStatus } from '../../types';
import { MUSCLE_DETAILS } from '../../constants';

export function calculateJunkVolumeAlerts(
  dailyInol: Record<string, number>, 
  finalMuscles: { [key in MuscleId]?: MuscleStatus }
): string[] {
  const alerts: string[] = [];
  Object.entries(dailyInol).sort((a, b) => b[1] - a[1]).forEach(([id, inolScore]) => {
    const isSubMuscle = !['chest', 'quadriceps', 'abs', 'trapezius', 'upperBack', 'frontDeltoid', 'rearDeltoid', 'biceps', 'triceps', 'lowerBack', 'gluteal', 'hamstring', 'calves', 'forearm'].includes(id);
    if (inolScore > 1.5 && finalMuscles[id as MuscleId] && !isSubMuscle) {
      alerts.push(`${MUSCLE_DETAILS[id as MuscleId]} (INOL: ${inolScore.toFixed(1)})`);
    }
  });
  return alerts;
}

/**
 * Applique la loi des rendements décroissants (Junk Volume).
 * Utilise une fonction asymptotique : f(x) = x / (1 + x / K)
 * où K est le volume maximum utile (ex: 2.5 INOL).
 */
export function applyDiminishingReturns(rawLoad: number): number {
  if (rawLoad <= 0) return 0;
  const K = 2.5; // Plafond théorique d'efficacité par jour
  return rawLoad / (1 + rawLoad / K);
}
