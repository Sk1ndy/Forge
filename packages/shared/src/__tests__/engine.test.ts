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
});
