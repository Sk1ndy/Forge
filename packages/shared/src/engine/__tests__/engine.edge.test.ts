import { describe, it, expect } from 'vitest';
import { runMesocycleSimulation } from '../index';
import { WeeklyBlueprint, UserProfile, Exercise } from '../../../types';

const defaultProfile: UserProfile = {
  id: 'test_user',
  weight: 80,
  pdc: 80,
  isBeginner: false,
  prs: { squat: 100, bench: 80, deadlift: 120 }
};

const benchPressEx: Exercise = {
  id: 'bench_press',
  nom: 'Bench Press',
  muscle_primaire: 'chest',
  equipment: 'poids_libre',
  tier_snc: 1,
  ppl_category: 'push',
  tension_matrix: { chest: 1.0, frontDeltoid: 0.5, triceps: 0.5 }
};

describe('Engine Chaos & Edge Cases', () => {

  it('Scénario 1 : Over-Training Extrême (30 jours à 120% intensité)', () => {
    // 4 weeks (28 days) of extreme volume on Chest every day
    const extremeBlueprint: WeeklyBlueprint = {
      0: [{ exerciseId: 'bench_press', active: true, sets: [{ series: 5, reps: 5, poids: 95, rpe: 10, active: true }] }],
      1: [{ exerciseId: 'bench_press', active: true, sets: [{ series: 5, reps: 5, poids: 95, rpe: 10, active: true }] }],
      2: [{ exerciseId: 'bench_press', active: true, sets: [{ series: 5, reps: 5, poids: 95, rpe: 10, active: true }] }],
      3: [{ exerciseId: 'bench_press', active: true, sets: [{ series: 5, reps: 5, poids: 95, rpe: 10, active: true }] }],
      4: [{ exerciseId: 'bench_press', active: true, sets: [{ series: 5, reps: 5, poids: 95, rpe: 10, active: true }] }],
      5: [{ exerciseId: 'bench_press', active: true, sets: [{ series: 5, reps: 5, poids: 95, rpe: 10, active: true }] }],
      6: [{ exerciseId: 'bench_press', active: true, sets: [{ series: 5, reps: 5, poids: 95, rpe: 10, active: true }] }],
    };

    const toggledDays = { 0: true, 1: true, 2: true, 3: true, 4: true, 5: true, 6: true };
    const library = [benchPressEx];

    const result = runMesocycleSimulation(extremeBlueprint, defaultProfile, toggledDays, undefined, library, 4, []);
    
    const chest = result.muscles['chest'];
    expect(chest).toBeDefined();
    
    // Readiness devrait s'effondrer car fatigue massive > fitness
    expect(chest!.readiness).toBeLessThan(0);
    // Le statut devrait être en DANGER
    expect(chest!.statusLabel).toBe('DANGER');
    // Une alerte ACWR devrait être déclenchée ou un Inol absurde
    expect(result.injuryPredictions.some(p => p.muscleId === 'chest')).toBe(true);
    
    console.log('Over-Training - Chest Readiness:', chest!.readiness);
    console.log('Over-Training - CNS Failure:', result.cnsFailure);
  });

  it('Scénario 2 : Reprise après arrêt (6 mois)', () => {
    // We cannot natively simulate a 6 months gap without actually running the weeks.
    // But we can check if a beginner profile has disproportionate fatigue.
    const beginnerProfile: UserProfile = { ...defaultProfile, isBeginner: true };
    
    const basicBlueprint: WeeklyBlueprint = {
      0: [{ exerciseId: 'bench_press', active: true, sets: [{ series: 3, reps: 10, poids: 60, rpe: 8, active: true }] }]
    };
    const toggledDays = { 0: true };
    const library = [benchPressEx];

    const beginnerResult = runMesocycleSimulation(basicBlueprint, beginnerProfile, toggledDays, undefined, library, 1, []);
    const advancedResult = runMesocycleSimulation(basicBlueprint, defaultProfile, toggledDays, undefined, library, 1, []);
    
    const beginnerChest = beginnerResult.muscles['chest'];
    const advancedChest = advancedResult.muscles['chest'];
    
    expect(beginnerChest!.fatigueHistory[0]).toBeGreaterThan(advancedChest!.fatigueHistory[0]);
    console.log('Beginner Fatigue vs Advanced:', beginnerChest!.fatigueHistory[0], 'vs', advancedChest!.fatigueHistory[0]);
  });

  it('Edge Case 1 : Log Vide (Monotonie Division par zéro)', () => {
    const emptyBlueprint: WeeklyBlueprint = {};
    const toggledDays = { 0: true };
    const library = [benchPressEx];

    // Ne doit pas throw NaN ou crasher
    expect(() => {
      const result = runMesocycleSimulation(emptyBlueprint, defaultProfile, toggledDays, undefined, library, 4, []);
      expect(result.monotonyAlerts.length).toBe(0);
    }).not.toThrow();
  });

  it('Edge Case 2 : Changement de poids soudain', () => {
    const heavyProfile: UserProfile = { ...defaultProfile, pdc: 120 };
    const basicBlueprint: WeeklyBlueprint = {
      0: [{ exerciseId: 'bench_press', active: true, sets: [{ series: 3, reps: 10, poids: 60, rpe: 8, active: true }] }]
    };
    const toggledDays = { 0: true };
    const library = [benchPressEx];

    const normalResult = runMesocycleSimulation(basicBlueprint, defaultProfile, toggledDays, undefined, library, 1, []);
    const heavyResult = runMesocycleSimulation(basicBlueprint, heavyProfile, toggledDays, undefined, library, 1, []);
    
    // Le CNS Stress devrait être plus bas pour le heavy profile (weightRatio = 60/120 = 0.5 vs 60/80 = 0.75)
    expect(heavyResult.sncScore).toBeLessThan(normalResult.sncScore);
    console.log('SNC Score Normal vs Heavy:', normalResult.sncScore, 'vs', heavyResult.sncScore);
  });
});
