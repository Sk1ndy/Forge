import { BiomechanicsConfig } from '../config';
import { StressFactors } from '../../schemas';

/**
 * Mute the BiomechanicsConfig based on daily acute StressFactors.
 * This effectively makes the Banister Model dynamic on a day-to-day basis.
 */
export function adjustRecovery(
  baseConfig: BiomechanicsConfig,
  stressFactors: StressFactors
): { newConfig: BiomechanicsConfig; logs: string[] } {
  // Deep clone to prevent mutating the baseline week config
  const newConfig: BiomechanicsConfig = { ...baseConfig };
  const executionLogs: string[] = [...stressFactors.logs];

  if (stressFactors.recoveryMultiplier !== 1.0) {
    // If recoveryMultiplier < 1.0 (e.g. 0.8), fatigue decays SLOWER, meaning tau INCREASES.
    // So tau = baseTau / recoveryMultiplier
    newConfig.tauMetabolic = baseConfig.tauMetabolic / stressFactors.recoveryMultiplier;
    newConfig.tauDamage = baseConfig.tauDamage / stressFactors.recoveryMultiplier;
    
    // Chronic stress also takes longer to heal
    newConfig.tauChronicSnc = baseConfig.tauChronicSnc / stressFactors.recoveryMultiplier;

    // Fitness is also impacted by severe lack of recovery
    newConfig.tauFitness = baseConfig.tauFitness * Math.sqrt(stressFactors.recoveryMultiplier);

    executionLogs.push(`Tau Métabolique ajusté de ${baseConfig.tauMetabolic.toFixed(2)} à ${newConfig.tauMetabolic.toFixed(2)} jours.`);
  }

  // Cap constraints to prevent math explosions (e.g., divide by zero or negative tau)
  newConfig.tauMetabolic = Math.max(0.1, Math.min(newConfig.tauMetabolic, 10.0));
  newConfig.tauDamage = Math.max(0.5, Math.min(newConfig.tauDamage, 30.0));

  return {
    newConfig,
    logs: executionLogs
  };
}
