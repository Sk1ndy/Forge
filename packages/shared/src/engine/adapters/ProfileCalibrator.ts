import { OnboardingPayload, UserProfile, UserPRs } from '../../schemas';

/**
 * Moteur d'Inférence et de Calibration de Profil.
 * Prend un payload "incomplet" de l'UI (ex: pas de PRs, juste un niveau et un poids),
 * et génère un UserProfile complet mathématiquement cohérent pour le Core Engine.
 */
export class ProfileCalibrator {
  // Ratios de force standardisés (Symmetric Strength / ExRx) basés sur le PDC
  // Multiplicateur * Poids de Corps = 1RM théorique
  private static readonly STRENGTH_RATIOS = {
    male: {
      beginner:     { squat: 0.6, bench: 0.5, deadlift: 0.8, ohp: 0.3 }, // Réduits pour sécurité
      intermediate: { squat: 1.2, bench: 1.0, deadlift: 1.5, ohp: 0.6 },
      advanced:     { squat: 1.6, bench: 1.3, deadlift: 2.0, ohp: 0.8 }
    },
    female: {
      beginner:     { squat: 0.4, bench: 0.3, deadlift: 0.6, ohp: 0.2 }, // Réduits pour sécurité
      intermediate: { squat: 0.9, bench: 0.6, deadlift: 1.2, ohp: 0.4 },
      advanced:     { squat: 1.2, bench: 0.9, deadlift: 1.6, ohp: 0.6 }
    }
  };

  // Matrice de conversion: Machine -> Free Weight équivalent
  private static readonly MACHINE_CONVERSION_RATES: Record<string, { target: keyof UserPRs; multiplier: number }> = {
    'leg_press': { target: 'squat', multiplier: 0.45 },
    'chest_press': { target: 'bench', multiplier: 0.85 },
    'lat_pulldown': { target: 'deadlift', multiplier: 1.2 }
  };

  // Facteur de sécurité pour éviter le sur-entraînement en Semaine 1
  private static readonly SANDBAGGING_MULTIPLIER = 0.9;

  /**
   * Formule de Brzycki/Epley modifiée pour estimer un 1RM.
   * Plafonnée à 10 répétitions pour éviter les aberrations mathématiques.
   */
  private static estimate1RM(weight: number, reps: number): number {
    if (reps <= 1) return weight;
    const effectiveReps = Math.min(reps, 10);
    // Epley formula: 1RM = W * (1 + R / 30)
    return Math.round(weight * (1 + effectiveReps / 30));
  }

  /**
   * Génère un UserProfile valide pour le moteur à partir d'un Payload flexible.
   */
  public static calibrate(payload: OnboardingPayload): UserProfile {
    const pdc = payload.pdc;
    const gender = payload.gender || 'male';
    const experience = payload.experience_level || 'beginner';
    
    // Baseline Defaults based on Demographic (Avec Sandbagging)
    const baselineRatios = this.STRENGTH_RATIOS[gender][experience];
    const defaultPRs: UserPRs = {
      squat: Math.round(pdc * baselineRatios.squat * this.SANDBAGGING_MULTIPLIER),
      bench: Math.round(pdc * baselineRatios.bench * this.SANDBAGGING_MULTIPLIER),
      deadlift: Math.round(pdc * baselineRatios.deadlift * this.SANDBAGGING_MULTIPLIER),
      ohp: Math.round(pdc * baselineRatios.ohp * this.SANDBAGGING_MULTIPLIER)
    };

    const finalPRs: UserPRs = { ...defaultPRs };

    // 1. Appliquer les PRs estimés via Lifts Récents (Brzycki/Epley + Machine Conversion)
    if (payload.recent_lifts && payload.recent_lifts.length > 0) {
      for (const lift of payload.recent_lifts) {
        let estimated1RM = this.estimate1RM(lift.poids, lift.reps);
        
        // Convertir si c'est une machine
        let targetExo = lift.exo as keyof UserPRs;
        if (this.MACHINE_CONVERSION_RATES[lift.exo]) {
          const conversion = this.MACHINE_CONVERSION_RATES[lift.exo];
          estimated1RM = estimated1RM * conversion.multiplier;
          targetExo = conversion.target;
        }

        // Appliquer le Sandbagging sur l'estimation théorique, sauf si c'est déjà un 1RM absolu testé (reps=1)
        if (lift.reps > 1) {
           estimated1RM *= this.SANDBAGGING_MULTIPLIER;
        }

        // Remplacer seulement si l'estimation est supérieure à la baseline démographique,
        // ou si la baseline n'était pas fiable. On garde l'estimation la plus directe.
        finalPRs[targetExo] = Math.round(estimated1RM);
      }
    }

    // 2. Appliquer les PRs exacts fournis (Vérité Absolue : Pas de Sandbagging)
    if (payload.known_prs) {
      if (payload.known_prs.squat) finalPRs.squat = payload.known_prs.squat;
      if (payload.known_prs.bench) finalPRs.bench = payload.known_prs.bench;
      if (payload.known_prs.deadlift) finalPRs.deadlift = payload.known_prs.deadlift;
      if (payload.known_prs.ohp) finalPRs.ohp = payload.known_prs.ohp;
    }

    // Calcul du SNC Max Baseline (capacité de travail nerveux)
    let maxSnc = 15.0; // Intermediaire classique
    if (experience === 'beginner') maxSnc = 10.0;
    if (experience === 'advanced') maxSnc = 25.0;

    return {
      pdc: pdc,
      isBeginner: experience === 'beginner',
      prs: finalPRs,
      maxSnc: maxSnc,
      caloricStatus: 'maintenance',
      stressLevel: 'moderate'
    };
  }
}
