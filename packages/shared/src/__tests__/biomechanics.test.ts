import { describe, it, expect } from 'vitest';
import { calculateSetImpact } from '../biomechanics';
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

const mockExercise: Exercise = {
  id: 'bench_press',
  nom: 'Développé Couché',
  description: '',
  instructions: [],
  equipment: 'poids_libre',
  muscle_primaire: 'chest',
  muscles_secondaires: ['frontDeltoid', 'triceps'],
  tension_matrix: { chest: 1.0, frontDeltoid: 0.5, triceps: 0.5 },
  systemic_fatigue_factor: 1.0,
  poids_pdc_factor: 0,
  tier_snc: 2,
  video_url: '',
  ppl_category: 'push',
  biomechanics: { rom: 'normal', stability: 'moderate', movement_plane: 'horizontal' },
  joint_stressors: ['shoulder', 'elbow']
};

describe('biomechanics engine', () => {
  it('calcule correctement un impact de set nominal', () => {
    const set: PlannedSet = { active: true, type: 'work', reps: 10, poids: 80, rpe: 8, series: 1 };
    const { inol, sncPoints } = calculateSetImpact(set, mockExercise, mockProfile, false);
    
    // RPE 8 = ~2 reps in reserve. INOL devrait être modéré mais mesurable.
    expect(inol).toBeGreaterThan(0.2);
    expect(inol).toBeLessThan(1.5);
    expect(sncPoints).toBeGreaterThan(0.1);
  });

  it('clamp et neutralise les sets aberrants (poids excessif)', () => {
    // Poids ridicule (10 000kg) -> les guards dans biomechanics doivent clamer à 1000 max, 
    // mais le calcul ne doit pas exploser l'INOL à l'infini (il est limité).
    const set: PlannedSet = { active: true, type: 'work', reps: 10, poids: 10000, rpe: 10, series: 1 };
    const { inol } = calculateSetImpact(set, mockExercise, mockProfile, false);
    
    expect(inol).toBeLessThan(5.0); // Le système doit bloquer/clamper un INOL délirant
  });

  it('gère correctement les sets inactifs', () => {
    const set: PlannedSet = { active: false, type: 'work', reps: 10, poids: 80, rpe: 8, series: 1 };
    const { inol, sncPoints } = calculateSetImpact(set, mockExercise, mockProfile, false);
    
    expect(inol).toBe(0);
    expect(sncPoints).toBe(0);
  });
});
