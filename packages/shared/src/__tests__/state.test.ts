import { describe, it, expect } from 'vitest';
import { aggregateMuscle } from '../engine/core/state';
import { MusclesMap, MuscleState } from '../types';

describe('State Engine: aggregateMuscle', () => {
  it('should correctly aggregate fitness, fatigue, and setsContributions from children', () => {
    // Initialiser une map de muscles factice
    const emptyMuscle = (): MuscleState => ({
      fatigue: 0, fatigueMetabolic: 0, fatigueDamage: 0, inol: 0, fitness: 0,
      sets: 0, jointStress: 0, contributions: {}, setsContributions: {},
      fatigueHistory: [], uniqueSets: new Set<string>(), weeklyInol: {}
    });

    const targetMuscles: MusclesMap = {
      chest: emptyMuscle(),
      upperChest: { ...emptyMuscle(), fitness: 10, fatigue: 4, fatigueMetabolic: 2, fatigueDamage: 2, setsContributions: { 'Incline Bench': 3 } },
      lowerChest: { ...emptyMuscle(), fitness: 20, fatigue: 6, fatigueMetabolic: 3, fatigueDamage: 3, setsContributions: { 'Dips': 4 } }
    };

    const dailyInol = { upperChest: 1.0, lowerChest: 1.5 };

    // Parent chest doit hériter de upperChest et lowerChest avec coeff 1.0 (voir PARENT_CHILD_WEIGHTS)
    aggregateMuscle(targetMuscles, dailyInol, 1, 'chest', ['upperChest', 'lowerChest']);

    const chest = targetMuscles['chest'];

    // Fatigue
    expect(chest.fatigueMetabolic).toBe(5); // 2 + 3
    expect(chest.fatigueDamage).toBe(5); // 2 + 3

    // BUG #1 Fix test: Fitness should be aggregated from children, NOT calculated as fatigue * 0.5
    expect(chest.fitness).toBe(30); // 10 + 20

    // BUG #12 Fix test: setsContributions should be combined
    expect(chest.setsContributions['Incline Bench']).toBe(3);
    expect(chest.setsContributions['Dips']).toBe(4);
  });
});
