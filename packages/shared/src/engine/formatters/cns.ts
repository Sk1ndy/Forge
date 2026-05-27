import { MuscleId } from '../../../types';
import { MusclesMap } from '../core/state';

export function calculateGlobalWorkCapacity(
  targetSnc: number, 
  maxSnc: number, 
  targetMuscles: MusclesMap
): { sncPercentage: number; globalWorkCapacity: number; cnsFailure: boolean } {
  const sncPercentage = Math.min(100, Math.round((targetSnc / maxSnc) * 100));
  const cnsFailure = targetSnc > maxSnc;

  const fiveBigMuscles: MuscleId[] = ['quadriceps', 'chest', 'upperBack', 'lowerBack', 'gluteal'];
  let totalMuscleFatiguePct = 0;
  fiveBigMuscles.forEach(id => {
    const muscle = targetMuscles[id];
    totalMuscleFatiguePct += Math.min(100, Math.max(0, ((muscle ? muscle.fatigue : 0) / 2.5) * 100));
  });
  const avgMuscleFatiguePct = totalMuscleFatiguePct / 5;
  const globalFatigueScore = (sncPercentage + avgMuscleFatiguePct) / 2;
  const globalWorkCapacity = Math.max(0, parseFloat((100 - globalFatigueScore).toFixed(1)));

  return { sncPercentage, globalWorkCapacity, cnsFailure };
}
