export function calculateMonotonyAlerts(
  weeklySystemicInol: Record<number, number[]>, 
  deloadWeeks: number[]
): { week: number; code: string; monotonyIndex: number }[] {
  const alerts: { week: number; code: string; monotonyIndex: number }[] = [];
  Object.entries(weeklySystemicInol).forEach(([wk, dailyLoads]) => {
    const w = Number(wk);
    if (deloadWeeks.includes(w)) return;
    
    const activeDays = dailyLoads.filter(l => l > 0);
    if (activeDays.length >= 3) {
      const mean = activeDays.reduce((a, b) => a + b, 0) / activeDays.length;
      const variance = activeDays.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / activeDays.length;
      const stdDev = Math.sqrt(variance);
      const monotonyIndex = mean > 0.01 ? parseFloat((stdDev / mean).toFixed(3)) : 0;
      
      if (mean > 0.01) {
        if (monotonyIndex < 0.15) {
          alerts.push({ week: w, code: 'MONOTONY_CRITICAL', monotonyIndex });
        } else {
          alerts.push({ week: w, code: 'MONOTONY_OK', monotonyIndex });
        }
      }
    }
  });
  return alerts;
}
