import { ExerciseLog } from '@forge/shared';

export interface ProgressiveSuggestion {
  suggestedWeight: number;
  suggestedReps: number;
  reasoning: string;
}

/**
 * Moteur de surcharge progressive pour suggérer les paramètres de la prochaine séance.
 */
export function getProgressiveSuggestion(exerciseId: string, lastSessionLog: ExerciseLog): ProgressiveSuggestion {
  const currentWeight = lastSessionLog.actual_weight ?? 0;
  const currentReps = lastSessionLog.actual_reps ?? 0;
  const currentRpe = lastSessionLog.actual_rpe ?? 8;

  // Règle 1: RPE < 8 (La charge était très maîtrisable, on augmente le poids)
  if (currentRpe < 8) {
    return {
      suggestedWeight: currentWeight + 2.5,
      suggestedReps: currentReps,
      reasoning: "RPE < 8 : Bonne marge, augmentation de la charge (+2.5kg)."
    };
  }
  
  // Règle 2: RPE entre 8 et 9 (Effort soutenu, on cherche la progression par le volume)
  if (currentRpe >= 8 && currentRpe < 10) {
    return {
      suggestedWeight: currentWeight,
      suggestedReps: currentReps + 1,
      reasoning: "RPE 8-9 : Effort optimal. On vise une répétition supplémentaire avant de monter le poids."
    };
  }

  // Règle 3: RPE 10 (Échec technique ou musculaire atteint, on consolide)
  return {
    suggestedWeight: currentWeight,
    suggestedReps: currentReps,
    reasoning: "RPE 10 : Échec atteint. L'objectif est de consolider cette charge sans ajouter de fatigue."
  };
}
