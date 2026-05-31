import { describe, it, expect } from 'vitest';
import { findEquivalences } from '../engine/algorithms/exercise-equivalence';

describe('Engine: Exercise Equivalence (D-04)', () => {
  it('finds highly similar alternatives for bench_press', () => {
    const alternatives = findEquivalences('bench_press', 70);
    
    // Expect at least flat_db_press and machine_chest_press
    expect(alternatives.length).toBeGreaterThan(0);
    expect(alternatives.some(a => a.exerciseId === 'flat_db_press')).toBe(true);
    
    // Sort should be descending
    if (alternatives.length > 1) {
      expect(alternatives[0].matchPercentage).toBeGreaterThanOrEqual(alternatives[1].matchPercentage);
    }
  });

  it('filters out bad alternatives (e.g. squat vs bicep_curl)', () => {
    const alternatives = findEquivalences('squat', 50); // Mème avec seuil bas
    
    // Biceps curl ne doit pas apparaître
    expect(alternatives.some(a => a.exerciseId === 'biceps_curl')).toBe(false);
  });

  it('respects the SNC Tier gap constraint (no Tier 1 replacing Tier 3)', () => {
    // Biceps curl est Tier 3. Un exo Tier 1 (ex: Deadlift) ne doit jamais être proposé, 
    // même s'il recrute le biceps en secondaire et que le seuil est très bas.
    const alternatives = findEquivalences('biceps_curl', 10);
    
    const hasTier1 = alternatives.some(a => a.tier_snc === 1);
    expect(hasTier1).toBe(false);
  });

  it('correctly uses equipment metadata for front-end agnostic grouping', () => {
    const alternatives = findEquivalences('lat_pulldown', 60);
    
    // Le tirage poitrine (machine) a pour équivalent majeur les tractions (pdc)
    const pullUps = alternatives.find(a => a.exerciseId === 'pull_ups');
    expect(pullUps).toBeDefined();
    expect(pullUps?.equipment).toBe('pdc');
  });

  it('generates dynamic fallback matrices for exercises without static defaults', () => {
    // Si on cherche un exo qui n'a pas de DEFAULT_EXERCISE_TENSION_MATRICES
    // Il devrait quand même trouver des alternatives basées sur ses primary/secondary muscles.
    // 'good_mornings' n'a pas de matrice explicite dans les 30 premiers.
    const alternatives = findEquivalences('good_mornings', 50);
    expect(alternatives.length).toBeGreaterThan(0);
  });
});
