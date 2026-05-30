import { describe, it, expect } from 'vitest';
import { runMesocycleSimulation } from '../engine';
import { WeeklyBlueprint, UserProfile } from '../types';

const defaultProfile: any = {
  id: 'usr1',
  trainingAge: 1,
  pdc: 75,
  gender: 'M',
  maxSnc: 15,
  prs: { squat: 100 }
};

const emptyBlueprint: WeeklyBlueprint = {
  mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: []
};

describe('Engine: Extreme Edge Cases (Suggestion 21)', () => {
  
  it('handles totalWeeks = 0 safely by defaulting to 1 week minimum', () => {
    const res = runMesocycleSimulation(emptyBlueprint, defaultProfile, {}, undefined, undefined, 0);
    // Even with 0 weeks passed, it should run 1 week and not crash
    expect(res).toBeDefined();
    expect(res.weeklyTraumas).toBeDefined();
  });

  it('handles bodyweight only (poids = 0) and missing PRs smoothly via fallback ACWR Tonnage', () => {
    const bwProfile: any = { id: 'usr2', trainingAge: 1, pdc: 70, gender: 'F', maxSnc: 15, prs: {} };
    const bwBlueprint: WeeklyBlueprint = {
      ...emptyBlueprint,
      mon: [{ id: 'ex1', exerciseId: 'dips', active: true, sets: [{ active: true, series: 5, reps: 20, poids: 0, rpe: 8 }] }]
    };
    
    // Si poids = 0, ACWR utilise le BW du profil ou 75 par défaut, donc ça ne doit pas crasher et ça doit générer de la fatigue.
    const res = runMesocycleSimulation(bwBlueprint, bwProfile);
    expect(res.muscles.chest!.sets).toBe(5);
    expect(res.muscles.chest!.inol).toBeGreaterThan(0);
    // Tonnage should be 5 * 20 * 70kg (bodyweight) = 7000kg, which implies > 0 INOL/Tonnage in finalState
  });

  it('handles extreme RPE=1 without NaN or infinity', () => {
    const rpeBlueprint: WeeklyBlueprint = {
      ...emptyBlueprint,
      mon: [{ id: 'ex1', exerciseId: 'bench_press', active: true, sets: [{ active: true, series: 5, reps: 5, poids: 10, rpe: 1 }] }]
    };
    const res = runMesocycleSimulation(rpeBlueprint, defaultProfile);
    // INOL will be very small but not NaN
    expect(res.muscles.chest!.inol).toBeGreaterThan(0);
    expect(res.muscles.chest!.inol).toBeLessThan(5.0); // Extremely low RPE = low fatigue compared to usual 20+
  });

  it('runs Monte Carlo Stochastic Mode without errors', () => {
    const blueprint: WeeklyBlueprint = {
      ...emptyBlueprint,
      mon: [{ id: 'ex1', exerciseId: 'bench_press', active: true, sets: [{ active: true, series: 5, reps: 10, poids: 80, rpe: 8 }] }]
    };
    const res = runMesocycleSimulation(blueprint, defaultProfile, {}, undefined, undefined, 4, [], undefined, undefined, undefined, { stochasticMode: true });
    
    expect(res.stochasticBands).toBeDefined();
    expect(res.stochasticBands!.systemicReadiness.low).toBeLessThanOrEqual(res.systemicReadiness);
    expect(res.stochasticBands!.systemicReadiness.high).toBeGreaterThanOrEqual(res.systemicReadiness);
  });

});
