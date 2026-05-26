import { describe, it, expect } from 'vitest';
import { runWeeklySimulationAsync, runWeeklySimulation } from '../engine';
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
    joint_stressors: []
  }
];

const mockBlueprint: WeeklyBlueprint = {
  Lundi: [{
    id: 'ex1',
    exerciseId: 'bench_press',
    active: true,
    sets: [{ active: true, type: 'work', reps: 10, poids: 80, rpe: 8, series: 3 }]
  }],
  Mardi: [], Mercredi: [], Jeudi: [], Vendredi: [], Samedi: [], Dimanche: []
};

describe('engine math simulation', () => {
  it('runWeeklySimulation génère un résultat valide (synchronous)', () => {
    const result = runWeeklySimulation(mockBlueprint, mockProfile, {}, undefined, mockLibrary);
    
    expect(result.sncScore).toBeGreaterThan(0);
    expect(result.muscles.chest).toBeDefined();
    expect(['grey', 'green', 'orange']).toContain(result.muscles.chest?.color);
  });

  it('runWeeklySimulationAsync renvoie le même résultat', async () => {
    const syncResult = runWeeklySimulation(mockBlueprint, mockProfile, {}, undefined, mockLibrary);
    const asyncResult = await runWeeklySimulationAsync(mockBlueprint, mockProfile, {}, undefined, mockLibrary);
    
    expect(asyncResult.sncScore).toBe(syncResult.sncScore);
    expect(asyncResult.muscles.chest?.inol).toBe(syncResult.muscles.chest?.inol);
  });

  it('ne crashe pas avec un blueprint vide', async () => {
    const emptyBlueprint: WeeklyBlueprint = {
      Lundi: [], Mardi: [], Mercredi: [], Jeudi: [], Vendredi: [], Samedi: [], Dimanche: []
    };
    
    const result = await runWeeklySimulationAsync(emptyBlueprint, mockProfile, {}, undefined, mockLibrary);
    expect(result.sncScore).toBe(0);
    // Au repos total, le chest devrait être au statut REST (grey) avec 0 fatigue
    expect(result.muscles.chest?.color).toBe('grey');
  });
});
