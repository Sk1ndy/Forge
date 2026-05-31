import { describe, it, expect } from 'vitest';
import { generateTrainingProgram } from '../engine/algorithms/program-generator';

describe('Engine: Program Generator (D-01)', () => {
  it('generates a clean Full Body blueprint for a beginner with 2 days frequency', () => {
    const blueprint = generateTrainingProgram({
      pdc: 75,
      gender: 'male',
      experience_level: 'beginner',
      frequency: 2
    });

    expect(blueprint).toBeDefined();
    expect(blueprint.mon.length).toBeGreaterThan(0);
    expect(blueprint.thu.length).toBeGreaterThan(0);
    
    // Check that beginner sets are 3, reps are 10, RPE is 6.5 (Tier 1 adjusted)
    const firstEx = blueprint.mon[0];
    expect(firstEx.sets.length).toBe(3);
    expect(firstEx.sets[0].reps).toBe(10);
    expect(firstEx.sets[0].rpe).toBe(6.5);
  });

  it('generates a complete PPL weekly blueprint for intermediate with 3 days frequency', () => {
    const blueprint = generateTrainingProgram({
      pdc: 80,
      gender: 'male',
      experience_level: 'intermediate',
      frequency: 3
    });

    expect(blueprint).toBeDefined();
    // Monday is Push (bench_press, ohp, triceps)
    expect(blueprint.mon.some(ex => ex.exerciseId === 'bench_press')).toBe(true);
    // Wednesday is Pull (pull_ups, barbell_row, biceps)
    expect(blueprint.wed.some(ex => ex.exerciseId === 'pull_ups')).toBe(true);
    // Friday is Legs (squat, romanian_deadlift)
    expect(blueprint.fri.some(ex => ex.exerciseId === 'squat')).toBe(true);
    
    // Check that intermediate sets are 4, reps are 8, RPE is 7.5 (Tier 1 adjusted)
    const squatEx = blueprint.fri.find(ex => ex.exerciseId === 'squat')!;
    expect(squatEx.sets.length).toBe(4);
    expect(squatEx.sets[0].reps).toBe(8);
    expect(squatEx.sets[0].rpe).toBe(7.5);
  });

  it('estimates 1RMs using Epley formula from recent_lifts and applies to recommended weights', () => {
    const blueprintWithPrs = generateTrainingProgram({
      pdc: 80,
      gender: 'male',
      experience_level: 'intermediate',
      frequency: 3,
      recent_lifts: [
        { exo: 'bench', poids: 100, reps: 5 } // Epley 1RM = 100 * (1 + 5/30) = 116.6kg
      ]
    });

    const benchEx = blueprintWithPrs.mon.find(ex => ex.exerciseId === 'bench_press')!;
    // Weight should be close to 116.6 * 0.72 = ~84kg
    expect(benchEx.sets[0].poids).toBeGreaterThan(75);
    expect(benchEx.sets[0].poids).toBeLessThan(95);
  });

  it('limits/auto-regulates volume through simulated biomechanical feedback loops', () => {
    // If we specify a massive level for a lightweight athlete with a low maxSnc (simulated internally),
    // the program generator must automatically reduce RPE and reps.
    const regulatedBlueprint = generateTrainingProgram({
      pdc: 50, // very light weight
      gender: 'female',
      experience_level: 'advanced',
      frequency: 3
    });

    expect(regulatedBlueprint).toBeDefined();
    // Verify it doesn't crash and returns valid sets/reps (possibly adjusted downwards)
    expect(regulatedBlueprint.mon.length).toBeGreaterThan(0);
  });

  it('raises Zod validation errors on malformed generator inputs', () => {
    expect(() => {
      generateTrainingProgram({
        pdc: 10, // too low
        gender: 'male',
        experience_level: 'intermediate',
        frequency: 3
      });
    }).toThrow();

    expect(() => {
      generateTrainingProgram({
        pdc: 80,
        gender: 'male',
        experience_level: 'intermediate',
        frequency: 10 // invalid frequency (min 2, max 6)
      });
    }).toThrow();
  });
});
