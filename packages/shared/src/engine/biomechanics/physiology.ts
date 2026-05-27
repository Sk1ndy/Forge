import { BiomechanicsConfig } from '../config';

export const normalize = (val: number) => Math.round(val * 10000) / 10000;

/**
 * Banister Impulse-Response Model Decay
 * Calculates the retained value after `daysElapsed` given a time constant `tau`.
 * Formula: Value(t) = Value(t-1) * e^(-days / tau)
 */
export function applyExponentialDecay(currentValue: number, tau: number, daysElapsed: number = 1): number {
  if (currentValue <= 0) return 0;
  return normalize(currentValue * Math.exp(-daysElapsed / tau));
}

/**
 * Calculates the ACWR (Acute:Chronic Workload Ratio).
 * Acute = average workload over last 7 days (usually week N)
 * Chronic = average workload over last 28 days (usually weeks N-3 to N)
 */
export function calculateACWR(acuteLoad: number, chronicLoad: number): number {
  if (chronicLoad <= 0) return 0;
  return normalize(acuteLoad / chronicLoad);
}

export function getProgressionMultiplier(week: number, isDeload: boolean, isLogged: boolean): number {
  if (isLogged) return 1.0;
  if (isDeload) return 0.70;
  if (week > 1) return Math.pow(1.025, week - 1);
  return 1.0;
}
