export function calculateMonotonyAlerts(
  weeklySystemicInol: Record<number, number[]>, 
  deloadWeeks: number[]
): string[] {
  const alerts: string[] = [];
  Object.entries(weeklySystemicInol).forEach(([wk, dailyLoads]) => {
    const w = Number(wk);
    if (deloadWeeks.includes(w)) return;
    
    const activeDays = dailyLoads.filter(l => l > 0);
    if (activeDays.length >= 3) {
      const mean = activeDays.reduce((a, b) => a + b, 0) / activeDays.length;
      const variance = activeDays.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / activeDays.length;
      const stdDev = Math.sqrt(variance);
      
      if (mean > 0 && (stdDev / mean) < 0.15) {
        alerts.push(`Semaine ${w} : Monotonie critique détectée. La charge intra-semaine est trop linéaire, augmentez la variance des intensités pour soulager le SNC.`);
      }
    }
  });
  return alerts;
}
