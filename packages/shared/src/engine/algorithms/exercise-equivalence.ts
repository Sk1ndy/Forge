import { DEFAULT_EXERCISE_LIBRARY, DEFAULT_EXERCISE_TENSION_MATRICES } from '../../constants';
import { MuscleId } from '../../types';

export interface ExerciseAlternative {
  exerciseId: string;
  nom: string;
  equipment: string;
  tier_snc: number;
  matchPercentage: number;
}

/**
 * Calcule la similarité cosinus entre deux vecteurs de tension musculaire.
 * Score de 0 (aucune corrélation) à 1 (profils musculaires identiques).
 */
function cosineSimilarity(
  vecA: Partial<Record<MuscleId, number>>,
  vecB: Partial<Record<MuscleId, number>>
): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  const allKeys = new Set([...Object.keys(vecA), ...Object.keys(vecB)] as MuscleId[]);

  for (const key of allKeys) {
    const valA = vecA[key] || 0;
    const valB = vecB[key] || 0;
    dotProduct += valA * valB;
    normA += valA * valA;
    normB += valB * valB;
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Construit un vecteur de tension garanti (utilise la matrice statique si dispo,
 * sinon fallback généré dynamiquement via les propriétés de l'exercice).
 */
function getTensionMatrix(exerciseId: string, def: any): Partial<Record<MuscleId, number>> {
  const existing = DEFAULT_EXERCISE_TENSION_MATRICES[exerciseId];
  if (existing && Object.keys(existing).length > 0) return existing;
  
  const mat: Partial<Record<MuscleId, number>> = {};
  mat[def.muscle_primaire] = 1.0;
  def.muscles_secondaires?.forEach((m: MuscleId) => { mat[m] = 0.4; });
  return mat;
}

/**
 * Trouve les meilleures alternatives pour un exercice donné.
 * Respecte les ENGINEERING_STANDARDS :
 * - Pas de substitution Tier 1 <-> Tier 3 (Filtre SNC strict).
 * - Retourne l'équipement brut, laissant le front-end filtrer selon ce qui est dispo en salle.
 * 
 * @param sourceExerciseId ID de l'exercice à remplacer
 * @param minScore Seuil de pourcentage de similarité (défaut: 70)
 */
export function findEquivalences(
  sourceExerciseId: string,
  minScore: number = 70
): ExerciseAlternative[] {
  const sourceDef = DEFAULT_EXERCISE_LIBRARY.find(e => e.id === sourceExerciseId);
  if (!sourceDef) return [];

  const sourceMatrix = getTensionMatrix(sourceExerciseId, sourceDef);
  const results: ExerciseAlternative[] = [];

  for (const targetDef of DEFAULT_EXERCISE_LIBRARY) {
    if (targetDef.id === sourceExerciseId) continue;

    // RÈGLE D'OR : On ne remplace pas un exo composé lourd (Tier 1) par un exo d'isolation (Tier 3)
    // Tolérance d'écart de Tier : +/- 1 maximum.
    if (Math.abs(sourceDef.tier_snc - targetDef.tier_snc) > 1) continue;

    const targetMatrix = getTensionMatrix(targetDef.id, targetDef);
    const similarity = cosineSimilarity(sourceMatrix, targetMatrix);
    const matchPercentage = Math.round(similarity * 100);

    if (matchPercentage >= minScore) {
      results.push({
        exerciseId: targetDef.id,
        nom: targetDef.nom,
        equipment: targetDef.equipment,
        tier_snc: targetDef.tier_snc,
        matchPercentage
      });
    }
  }

  // Tri décroissant par pertinence biomécanique
  return results.sort((a, b) => b.matchPercentage - a.matchPercentage);
}
