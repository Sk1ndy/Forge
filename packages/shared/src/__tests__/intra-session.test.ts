import { describe, it, expect } from 'vitest';
import { regulateNextSet } from '../engine/algorithms/intra-session-regulator';

describe('Engine: Intra-Session Regulator (D-05)', () => {
  it('maintains weight when actual RPE matches target closely', () => {
    // Squat: Target RPE 8, Actual RPE 8.5
    const result = regulateNextSet('squat', 8.0, 100, 5, 8.5);
    
    expect(result.action).toBe('maintain');
    expect(result.newWeight).toBe(100);
    expect(result.newReps).toBe(5);
  });

  it('drops weight aggressively for Tier 1 compound movements on high overshoot', () => {
    // Squat (Tier 1): Target RPE 8, Actual RPE 10 (Overshoot +2)
    // Formula: 2 * 0.05 = 0.10 (10% drop) -> 100kg - 10kg = 90kg
    const result = regulateNextSet('squat', 8.0, 100, 5, 10.0);
    
    expect(result.action).toBe('drop_weight');
    expect(result.newWeight).toBe(90);
    expect(result.newReps).toBe(5); // Reps maintained
  });

  it('drops weight less aggressively for Tier 3 isolation movements', () => {
    // Biceps Curl (Tier 3): Target RPE 8, Actual RPE 10 (Overshoot +2)
    // Formula: 2 * 0.03 = 0.06 (6% drop) -> 30kg - 1.8kg = 28kg
    const result = regulateNextSet('biceps_curl', 8.0, 30, 10, 10.0);
    
    expect(result.action).toBe('drop_weight');
    expect(result.newWeight).toBe(28);
  });

  it('drops reps instead of weight for Bodyweight (PDC) exercises', () => {
    // Pull ups (PDC): Target RPE 8, Actual RPE 9.5 (Overshoot +1.5)
    // Formula: Round(1.5) = 2 rep drop
    const result = regulateNextSet('pull_ups', 8.0, 0, 10, 9.5);
    
    expect(result.action).toBe('drop_reps');
    expect(result.newWeight).toBe(0);
    expect(result.newReps).toBe(8);
  });

  it('increases weight safely on undershoot', () => {
    // Squat (Tier 1): Target 8, Actual 6 (Undershoot -2)
    // Boost Tier 1: 2 * 0.025 = 0.05 (5% boost) -> 100 + 5 = 105kg
    const result = regulateNextSet('squat', 8.0, 100, 5, 6.0);
    
    expect(result.action).toBe('increase_weight');
    expect(result.newWeight).toBe(105);
  });

  it('increases reps for Bodyweight (PDC) on undershoot', () => {
    // Crunchs (PDC): Target 7, Actual 5 (Undershoot -2)
    const result = regulateNextSet('crunchs', 7.0, 0, 15, 5.0);
    
    expect(result.action).toBe('increase_reps');
    expect(result.newReps).toBe(17);
  });

  it('drops reps instead of weight if weight is zero but exercise is not pure PDC', () => {
    // Machine chest press done with just 0kg (sled only) but overshoot
    const result = regulateNextSet('machine_chest_press', 8.0, 0, 10, 10.0);
    
    expect(result.action).toBe('drop_reps');
    expect(result.newReps).toBe(8);
  });
});
