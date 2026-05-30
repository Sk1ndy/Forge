import { BiomechanicsConfig } from '../config';

export const normalize = (val: number) => Math.round(val * 100000000) / 100000000;

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

/**
 * Modèle de croissance logistique (Équation de Verhulst)
 * Transforme le gain linéaire brut en gain ajusté selon la proximité avec le plafond génétique.
 */
export function applyLogisticCeilingEffect(rawGain: number, currentFitness: number, maxCeiling: number): number {
  if (currentFitness >= maxCeiling) return 0;
  return normalize(rawGain * (1 - (currentFitness / maxCeiling)));
}

export function getProgressionMultiplier(week: number, isDeload: boolean, isLogged: boolean): number {
  if (isLogged) return 1.0;
  if (isDeload) return 0.70;
  if (week > 1) return Math.min(1.15, Math.pow(1.025, week - 1));
  return 1.0;
}
