import { UserProfile } from '../types';

export interface BiomechanicsConfig {
  /** Decay time constant for fitness (in days). Usually longer than fatigue (e.g. 45 days) */
  tauFitness: number;
  
  /** Decay time constant for metabolic fatigue (in days). Dissipates quickly (< 24h). */
  tauMetabolic: number;

  /** Decay time constant for structural damage (in days). Dissipates slowly (48-72h+). */
  tauDamage: number;
  
  /** Decay time constant for chronic systemic fatigue (Burnout). Dissipates very slowly (21+ days). */
  tauChronicSnc: number;
  
  /** Le Plafond génétique maximal absolu atteignable (Myostatine, Âge, Récupération). */
  geneticCeiling: number;
  /** Multiplier for fitness impact on performance */
  k1: number;
  
  /** Multiplier for fatigue impact on performance */
  k2: number;
  
  /** Recovery rate multiplier (1.0 = baseline). Derived from sleep, age, nutrition. */
  recoveryRate: number;
  
  /** Systemic (CNS) resilience factor. Defines how well the user handles high-tier exercises. */
  cnsResilience: number;
}

/**
 * Generates a BiomechanicsConfig based on a user profile.
 * In the future, a Machine Learning model can inject a custom config here
 * based on the user's historical data instead of static rules.
 */
export function generateBiomechanicsConfig(profile: UserProfile): BiomechanicsConfig {
  const userAge = profile.age ?? 28;
  const userSleep = profile.sleepHours ?? 8;
  const userCaloric = profile.caloricStatus ?? 'maintenance';
  const userStress = profile.stressLevel ?? 'moderate';
  const userVFC = profile.dailyVFC; // En ms. Typiquement > 60 est très bon pour la recup, < 40 est mauvais, dépend de la baseline individuelle.

  // 1. Calculate Recovery Rate (Baseline 1.0)
  let recoveryRate = 1.0;
  if (userAge > 40) recoveryRate *= Math.max(0.70, 1 - (userAge - 40) * 0.01);
  if (userSleep < 7.5) recoveryRate *= Math.max(0.60, 0.60 + (userSleep / 7.5) * 0.40);
  else if (userSleep >= 9) recoveryRate *= 1.05;
  if (userCaloric === 'deficit') recoveryRate *= 0.80;
  else if (userCaloric === 'surplus') recoveryRate *= 1.05;
  if (userStress === 'high') recoveryRate *= 0.80;
  else if (userStress === 'low') recoveryRate *= 1.05;

  // Modulateur Biométrique : Montre connectée (VFC)
  if (userVFC !== undefined) {
    if (userVFC < 35) recoveryRate *= 0.85; // Baisse sévère de récupération si VFC très basse
    else if (userVFC > 65) recoveryRate *= 1.10; // Boost si VFC excellente
  }

  // 2. Determine Time Constants (Tau)
  // Faster recovery = shorter taus
  const baseTauFitness = 45;
  const baseTauMetabolic = 1.0; // ~24h
  const baseTauDamage = 3.0; // ~72h
  const baseTauChronicSnc = 21.0; // ~3 semaines

  // If recovery is slow (rate < 1), fatigue takes longer to dissipate
  const tauMetabolic = baseTauMetabolic / recoveryRate;
  const tauDamage = baseTauDamage / recoveryRate;
  const tauChronicSnc = baseTauChronicSnc / recoveryRate;
  
  // Plafond génétique modulé par la qualité de la récupération et l'âge
  const geneticCeiling = 1000.0 * Math.pow(recoveryRate, 1.5);
  
  // Fitness retention is also affected but to a lesser degree
  const tauFitness = baseTauFitness * Math.sqrt(recoveryRate);

  // 3. CNS Resilience
  // Beginners have lower CNS resilience, older users might have lower resilience.
  let cnsResilience = 1.0;
  if (profile.isBeginner) cnsResilience = 0.8;
  if (userAge > 50) cnsResilience *= 0.9;

  return {
    tauFitness,
    tauMetabolic,
    tauDamage,
    tauChronicSnc,
    geneticCeiling,
    k1: 1.0, // Base fitness weight
    k2: 2.0, // Fatigue usually has a 2x immediate impact compared to fitness
    recoveryRate,
    cnsResilience
  };
}
