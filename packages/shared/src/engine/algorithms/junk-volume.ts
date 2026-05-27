import { MuscleId, MuscleStatus } from '../../types';
import { MUSCLE_DETAILS } from '../../constants';

export function calculateJunkVolumeAlerts(
  dailyInol: Record<string, number>, 
  finalMuscles: Record<MuscleId, MuscleStatus | undefined>
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
