import { MuscleId } from '../../types';
import { MUSCLE_DETAILS } from '../../constants';
import { MusclesMap } from '../core/state';

import { calculateACWR } from '../biomechanics/physiology';

export function calculateInjuryPredictions(
  musclesMap: MusclesMap, 
  currentWeek: number,
  existingPredictions: string[]
): void {
  // ACWR needs at least 2 weeks of data to be somewhat meaningful, ideally 4.
  if (currentWeek < 2) return;

  Object.keys(musclesMap).forEach(id => {
    const isSubMuscle = !['chest', 'quadriceps', 'abs', 'trapezius', 'upperBack', 'frontDeltoid', 'rearDeltoid', 'biceps', 'triceps', 'lowerBack', 'gluteal', 'hamstring', 'calves', 'forearm'].includes(id);
    if (isSubMuscle) return;

    const muscle = musclesMap[id];
    const acuteLoad = muscle.weeklyInol[currentWeek] || 0;
    
    // Calculate Chronic Load (average of up to last 4 weeks)
    let chronicSum = 0;
    let weeksCounted = 0;
    for (let w = Math.max(1, currentWeek - 3); w <= currentWeek; w++) {
      chronicSum += muscle.weeklyInol[w] || 0;
      weeksCounted++;
    }
    const chronicLoad = chronicSum / weeksCounted;

    const acwr = calculateACWR(acuteLoad, chronicLoad);

    // ACWR Danger Zone > 1.5
    if (acwr > 1.5 && acuteLoad > 1.0) { // Also ensure there is meaningful volume (acuteLoad > 1.0 INOL) to avoid false positives on tiny volumes
      const msg = `Pic de charge (ACWR: ${acwr.toFixed(2)}) détecté sur : ${MUSCLE_DETAILS[id as MuscleId] || id}. Risque de blessure !`;
      if (!existingPredictions.some(p => p.includes(MUSCLE_DETAILS[id as MuscleId] || id))) {
        existingPredictions.push(msg);
      }
    }
  });
}
