import { DEFAULT_EXERCISE_LIBRARY } from '../../constants';

export interface IntraSessionAdjustment {
  action: 'maintain' | 'drop_weight' | 'drop_reps' | 'increase_weight' | 'increase_reps';
  newWeight: number;
  newReps: number;
  reason: string;
}

/**
 * Régulateur de séance en temps réel.
 * Ajuste la charge ou le volume de la prochaine série si la série précédente 
 * a dévié significativement du RPE cible.
 * 
 * Respecte les ENGINEERING_STANDARDS :
 * - Modifie la charge mathématiquement (sans biais de disques).
 * - Modifie les répétitions si l'exercice est au PDC ou si la charge est déjà nulle.
 * - Le Tier SNC dicte l'agressivité de la correction (on protège plus un Squat qu'un Curl).
 * 
 * @param exerciseId L'ID de l'exercice en cours
 * @param targetRPE Le RPE ciblé pour la prochaine série
 * @param actualWeight Le poids levé à la série venant de se terminer
 * @param actualReps Les répétitions accomplies à la série venant de se terminer
 * @param actualRPE Le RPE ressenti et déclaré à la série venant de se terminer
 */
export function regulateNextSet(
  exerciseId: string,
  targetRPE: number,
  actualWeight: number,
  actualReps: number,
  actualRPE: number
): IntraSessionAdjustment {
  const exDef = DEFAULT_EXERCISE_LIBRARY.find(e => e.id === exerciseId) || DEFAULT_EXERCISE_LIBRARY[0];
  const isPdc = exDef.equipment === 'pdc';
  const tier = exDef.tier_snc;

  const deltaRPE = actualRPE - targetRPE;

  // Marge de tolérance (-0.5 à +0.5 RPE) : Pas d'intervention
  if (Math.abs(deltaRPE) <= 0.5) {
    return {
      action: 'maintain',
      newWeight: actualWeight,
      newReps: actualReps,
      reason: "Performance nominale."
    };
  }

  // SURCHARGE : Le RPE ressenti est trop élevé
  if (deltaRPE >= 1.0) {
    if (isPdc || actualWeight <= 0) {
      // PDC ou charge nulle : on ampute le volume (1 RPE d'écart = ~1 rep en moins)
      const repDrop = Math.max(1, Math.round(deltaRPE));
      const newReps = Math.max(1, actualReps - repDrop);
      return {
        action: 'drop_reps',
        newWeight: actualWeight,
        newReps,
        reason: `RPE dépassé (+${deltaRPE}). Baisse du volume pour protéger le système.`
      };
    } else {
      // Poids libre / Machine : baisse de la charge
      // Tier 1 (Lourd) = Drop de 5% par point de RPE (Protection SNC max)
      // Tier 3 (Isolation) = Drop de 3% par point de RPE
      const penaltyPct = tier === 1 ? 0.05 : tier === 2 ? 0.04 : 0.03;
      const weightDrop = actualWeight * (deltaRPE * penaltyPct);
      const newWeight = Math.max(0, Math.round(actualWeight - weightDrop));
      
      return {
        action: 'drop_weight',
        newWeight,
        newReps: actualReps,
        reason: `Surcharge nerveuse détectée (+${deltaRPE} RPE). Poids réduit de ${Math.round(deltaRPE * penaltyPct * 100)}%.`
      };
    }
  }

  // SOUS-CHARGE : L'utilisateur a sous-estimé sa force (marge de progression)
  if (deltaRPE <= -1.0) {
    if (isPdc || actualWeight <= 0) {
      const repGain = Math.max(1, Math.round(Math.abs(deltaRPE)));
      return {
        action: 'increase_reps',
        newWeight: actualWeight,
        newReps: actualReps + repGain,
        reason: `Marge détectée (${deltaRPE} RPE). Ajout de répétitions.`
      };
    } else {
      // Augmentation de charge prudente
      // Tier 1 = Boost lent (2.5% par RPE) pour éviter la blessure
      // Tier 3 = Boost rapide (5% par RPE)
      const boostPct = tier === 1 ? 0.025 : 0.05;
      const weightGain = actualWeight * (Math.abs(deltaRPE) * boostPct);
      const newWeight = Math.round(actualWeight + weightGain);
      
      return {
        action: 'increase_weight',
        newWeight,
        newReps: actualReps,
        reason: `Performance optimale (${deltaRPE} RPE). Augmentation sécurisée de la charge.`
      };
    }
  }

  return {
    action: 'maintain',
    newWeight: actualWeight,
    newReps: actualReps,
    reason: "Performance nominale."
  };
}
