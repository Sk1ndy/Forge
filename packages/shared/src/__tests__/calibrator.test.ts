import { describe, it, expect } from 'vitest';
import { ProfileCalibrator } from '../engine/adapters/ProfileCalibrator';
import { OnboardingPayload } from '../schemas';

describe('ProfileCalibrator: Inférence et Sécurité', () => {
  it('Cascade 1 : Les known_prs écrasent tout (Pas de Sandbagging)', () => {
    const payload: OnboardingPayload = {
      pdc: 80,
      gender: 'male',
      experience_level: 'advanced',
      known_prs: { bench: 120 } // L'athlète donne un vrai PR
    };

    const profile = ProfileCalibrator.calibrate(payload);
    
    // Le bench devrait être exactement 120 (vérité absolue)
    expect(profile.prs.bench).toBe(120);
    // Le squat devrait être généré par le fallback (Advanced = 1.6x PDC * 0.9 = 80 * 1.6 * 0.9 = 115)
    expect(profile.prs.squat).toBe(115); 
  });

  it('Cascade 2 : Estimation Epley + Sandbagging (recent_lifts)', () => {
    const payload: OnboardingPayload = {
      pdc: 80,
      gender: 'male',
      experience_level: 'intermediate',
      recent_lifts: [
        { exo: 'bench', poids: 80, reps: 5 }
      ]
    };

    const profile = ProfileCalibrator.calibrate(payload);
    
    // Epley pur : 80 * (1 + 5/30) = 80 * 1.166 = 93.33 -> 93
    // Avec Sandbagging 0.9 : 93 * 0.9 = 83.7 -> 84
    expect(profile.prs.bench).toBe(84);
  });

  it('Cascade 2 bis : Plafond de 10 reps sur Epley pour éviter une surestimation mortelle', () => {
    const payload: OnboardingPayload = {
      pdc: 80,
      gender: 'male',
      experience_level: 'beginner',
      recent_lifts: [
        { exo: 'bench', poids: 60, reps: 30 } // L'athlète fait 30 reps !
      ]
    };

    const profile = ProfileCalibrator.calibrate(payload);
    
    // Si Epley n'était pas plafonné : 60 * (1 + 30/30) = 120kg.
    // Avec le plafond à 10 reps : 60 * (1 + 10/30) = 80kg.
    // Sandbagging (0.9) : 80 * 0.9 = 72kg.
    expect(profile.prs.bench).toBe(72);
  });

  it('Cascade 2 ter : Matrice de conversion Machine -> SBD', () => {
    const payload: OnboardingPayload = {
      pdc: 80,
      gender: 'male',
      experience_level: 'intermediate',
      recent_lifts: [
        { exo: 'leg_press', poids: 200, reps: 1 } // 1RM à la presse à cuisse
      ]
    };

    const profile = ProfileCalibrator.calibrate(payload);
    
    // Conversion Leg Press (0.45) : 200 * 0.45 = 90kg au Squat.
    // Pas de Sandbagging sur les PRs estimés à 1 seule rep.
    expect(profile.prs.squat).toBe(90);
  });

  it('Cascade 3 : Fallback Démographique par défaut (Sandbaggé)', () => {
    const payload: OnboardingPayload = {
      pdc: 100, // 100kg
      gender: 'male',
      experience_level: 'beginner' // ratio de 0.6 pour le squat
    };

    const profile = ProfileCalibrator.calibrate(payload);
    
    // Squat Beginner Male = 0.6 * PDC = 60kg.
    // Sandbagging (0.9) : 60 * 0.9 = 54kg.
    expect(profile.prs.squat).toBe(54);
    // SNC Max Beginner = 10.0
    expect(profile.maxSnc).toBe(10.0);
  });
});
