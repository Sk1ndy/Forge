import { DEFAULT_EXERCISE_LIBRARY } from '../../constants';

export interface WarmupSet {
  weight: number;
  reps: number;
  note: string;
}

/**
 * Génère un protocole d'échauffement pyramidal spécifique à l'exercice.
 * Ne fait PAS de Plate Math (arrondis à 2.5 ou 5), l'Engine doit retourner des 
 * mathématiques pures. Le front-end s'occupe de l'arrondi aux disques matériels (UI).
 * 
 * @param exerciseId L'identifiant de l'exercice pour déterminer le Tier et l'équipement
 * @param targetWeight Le poids cible de la série de travail (en kg brut)
 * @param oneRepMax Le 1RM estimé ou réel de l'utilisateur sur cet exercice (en kg brut)
 */
export function generateWarmupProtocol(
  exerciseId: string,
  targetWeight: number,
  oneRepMax: number
): WarmupSet[] {
  const exerciseDef = DEFAULT_EXERCISE_LIBRARY.find(e => e.id === exerciseId) || DEFAULT_EXERCISE_LIBRARY[0];
  const isBodyweight = exerciseDef.equipment === 'pdc';
  const isMachine = exerciseDef.equipment === 'machine';
  const isFreeWeight = exerciseDef.equipment === 'poids_libre';
  const tier_snc = exerciseDef.tier_snc;

  // Clause de garde : PDC ou charge très légère
  if (isBodyweight || targetWeight < 20) {
    return [
      { weight: 0, reps: 10, note: "Échauffement articulaire et amplitude complète" }
    ];
  }

  const warmup: WarmupSet[] = [];
  
  // Barre à vide obligatoire pour les gros mouvements Tier 1 & 2 en POIDS LIBRE (Barre/Haltères)
  // Une machine (ex: Poulie) n'a pas de "barre à vide" de 20kg
  if (tier_snc <= 2 && targetWeight >= 40 && isFreeWeight) {
    warmup.push({ weight: 20, reps: 10, note: "Barre à vide / Haltères légères, focus technique" });
  }

  if (tier_snc === 1) {
    // Protocole lourd (ex: Squat, Deadlift) : 40% x 5, 60% x 3, 80% x 1
    const p40 = Math.round(oneRepMax * 0.4);
    const p60 = Math.round(oneRepMax * 0.6);
    const p80 = Math.round(oneRepMax * 0.8);

    if (p40 > 20 && p40 < targetWeight) warmup.push({ weight: p40, reps: 5, note: "Activation nerveuse, vitesse maximale" });
    if (p60 > p40 && p60 < targetWeight) warmup.push({ weight: p60, reps: 3, note: "Préparation neuromusculaire" });
    if (p80 > p60 && p80 < targetWeight) warmup.push({ weight: p80, reps: 1, note: "Poids de potentiation (Sans fatigue)" });

  } else if (tier_snc === 2) {
    // Protocole intermédiaire (ex: Développé incliné, Leg Press) : 50% x 5, 75% x 2
    const p50 = Math.round(oneRepMax * 0.5);
    const p75 = Math.round(oneRepMax * 0.75);

    if (p50 > 20 && p50 < targetWeight) warmup.push({ weight: p50, reps: 5, note: "Acclimatation" });
    if (p75 > p50 && p75 < targetWeight) warmup.push({ weight: p75, reps: 2, note: "Lien neuromusculaire" });

  } else {
    // Tier 3 (Isolation, ex: Curls) : Un seul palier à 50% pour afflux sanguin
    const p50 = Math.round(oneRepMax * 0.5);
    if (p50 > 5 && p50 < targetWeight) {
      warmup.push({ weight: p50, reps: 8, note: "Afflux sanguin (Pompe)" });
    }
  }

  // Filtrage final par sécurité : on évite les doublons ou poids absurdes
  return warmup.filter((set, index, self) => 
    index === self.findIndex((t) => t.weight === set.weight) && set.weight < targetWeight || set.weight === 20
  );
}
