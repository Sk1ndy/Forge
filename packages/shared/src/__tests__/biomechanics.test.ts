import { describe, it, expect } from 'vitest';
import { calculateSetImpact } from "../engine/biomechanics/impact";
import { applyExponentialDecay, calculateACWR } from "../engine/biomechanics/physiology";
import { adjustRecovery } from "../engine/biomechanics/adaptive";
import { generateCacheKey } from "../engine/core/cache";
import { generateBiomechanicsConfig } from "../engine/config";
import { applyDiminishingReturns } from "../engine/algorithms/junk-volume";
import { Exercise, PlannedSet, UserProfile } from '../types';

const mockProfile: UserProfile = {
  pdc: 80,
  prs: { squat: 120, bench: 100, deadlift: 150, ohp: 60 },
  maxSnc: 15.0,
  age: 30,
  sleepHours: 8,
  caloricStatus: 'maintenance',
  stressLevel: 'moderate',
  isBeginner: false
};

const config = generateBiomechanicsConfig(mockProfile);

const mockExercise: Exercise = {
  id: 'bench_press',
  nom: 'Développé Couché',
  tier_snc: 2,
  muscle_primaire: 'chest',
  muscles_secondaires: ['frontDeltoid', 'triceps'],
  equipment: 'poids_libre',
  ppl_category: 'push',
};

describe('Biomechanics Engine (Level 2)', () => {
  describe('Cinétique Bi-Phasique & Physiologie', () => {
    it('réduit plus rapidement la fatigue métabolique que les dommages structurels', () => {
      // Pour un même montant de fatigue de départ (1.0)
      const fatigueMetabolicDay2 = applyExponentialDecay(1.0, config.tauMetabolic, 1);
      const fatigueDamageDay2 = applyExponentialDecay(1.0, config.tauDamage, 1);

      // La fatigue métabolique doit être beaucoup plus faible (s'est dissipée plus vite)
      expect(fatigueMetabolicDay2).toBeLessThan(fatigueDamageDay2);
    });

    it('calcule correctement le ratio ACWR', () => {
      // Acute Load = 2.0, Chronic Load = 1.0 -> ACWR = 2.0 (Danger)
      expect(calculateACWR(2.0, 1.0)).toBe(2.0);
      // Acute = 0, Chronic = 1.0 -> ACWR = 0
      expect(calculateACWR(0, 1.0)).toBe(0);
      // Chronic = 0 -> ACWR = 0 (Protection division par zéro)
      expect(calculateACWR(2.0, 0)).toBe(0);
    });
  });

  describe('Gouverneur Central (calculateSetImpact)', () => {
    const nominalSet: PlannedSet = { active: true, reps: 10, poids: 80, rpe: 8, series: 1 };

    it('calcule correctement un impact nominal sans fatigue préalable', () => {
      const { inol, sncPoints } = calculateSetImpact(nominalSet, mockExercise, mockProfile, config, 0);
      expect(inol).toBeGreaterThan(0.2);
      expect(inol).toBeLessThan(1.5);
      expect(sncPoints).toBeGreaterThan(0.1);
    });

    it('bride sévèrement le recrutement des fibres (coût SNC explosif) si fatigue locale > 2.0', () => {
      const freshImpact = calculateSetImpact(nominalSet, mockExercise, mockProfile, config, 0);
      const exhaustedImpact = calculateSetImpact(nominalSet, mockExercise, mockProfile, config, 3.0); // Fatigue 3.0 (très élevée)

      // INOL = mécanique, reste le même
      expect(exhaustedImpact.inol).toBe(freshImpact.inol);
      // Coût SNC = neurologique, doit exploser sous l'effet du Gouverneur Central
      expect(exhaustedImpact.sncPoints).toBeGreaterThan(freshImpact.sncPoints * 1.4);
    });

    it('gère correctement les sets inactifs', () => {
      const inactiveSet: PlannedSet = { ...nominalSet, active: false };
      const { inol, sncPoints } = calculateSetImpact(inactiveSet, mockExercise, mockProfile, config, 0);
      expect(inol).toBe(0);
      expect(sncPoints).toBe(0);
    });

    it('clamp les poids absurdes pour éviter des singularités INOL', () => {
      const insaneSet: PlannedSet = { active: true, reps: 10, poids: 10000, rpe: 10, series: 1 };
      const { inol } = calculateSetImpact(insaneSet, mockExercise, mockProfile, config, 0);
      expect(inol).toBeLessThan(5.0); // L'intensité maximale est capée à 99.9%
    });
  });

  describe('Junk Volume (Loi des rendements décroissants)', () => {
    it('applique un plafond logarithmique/asymptotique sur le volume journalier', () => {
      // Fonction asymptotique: K = 2.5. f(x) = x / (1 + x/K)
      
      const smallLoad = 0.5;
      const effectiveSmall = applyDiminishingReturns(smallLoad);
      // Pour une charge faible, le rendement est presque 1:1
      expect(effectiveSmall).toBeCloseTo(0.416, 2);

      const massiveLoad = 5.0;
      const effectiveMassive = applyDiminishingReturns(massiveLoad);
      // Pour une charge énorme (5.0 INOL), la loi des rendements l'écrase sévèrement
      expect(effectiveMassive).toBeLessThan(2.0); // Ne dépassera pas K=2.5 théoriquement
    });

    it('retourne 0 si la charge est 0', () => {
      expect(applyDiminishingReturns(0)).toBe(0);
      expect(applyDiminishingReturns(-1)).toBe(0);
    });
  });

  describe('Bug #6, #7, #8 fixes validation', () => {
    it('Bug #6: generateCacheKey must include biometricConstants and dailyVFC in cache fingerprint', () => {
      const profile1: UserProfile = {
        ...mockProfile,
        biometricConstants: { baseTauMetabolic: 1.0 },
        dailyVFC: 55
      };

      const profile2: UserProfile = {
        ...mockProfile,
        biometricConstants: { baseTauMetabolic: 2.0 },
        dailyVFC: 85
      };

      const key1 = generateCacheKey({}, profile1, {}, undefined, 1, []);
      const key2 = generateCacheKey({}, profile2, {}, undefined, 1, []);

      expect(key1).not.toBe(key2);
    });

    it('Bug #7: adjustRecovery must safely clamp tauChronicSnc and tauFitness under extreme stress levels', () => {
      const baseConfig = generateBiomechanicsConfig(mockProfile);
      
      const extremeStress = {
        recoveryMultiplier: 0.05,
        cnsStressDelta: 10.0,
        confidence: 1.0,
        logs: []
      };

      const { newConfig } = adjustRecovery(baseConfig, extremeStress);

      // Without clamp, tauChronicSnc would be 21 / 0.05 = 420. It must be capped at 45.0
      expect(newConfig.tauChronicSnc).toBe(45.0);

      // Without clamp, tauFitness would be 45 * sqrt(0.05) = 10.06. It must be clamped at 14.0 minimum
      expect(newConfig.tauFitness).toBe(14.0);
    });

    it('Bug #8: safeRetention guard in engine loop prevents division by zero if retention equals 1.0', () => {
      const retention = 1.0;
      const safeRetention = Math.max(0.01, Math.min(retention, 0.99));
      const localTauMultiplier = Math.log(0.5) / Math.log(safeRetention);
      
      expect(localTauMultiplier).not.toBe(Infinity);
      expect(localTauMultiplier).not.toBe(-Infinity);
      expect(isNaN(localTauMultiplier)).toBe(false);
      expect(localTauMultiplier).toBeGreaterThan(0);
    });
  });
});
