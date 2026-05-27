import { MuscleId, MuscleStatus, MuscleStatusToken } from '../../types';
import { MUSCLE_DETAILS } from '../../constants';
import { MusclesMap } from '../core/state';

export function formatMuscleStatus(targetMuscles: MusclesMap): { [muscleId in MuscleId]?: MuscleStatus } {
  const finalMuscles: { [muscleId in MuscleId]?: MuscleStatus } = {};

  Object.entries(targetMuscles).forEach(([id, data]) => {
    const mId = id as MuscleId;
    const fatigueScore = data.fatigue;
    const trueInol = data.inol || 0;

    let color: 'grey' | 'green' | 'orange' | 'red';
    let statusLabel: MuscleStatusToken;

    if (fatigueScore < 0.5) { color = 'grey'; statusLabel = 'REST'; } 
    else if (fatigueScore <= 1.5) { color = 'green'; statusLabel = 'OPTIMAL'; } 
    else if (fatigueScore <= 2.5) { color = 'orange'; statusLabel = 'OVERLOAD'; } 
    else { color = 'red'; statusLabel = 'DANGER'; }

    const totalInolAccumulated = Object.values(data.contributions).reduce((sum, val) => sum + val, 0);
    const contributors = Object.entries(data.contributions)
      .map(([nom, val]) => ({ nom, value: val, percentage: totalInolAccumulated > 0 ? Math.round((val / totalInolAccumulated) * 100) : 0 }))
      .filter(c => c.percentage > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 3);

    const currentSum = contributors.reduce((sum, c) => sum + c.percentage, 0);
    if (currentSum > 0 && currentSum !== 100 && contributors.length > 0) {
      contributors[0].percentage += (100 - currentSum);
    }

    finalMuscles[mId] = {
      name: MUSCLE_DETAILS[mId],
      inol: parseFloat(trueInol.toFixed(2)),
      sets: data.sets,
      color,
      statusLabel,
      contributors,
      remainingCapacity: parseFloat(Math.max(0, 1 - (fatigueScore / 2.5)).toFixed(4)),
      jointStress: parseFloat((data.jointStress || 0).toFixed(2)),
      readiness: parseFloat((data.fitness - fatigueScore).toFixed(2)),
      fatigueHistory: data.fatigueHistory.map(v => parseFloat(v.toFixed(2)))
    };
  });

  return finalMuscles;
}
