import { MuscleId } from '../../types';
import { MUSCLE_DETAILS } from '../../constants';
import { MusclesMap } from '../core/state';

export function calculateInjuryPredictions(
  musclesMap: MusclesMap, 
  weekHitRed: Set<string>, 
  muscleDangerWeeks: Record<string, number>, 
  existingPredictions: string[]
): void {
  Object.keys(musclesMap).forEach(id => {
    if (weekHitRed.has(id)) {
      muscleDangerWeeks[id] = (muscleDangerWeeks[id] || 0) + 1;
      if (muscleDangerWeeks[id] >= 3) {
        if (!existingPredictions.some(p => p.includes(MUSCLE_DETAILS[id as MuscleId] || id))) {
          existingPredictions.push(`Risque de blessure/déchirure très élevé sur : ${MUSCLE_DETAILS[id as MuscleId] || id} (> 3 semaines en zone rouge)`);
        }
      }
    } else {
      muscleDangerWeeks[id] = 0;
    }
  });
}
