import { MusclesMap } from '../core/state';

export function calculateProgressiveOverload(
  targetMuscles: MusclesMap, 
  totalWeeks: number
): Record<string, { weekOverWeekGrowthPct: number }> {
  const overload: Record<string, { weekOverWeekGrowthPct: number }> = {};
  if (totalWeeks > 1) {
    Object.entries(targetMuscles).forEach(([id, data]) => {
      const wk1 = data.weeklyInol[1] || 0;
      const wklast = data.weeklyInol[totalWeeks] || 0;
      if (wk1 > 0) {
        overload[id] = {
          weekOverWeekGrowthPct: parseFloat((((wklast - wk1) / wk1) * 100).toFixed(1))
        };
      }
    });
  }
  return overload;
}
