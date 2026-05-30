import { describe, it, expect } from 'vitest';
import { runMesocycleSimulation, runWeeklySimulationAsync } from '../engine';
import { UserProfile, WeeklyBlueprint, Exercise } from '../types';

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

const mockLibrary: Exercise[] = [
  {
    id: 'bench_press',
    nom: 'Développé Couché',
    equipment: 'poids_libre',
    muscle_primaire: 'chest',
    muscles_secondaires: ['frontDeltoid', 'triceps'],
    tension_matrix: { chest: 1.0, frontDeltoid: 0.5, triceps: 0.5 },
    tier_snc: 2,
    ppl_category: 'push',
  } as Exercise
];

const heavyBlueprint: WeeklyBlueprint = {
  Lundi: [{
    id: 'ex1',
    exerciseId: 'bench_press',
    active: true,
    sets: [{ active: true, series: 10, reps: 5, poids: 95, rpe: 10 }]
  }],
  Mardi: [{
    id: 'ex2',
    exerciseId: 'bench_press',
    active: true,
    sets: [{ active: true, series: 10, reps: 5, poids: 95, rpe: 10 }]
  }],
  Mercredi: [{
    id: 'ex3',
    exerciseId: 'bench_press',
    active: true,
    sets: [{ active: true, series: 10, reps: 5, poids: 95, rpe: 10 }]
  }],
  Jeudi: [], Vendredi: [], Samedi: [], Dimanche: []
};

import { normalizeFatigueHistoryToTensors } from '../engine/formatters/tensors';
import { normalize } from '../engine/biomechanics/physiology';
import { MUSCLE_DETAILS } from '../constants';

const normalBlueprint: WeeklyBlueprint = {
  Lundi: [{
    id: 'ex1',
    exerciseId: 'bench_press',
    active: true,
    sets: [{ active: true, series: 3, reps: 10, poids: 80, rpe: 8 }]
  }],
  Mardi: [], Mercredi: [], Jeudi: [], Vendredi: [], Samedi: [], Dimanche: []
};

