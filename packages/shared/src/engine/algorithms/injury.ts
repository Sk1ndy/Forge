import { MuscleId } from '../../types';
import { MUSCLE_DETAILS } from '../../constants';
import { MusclesMap } from '../core/state';

import { calculateACWR } from '../biomechanics/physiology';

export function calculateInjuryPredictions(
  musclesMap: MusclesMap, 
  currentWeek: number,
  existingPredictions: { muscleId: string; acwr: number; code: string }[]
): void {
  // ACWR needs at least 2 weeks of data to be somewhat meaningful, ideally 4.
  if (currentWeek < 2) return;

  Object.keys(musclesMap).forEach(id => {
    const isSubMuscle = !['chest', 'quadriceps', 'abs', 'trapezius', 'upperBack', 'frontDeltoid', 'rearDeltoid', 'biceps', 'triceps', 'lowerBack', 'gluteal', 'hamstring', 'calves', 'forearm'].includes(id);
    if (isSubMuscle) return;

    const muscle = musclesMap[id];
    const acuteLoad = muscle.weeklyTonnage[currentWeek] || muscle.weeklyInol[currentWeek] || 0; // Fallback to INOL if tonnage is 0
    
    // Calculate Chronic Load (average of up to last 4 weeks)
    let chronicSum = 0;
    let weeksCounted = 0;
    for (let w = Math.max(1, currentWeek - 3); w <= currentWeek; w++) {
      chronicSum += muscle.weeklyTonnage[w] || muscle.weeklyInol[w] || 0;
      weeksCounted++;
    }
    const chronicLoad = chronicSum / weeksCounted;

    const acwr = calculateACWR(acuteLoad, chronicLoad);

    // ACWR Danger Zone > 1.5
    if (acwr > 1.5 && acuteLoad > 1.0 && chronicLoad >= 0.5) { // Also ensure there is meaningful volume to avoid false positives on tiny volumes
      if (!existingPredictions.some(p => p.muscleId === id && p.code === 'INJURY_RISK_ACWR')) {
        existingPredictions.push({ muscleId: id, acwr: parseFloat(acwr.toFixed(2)), code: 'INJURY_RISK_ACWR' });
      }
    }

    // Absolute Overtraining Zone > 2.0 (Even if ACWR is normal)
    if (chronicLoad > 2.0) {
      if (!existingPredictions.some(p => p.muscleId === id && p.code === 'INJURY_RISK_OVERTRAINING')) {
        existingPredictions.push({ muscleId: id, acwr: parseFloat(acwr.toFixed(2)), code: 'INJURY_RISK_OVERTRAINING' });
      }
    }
  });
}
