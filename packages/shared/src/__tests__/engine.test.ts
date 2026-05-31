import { describe, it, expect } from 'vitest';
import { runMesocycleSimulation, runWeeklySimulationAsync } from '../engine';
import { UserProfile, WeeklyBlueprint, Exercise, UserProfileSchema } from '../types';

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
  mon: [{
    id: 'ex1',
    exerciseId: 'bench_press',
    active: true,
    sets: [{ active: true, series: 10, reps: 5, poids: 95, rpe: 10 }]
  }],
  tue: [{
    id: 'ex2',
    exerciseId: 'bench_press',
    active: true,
    sets: [{ active: true, series: 10, reps: 5, poids: 95, rpe: 10 }]
  }],
  wed: [{
    id: 'ex3',
    exerciseId: 'bench_press',
    active: true,
    sets: [{ active: true, series: 10, reps: 5, poids: 95, rpe: 10 }]
  }],
  thu: [], fri: [], sat: [], sun: []
};

import { normalizeFatigueHistoryToTensors } from '../engine/formatters/tensors';
import { normalize } from '../engine/biomechanics/physiology';
import { MUSCLE_DETAILS } from '../constants';

const normalBlueprint: WeeklyBlueprint = {
  mon: [{
    id: 'ex1',
    exerciseId: 'bench_press',
    active: true,
    sets: [{ active: true, series: 3, reps: 10, poids: 80, rpe: 8 }]
  }],
  tue: [], wed: [], thu: [], fri: [], sat: [], sun: []
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
      ['mon', 'tue', 'wed'].forEach(day => {
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
      mon: [{ id: 'ex', exerciseId: 'bench_press', active: true, sets: [{ active: true, series: 3, reps: 10, poids: 80, rpe: 8 }] }],
      tue: [{ id: 'ex', exerciseId: 'bench_press', active: true, sets: [{ active: true, series: 3, reps: 10, poids: 80, rpe: 8 }] }],
      wed: [{ id: 'ex', exerciseId: 'bench_press', active: true, sets: [{ active: true, series: 3, reps: 10, poids: 80, rpe: 8 }] }],
      thu: [], fri: [], sat: [], sun: []
    };

    const result = runMesocycleSimulation(monotonousBlueprint, mockProfile, {}, undefined, mockLibrary, 1, []);
    expect(result).toMatchSnapshot();
  });

  it('Backward compatibility: empty blueprint does not crash', async () => {
    const emptyBlueprint: WeeklyBlueprint = {
      mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: []
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
      mon: [{
        id: 'ex_push',
        exerciseId: 'bench_press',
        active: true,
        sets: [{ active: true, series: 3, reps: 10, poids: 80, rpe: 8 }] // 3 push series
      }],
      tue: [{
        id: 'ex_pull',
        exerciseId: 'pull_ups',
        active: true,
        sets: [{ active: true, series: 3, reps: 10, poids: 0, rpe: 8 }] // 3 pull series
      }],
      wed: [], thu: [], fri: [], sat: [], sun: []
    };

    // 2. Logs where the mon (Monday) push exercise is marked as NOT completed (skipped)
    const logs: any[] = [
      {
        exercise_id: 'bench_press',
        day: 'mon',
        week: 1,
        set_index: 0,
        is_completed: false
      },
      {
        exercise_id: 'pull_ups',
        day: 'tue',
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
      mon: [{ id: 'ex', exerciseId: 'custom_curl', active: true, sets: [{ active: true, series: 3, reps: 10, poids: 20, rpe: 8 }] }],
      tue: [], wed: [], thu: [], fri: [], sat: [], sun: []
    };

    const result = runMesocycleSimulation(singleExBlueprint, mockProfile, {}, undefined, [customExercise], 1, []);
    
    // Forearm (secondary muscle) must have accumulated some sets/inol because of fallback
    expect(result.muscles.forearm).toBeDefined();
    expect(result.muscles.forearm!.sets).toBeGreaterThan(0);
    expect(result.muscles.forearm!.inol).toBeGreaterThan(0);
  });

  it('Bug #10 deload volume reduction: reduces visible/simulated series count by 40% during deload week', () => {
    const blueprint: WeeklyBlueprint = {
      mon: [{ id: 'ex', exerciseId: 'bench_press', active: true, sets: [{ active: true, series: 5, reps: 10, poids: 80, rpe: 8 }] }],
      tue: [], wed: [], thu: [], fri: [], sat: [], sun: []
    };

    const normalResult = runMesocycleSimulation(blueprint, mockProfile, {}, undefined, mockLibrary, 1, []);
    const deloadResult = runMesocycleSimulation(blueprint, mockProfile, {}, undefined, mockLibrary, 1, [1]); // Week 1 is deload

    // For a deload week, 5 series is reduced by 40% -> 5 * 0.6 = 3 series
    expect(normalResult.muscles.chest!.sets).toBe(5);
    expect(deloadResult.muscles.chest!.sets).toBe(3);
  });

  it('Bug #12 telemetry adaptive recovery: severe sleep debt dynamic adaptation', () => {
    const blueprint: WeeklyBlueprint = {
      mon: [{ id: 'ex', exerciseId: 'bench_press', active: true, sets: [{ active: true, series: 3, reps: 10, poids: 80, rpe: 8 }] }],
      tue: [], wed: [], thu: [], fri: [], sat: [], sun: []
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
    expect(result.finalState!.muscles.chest).toBeDefined();
  });

  it('Bug #19 tonnage for ACWR: injury tracking uses tonnage over inol', () => {
    const result = runMesocycleSimulation(normalBlueprint, mockProfile, {}, undefined, mockLibrary, 1, []);
    expect(result.finalState!.muscles.chest.weeklyTonnage[1]).toBe(2400); // 3 * 10 * 80kg = 2400kg
  });

  it('Bug A-03 type mismatch: peakFatigue.day returns a valid day index (number 0-6) instead of string', () => {
    const result = runMesocycleSimulation(heavyBlueprint, mockProfile, {}, undefined, mockLibrary, 1, []);
    
    // On vérifie que peakFatigue a été généré dans weeklyMacro
    expect(Object.keys(result.weeklyMacro.peakFatigue).length).toBeGreaterThan(0);
    
    // Le chest devrait avoir une fatigue maximale suite au heavyBlueprint
    const chestPeak = result.weeklyMacro.peakFatigue['chest'];
    expect(chestPeak).toBeDefined();
    
    // Vérification stricte du typage et des valeurs
    expect(typeof chestPeak.value).toBe('number');
    expect(typeof chestPeak.day).toBe('number');
    
    // Le dayIndex doit être compris entre 0 (Lundi) et 6 (Dimanche)
    expect(chestPeak.day).toBeGreaterThanOrEqual(0);
    expect(chestPeak.day).toBeLessThanOrEqual(6);
  });

  it('Bug A-04 & A-06: finalState has strict EngineState structure and serializes to JSON cleanly without Set issues', () => {
    const result = runMesocycleSimulation(normalBlueprint, mockProfile, {}, undefined, mockLibrary, 1, []);
    expect(result.finalState).toBeDefined();
    expect(typeof result.finalState!.sncFatigue).toBe('number');
    expect(typeof result.finalState!.chronicSncStress).toBe('number');
    expect(typeof result.finalState!.dayIndex).toBe('number');
    expect(typeof result.finalState!.axialSncLoad).toBe('number');
    expect(result.finalState!.muscles).toBeDefined();
    
    // Verify JSON serialization doesn't crash
    const serialized = JSON.stringify(result.finalState);
    expect(serialized).toBeDefined();
    const parsed = JSON.parse(serialized);
    expect(parsed.sncFatigue).toBe(result.finalState!.sncFatigue);
    expect(parsed.muscles.chest).toBeDefined();
  });

  it('Bug A-05: UserProfileSchema validates biometricConstants strictly', () => {

    // 1. Valid profile with biometric constants should parse successfully
    const validProfile = {
      ...mockProfile,
      biometricConstants: {
        baseTauMetabolic: 1.2,
        baseTauDamage: 3.5,
        baseTauChronicSnc: 25.0,
        baseTauFitness: 50.0,
        cnsResilience: 1.1
      }
    };
    expect(() => UserProfileSchema.parse(validProfile)).not.toThrow();

    // 2. Profile with invalid biometric constants (out of bounds) should throw
    const invalidProfileLow = {
      ...mockProfile,
      biometricConstants: {
        baseTauMetabolic: 0.05 // min is 0.1
      }
    };
    expect(() => UserProfileSchema.parse(invalidProfileLow)).toThrow();

    const invalidProfileHigh = {
      ...mockProfile,
      biometricConstants: {
        baseTauDamage: 12.0 // max is 10.0
      }
    };
    expect(() => UserProfileSchema.parse(invalidProfileHigh)).toThrow();
  });

  it('Bug A-07: CNS acute fatigue decays slower (tauSncAcute = tauMetabolic * 3.5) over 3-4 days', () => {
    const cnsBlueprint: WeeklyBlueprint = {
      mon: [{
        id: 'ex_cns',
        exerciseId: 'bench_press',
        active: true,
        sets: [{ active: true, series: 12, reps: 5, poids: 110, rpe: 10 }] // 12 heavy sets to fatigue CNS
      }],
      tue: [], wed: [], thu: [], fri: [], sat: [], sun: []
    };

    const result = runMesocycleSimulation(cnsBlueprint, mockProfile, {}, undefined, mockLibrary, 1, []);
    
    // We expect the finalState (Sunday night) to still have non-trivial residual CNS fatigue (decayed slowly)
    expect(result.finalState).toBeDefined();
    expect(result.finalState!.sncFatigue).toBeGreaterThan(0.001);
  });

  it('Phase 1 Verification: fitnessHistory, monotonyIndex continuous reporting, globalAcwr and initialState propagation', () => {
    // 1. Verify fitnessHistory is populated and capped at 60
    const result = runMesocycleSimulation(normalBlueprint, mockProfile, {}, undefined, mockLibrary, 4, []);
    expect(result.muscles.chest).toBeDefined();
    expect(result.muscles.chest!.fitnessHistory).toBeDefined();
    expect(result.muscles.chest!.fitnessHistory!.length).toBe(28); // 4 weeks = 28 days
    expect(result.muscles.chest!.fitnessHistory![0]).toBeGreaterThanOrEqual(0);

    // 2. Verify monotony continuous indexing (requires at least 3 active days)
    const monotonyResult = runMesocycleSimulation(heavyBlueprint, mockProfile, {}, undefined, mockLibrary, 4, []);
    expect(monotonyResult.monotonyAlerts.length).toBeGreaterThan(0);
    monotonyResult.monotonyAlerts.forEach(alert => {
      expect(typeof alert.week).toBe('number');
      expect(typeof alert.monotonyIndex).toBe('number');
      expect(['MONOTONY_CRITICAL', 'MONOTONY_OK']).toContain(alert.code);
    });

    // 3. Verify globalAcwr defaults to 1.0 or represents maximum acwr alert
    expect(result.globalAcwr).toBeDefined();
    expect(typeof result.globalAcwr).toBe('number');

    // 4. Verify propagation of initialState
    const initialMuscles = {
      chest: { fatigue: 1.5, fatigueMetabolic: 0.5, fatigueDamage: 1.0, inol: 0, fitness: 1.0, sets: 0, jointStress: 0, contributions: {}, setsContributions: {}, fatigueHistory: [], fitnessHistory: [], uniqueSets: new Set<string>(), weeklyInol: {}, weeklyTonnage: {} }
    };
    const mockInitialState = {
      muscles: initialMuscles,
      sncFatigue: 1.0,
      chronicSncStress: 0.5,
      dayIndex: 0,
      pushSets: 0,
      pullSets: 0,
      legsSets: 0,
      axialSncLoad: 0
    } as any;

    const customInitResult = runMesocycleSimulation(normalBlueprint, mockProfile, {}, undefined, mockLibrary, 1, [], undefined, undefined, undefined, undefined, mockInitialState);
    expect(customInitResult.finalState).toBeDefined();
    expect(customInitResult.finalState!.sncFatigue).not.toBe(0);
  });
});