describe('Engine: Phase 2 (Mesocycle Algorithms)', () => {
  it('Progressive Overload: auto-increments future unlogged sets', () => {
    const result = runMesocycleSimulation(normalBlueprint, mockProfile, {}, undefined, mockLibrary, 4, []);
    expect(result).toMatchSnapshot();
  });

  it('Deload: reduces fatigue and overload automatically', () => {
    const normalResult = runMesocycleSimulation(normalBlueprint, mockProfile, {}, undefined, mockLibrary, 4, []);
    const deloadResult = runMesocycleSimulation(normalBlueprint, mockProfile, {}, undefined, mockLibrary, 4, [4]);
    
    expect({ normalResult, deloadResult }).toMatchSnapshot();
  });

  it('Injury Prediction (ACWR): détecte un pic de charge (ACWR > 1.5)', () => {
    // Weeks 1, 2, 3 have very low volume via sessionLogs
    const lowLogs: any[] = [];
    for (let w = 1; w <= 3; w++) {
      ['Lundi', 'Mardi', 'Mercredi'].forEach(day => {
        lowLogs.push({
          id: `log_w${w}_${day}`, exercise_id: 'bench_press', day: day, week: w,
          set_index: 0, actual_reps: 5, actual_weight: 20, actual_rpe: 5, is_completed: true
        });
      });
    }
    
    // Week 4 will use heavyBlueprint (3 days of 10 sets of heavy bench press)
    const result = runMesocycleSimulation(heavyBlueprint, mockProfile, {}, undefined, mockLibrary, 4, [], lowLogs);
    
    expect(result).toMatchSnapshot();
  });

  it('Monotony: detects robotic flat intensity across a week', () => {
    const monotonousBlueprint: WeeklyBlueprint = {
      Lundi: [{ id: 'ex', exerciseId: 'bench_press', active: true, sets: [{ active: true, series: 3, reps: 10, poids: 80, rpe: 8 }] }],
      Mardi: [{ id: 'ex', exerciseId: 'bench_press', active: true, sets: [{ active: true, series: 3, reps: 10, poids: 80, rpe: 8 }] }],
      Mercredi: [{ id: 'ex', exerciseId: 'bench_press', active: true, sets: [{ active: true, series: 3, reps: 10, poids: 80, rpe: 8 }] }],
      Jeudi: [], Vendredi: [], Samedi: [], Dimanche: []
    };

    const result = runMesocycleSimulation(monotonousBlueprint, mockProfile, {}, undefined, mockLibrary, 1, []);
    expect(result).toMatchSnapshot();
  });

  it('Backward compatibility: empty blueprint does not crash', async () => {
    const emptyBlueprint: WeeklyBlueprint = {
      Lundi: [], Mardi: [], Mercredi: [], Jeudi: [], Vendredi: [], Samedi: [], Dimanche: []
    };
    
    const result = await runWeeklySimulationAsync(emptyBlueprint, mockProfile, {}, undefined, mockLibrary);
    expect(result).toMatchSnapshot();
  });

  it('Bug #4 memory leak: fatigueHistory must be capped at 60 days even on long simulations', () => {
    // Run a 10-week simulation (10 * 7 = 70 days)
    const result = runMesocycleSimulation(normalBlueprint, mockProfile, {}, undefined, mockLibrary, 10, []);
    
    // Every muscle state fatigueHistory should be exactly 60 in length (not 70)
    let checkedAtLeastOne = false;
    Object.entries(result.muscles).forEach(([id, muscle]) => {
      if (muscle) {
        expect(muscle.fatigueHistory.length).toBe(60);
        checkedAtLeastOne = true;
      }
    });
    expect(checkedAtLeastOne).toBe(true);
  });

  it('Bug #5 dynamic PPL: PPL ratio must dynamically reflect session logs completed sets, not static blueprint', () => {
    // 1. Create a blueprint with push (bench_press) and pull (pull_ups)
    const pplBlueprint: WeeklyBlueprint = {
      Lundi: [{
        id: 'ex_push',
        exerciseId: 'bench_press',
        active: true,
        sets: [{ active: true, series: 3, reps: 10, poids: 80, rpe: 8 }] // 3 push series
      }],
      Mardi: [{
        id: 'ex_pull',
        exerciseId: 'pull_ups',
        active: true,
        sets: [{ active: true, series: 3, reps: 10, poids: 0, rpe: 8 }] // 3 pull series
      }],
      Mercredi: [], Jeudi: [], Vendredi: [], Samedi: [], Dimanche: []
    };

    // 2. Logs where the Lundi (Monday) push exercise is marked as NOT completed (skipped)
    const logs: any[] = [
      {
        exercise_id: 'bench_press',
        day: 'Lundi',
        week: 1,
        set_index: 0,
        is_completed: false
      },
      {
        exercise_id: 'pull_ups',
        day: 'Mardi',
        week: 1,
        set_index: 0,
        is_completed: true,
        actual_reps: 10,
        actual_weight: 0,
        actual_rpe: 8
      }
    ];

    // Using DEFAULT_EXERCISE_LIBRARY which contains bench_press and pull_ups
    const result = runMesocycleSimulation(
      pplBlueprint,
      mockProfile,
      {},
      undefined,
      undefined, // uses DEFAULT_EXERCISE_LIBRARY
      1,
      [],
      logs
    );

    // Expect the PPL ratio to be 100% pull and 0% push (since push sets were skipped in logs)
    expect(result.pushPullLegsRatio.push).toBe(0);
    expect(result.pushPullLegsRatio.pull).toBe(100);
  });

  it('Bug #9 fallback muscles_secondaires: custom exercise without tension_matrix must fallback to secondary muscles at 40%', () => {
    const customExercise: Exercise = {
      id: 'custom_curl',
      nom: 'Curl Custom',
      tier_snc: 3,
      muscle_primaire: 'biceps',
      muscles_secondaires: ['forearm'],
      equipment: 'poids_libre',
      ppl_category: 'pull'
    };

    const singleExBlueprint: WeeklyBlueprint = {
      Lundi: [{ id: 'ex', exerciseId: 'custom_curl', active: true, sets: [{ active: true, series: 3, reps: 10, poids: 20, rpe: 8 }] }],
      Mardi: [], Mercredi: [], Jeudi: [], Vendredi: [], Samedi: [], Dimanche: []
    };

    const result = runMesocycleSimulation(singleExBlueprint, mockProfile, {}, undefined, [customExercise], 1, []);
    
    // Forearm (secondary muscle) must have accumulated some sets/inol because of fallback
    expect(result.muscles.forearm).toBeDefined();
    expect(result.muscles.forearm!.sets).toBeGreaterThan(0);
    expect(result.muscles.forearm!.inol).toBeGreaterThan(0);
  });

  it('Bug #10 deload volume reduction: reduces visible/simulated series count by 40% during deload week', () => {
    const blueprint: WeeklyBlueprint = {
      Lundi: [{ id: 'ex', exerciseId: 'bench_press', active: true, sets: [{ active: true, series: 5, reps: 10, poids: 80, rpe: 8 }] }],
      Mardi: [], Mercredi: [], Jeudi: [], Vendredi: [], Samedi: [], Dimanche: []
    };

    const normalResult = runMesocycleSimulation(blueprint, mockProfile, {}, undefined, mockLibrary, 1, []);
    const deloadResult = runMesocycleSimulation(blueprint, mockProfile, {}, undefined, mockLibrary, 1, [1]); // Week 1 is deload

    // For a deload week, 5 series is reduced by 40% -> 5 * 0.6 = 3 series
    expect(normalResult.muscles.chest!.sets).toBe(5);
    expect(deloadResult.muscles.chest!.sets).toBe(3);
  });

  it('Bug #12 telemetry adaptive recovery: severe sleep debt dynamic adaptation', () => {
    const blueprint: WeeklyBlueprint = {
      Lundi: [{ id: 'ex', exerciseId: 'bench_press', active: true, sets: [{ active: true, series: 3, reps: 10, poids: 80, rpe: 8 }] }],
      Mardi: [], Mercredi: [], Jeudi: [], Vendredi: [], Samedi: [], Dimanche: []
    };

    const wearableData = {
      source: 'garmin' as any,
      sleep_total_minutes: 240, // 4 hours of sleep -> severe debt!
      readiness_score: 35 // critical readiness
    };

    const normalResult = runMesocycleSimulation(blueprint, mockProfile, {}, undefined, mockLibrary, 1, []);
    const adaptiveResult = runMesocycleSimulation(blueprint, mockProfile, {}, undefined, mockLibrary, 1, [], undefined, undefined, wearableData as any);

    // Because of sleep debt, fatigue decays slower, causing higher fatigue/stress and lower readiness
    expect(adaptiveResult.muscles.chest!.readiness).toBeLessThan(normalResult.muscles.chest!.readiness);
  });

  it('Bug #13 Zod validation: runMesocycleSimulation throws when input is malformed', () => {
    const malformedProfile = {
      ...mockProfile,
      pdc: 10 // weight too low (Zod max/min validation error)
    };

    expect(() => {
      runMesocycleSimulation(normalBlueprint, malformedProfile as any, {}, undefined, mockLibrary);
    }).toThrow();
  });
  it('Bug #14 precision: normalize must maintain 8 decimals precision', () => {
    expect(normalize(0.12345678)).toBe(0.12345678);
    expect(normalize(0.123456789)).toBe(0.12345679);
  });

  it('Bug #15 historical weekly sets: weeklyEffectiveSets is an average across all weeks', () => {
    const result = runMesocycleSimulation(normalBlueprint, mockProfile, {}, undefined, mockLibrary, 4, []);
    expect(result.weeklyMacro.weeklyEffectiveSets.chest).toBe(3);
  });

  it('Bug #16 decorative muscles removed: MUSCLE_DETAILS does not contain head or knees', () => {
    expect((MUSCLE_DETAILS as any).head).toBeUndefined();
    expect((MUSCLE_DETAILS as any).knees).toBeUndefined();
  });

  it('Bug #17 stack overflow: tensors and max calculation do not throw on huge history', () => {
    const hugeHistory = Array(150000).fill(1.5);
    const mockMap = { chest: { fatigueHistory: hugeHistory } } as any;
    expect(() => normalizeFatigueHistoryToTensors(mockMap)).not.toThrow();
  });

  it('Bug #18 finalState missing: SimulationResult contains finalState for live tracking', () => {
    const result = runMesocycleSimulation(normalBlueprint, mockProfile, {}, undefined, mockLibrary, 1, []);
    expect(result.finalState).toBeDefined();
    expect(result.finalState.chest).toBeDefined();
  });

  it('Bug #19 tonnage for ACWR: injury tracking uses tonnage over inol', () => {
    const result = runMesocycleSimulation(normalBlueprint, mockProfile, {}, undefined, mockLibrary, 1, []);
    expect(result.finalState.chest.weeklyTonnage[1]).toBe(2400); // 3 * 10 * 80kg = 2400kg
  });
});


