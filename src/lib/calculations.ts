export type MuscleId =
  | 'abs' | 'biceps' | 'calves' | 'chest' | 'deltoids' 
  | 'feet' | 'forearm' | 'gluteal' | 'hamstring' | 'hands' 
  | 'head' | 'knees' | 'lowerBack' | 'obliques' | 'quadriceps' 
  | 'tibialis' | 'trapezius' | 'triceps' | 'upperBack' 
  | 'rotatorCuff' | 'serratus' | 'rhomboids'
  | 'ankles' | 'adductors' | 'neck' | 'hipFlexors' 
  | 'upperChest' | 'lowerChest' | 'innerQuad' | 'outerQuad' 
  | 'upperAbs' | 'lowerAbs' | 'frontDeltoid' | 'rearDeltoid' 
  | 'upperTrapezius' | 'lowerTrapezius';

export interface Exercise {
  id: string;
  nom: string;
  tier_snc: 1 | 2 | 3;
  muscle_primaire: MuscleId;
  muscles_secondaires: MuscleId[];
  equipment: 'poids_libre' | 'machine' | 'pdc';
}

export interface UserPRs {
  squat: number;
  bench: number;
  deadlift: number;
  ohp: number;
}

export interface UserProfile {
  pdc: number; // Poids de Corps
  prs: UserPRs;
  maxSnc: number; // Capacité max SNC
}

export interface PlannedSet {
  series: number;
  reps: number;
  poids: number;
  rpe: number;
  active: boolean;
}

export interface PlannedExercise {
  id: string; // ID unique de l'instance planifiée
  exerciseId: string; // ID de l'exercice dans la bibliothèque
  sets: PlannedSet[];
  active: boolean;
}

export interface WeeklyBlueprint {
  [day: string]: PlannedExercise[]; // ex: { 'Lundi': [...], 'Mardi': [...] }
}

export interface MuscleStatus {
  name: string;
  inol: number; // Modélise l'accumulation cumulée de fatigue/volume
  sets: number;
  color: 'grey' | 'green' | 'orange' | 'red';
  statusLabel: string;
  contributors: { nom: string; percentage: number }[];
}

export interface SimulationResult {
  muscles: { [muscleId in MuscleId]?: MuscleStatus };
  sncScore: number;
  sncPercentage: number;
  cnsFailure: boolean;
}

// Liste de tous les exercices prédéfinis de la bibliothèque
export const EXERCISE_LIBRARY: Exercise[] = [
  { id: 'squat', nom: 'Squat Arrière', tier_snc: 1, muscle_primaire: 'quadriceps', muscles_secondaires: ['gluteal', 'hamstring', 'lowerBack'], equipment: 'poids_libre' },
  { id: 'deadlift', nom: 'Soulevé de Terre', tier_snc: 1, muscle_primaire: 'lowerBack', muscles_secondaires: ['gluteal', 'hamstring', 'trapezius', 'forearm', 'upperBack'], equipment: 'poids_libre' },
  { id: 'bench_press', nom: 'Développé Couché', tier_snc: 2, muscle_primaire: 'chest', muscles_secondaires: ['frontDeltoid', 'triceps'], equipment: 'poids_libre' },
  { id: 'ohp', nom: 'Overhead Press (OHP)', tier_snc: 1, muscle_primaire: 'frontDeltoid', muscles_secondaires: ['triceps', 'trapezius'], equipment: 'poids_libre' },
  { id: 'pull_ups', nom: 'Tractions', tier_snc: 2, muscle_primaire: 'upperBack', muscles_secondaires: ['biceps', 'forearm', 'trapezius'], equipment: 'pdc' },
  { id: 'barbell_row', nom: 'Rowing Barre', tier_snc: 1, muscle_primaire: 'upperBack', muscles_secondaires: ['trapezius', 'biceps', 'lowerBack', 'forearm'], equipment: 'poids_libre' },
  { id: 'dips', nom: 'Dips', tier_snc: 2, muscle_primaire: 'chest', muscles_secondaires: ['triceps', 'frontDeltoid'], equipment: 'pdc' },
  { id: 'biceps_curl', nom: 'Curl Biceps (Barre/Haltères)', tier_snc: 3, muscle_primaire: 'biceps', muscles_secondaires: ['forearm'], equipment: 'poids_libre' },
  { id: 'triceps_pushdown', nom: 'Extension Triceps Poulie', tier_snc: 3, muscle_primaire: 'triceps', muscles_secondaires: [], equipment: 'machine' },
  { id: 'incline_bench', nom: 'Développé Incliné', tier_snc: 2, muscle_primaire: 'chest', muscles_secondaires: ['frontDeltoid', 'triceps'], equipment: 'poids_libre' },
  { id: 'leg_press', nom: 'Presse à Cuisses', tier_snc: 2, muscle_primaire: 'quadriceps', muscles_secondaires: ['gluteal'], equipment: 'machine' },
  { id: 'leg_curl', nom: 'Leg Curl', tier_snc: 3, muscle_primaire: 'hamstring', muscles_secondaires: [], equipment: 'machine' },
  { id: 'leg_extension', nom: 'Leg Extension', tier_snc: 3, muscle_primaire: 'quadriceps', muscles_secondaires: [], equipment: 'machine' },
  { id: 'lateral_raise', nom: 'Élévations Latérales', tier_snc: 3, muscle_primaire: 'deltoids', muscles_secondaires: [], equipment: 'poids_libre' },
  { id: 'face_pull', nom: 'Face Pull', tier_snc: 3, muscle_primaire: 'rearDeltoid', muscles_secondaires: ['trapezius'], equipment: 'machine' },
  { id: 'calf_raise', nom: 'Mollets Debout', tier_snc: 3, muscle_primaire: 'calves', muscles_secondaires: [], equipment: 'poids_libre' },
  { id: 'crunchs', nom: 'Crunchs Abdominaux', tier_snc: 3, muscle_primaire: 'abs', muscles_secondaires: [], equipment: 'pdc' },
  { id: 'plank', nom: 'Planche Gainage', tier_snc: 3, muscle_primaire: 'abs', muscles_secondaires: ['obliques', 'lowerBack'], equipment: 'pdc' },
  { id: 'lunges', nom: 'Fentes Haltères', tier_snc: 2, muscle_primaire: 'quadriceps', muscles_secondaires: ['gluteal', 'hamstring'], equipment: 'poids_libre' },
  { id: 'hip_thrust', nom: 'Hip Thrust', tier_snc: 2, muscle_primaire: 'gluteal', muscles_secondaires: ['hamstring'], equipment: 'poids_libre' },
  { id: 'pec_deck', nom: 'Pec Deck', tier_snc: 3, muscle_primaire: 'chest', muscles_secondaires: [], equipment: 'machine' },
  { id: 'lat_pulldown', nom: 'Tirage Poitrine Poulie', tier_snc: 2, muscle_primaire: 'upperBack', muscles_secondaires: ['biceps', 'trapezius', 'forearm'], equipment: 'machine' }
];

export const MUSCLE_DETAILS: Record<MuscleId, string> = {
  abs: 'Abdominaux',
  biceps: 'Biceps',
  calves: 'Mollets',
  chest: 'Pectoraux',
  deltoids: 'Deltoïdes Latéraux',
  feet: 'Pieds',
  forearm: 'Avant-bras',
  gluteal: 'Fessiers',
  hamstring: 'Ischio-jambiers',
  hands: 'Mains',
  head: 'Tête',
  knees: 'Genoux',
  lowerBack: 'Lombaires',
  obliques: 'Obliques',
  quadriceps: 'Quadriceps',
  tibialis: 'Jambier Antérieur',
  trapezius: 'Trapèzes',
  triceps: 'Triceps',
  upperBack: 'Grand Dorsal / Haut du Dos',
  rotatorCuff: 'Coiffe des Rotateurs',
  serratus: 'Dentelé Antérieur',
  rhomboids: 'Rhomboïdes',
  ankles: 'Chevilles',
  adductors: 'Adducteurs',
  neck: 'Cou',
  hipFlexors: 'Fléchisseurs de Hanche',
  upperChest: 'Pectoraux Supérieurs',
  lowerChest: 'Pectoraux Inférieurs',
  innerQuad: 'Quadriceps Interne',
  outerQuad: 'Quadriceps Externe',
  upperAbs: 'Abdominaux Supérieurs',
  lowerAbs: 'Abdominaux Inférieurs',
  frontDeltoid: 'Deltoïde Antérieur',
  rearDeltoid: 'Deltoïde Postérieur',
  upperTrapezius: 'Trapèze Supérieur',
  lowerTrapezius: 'Trapèze Inférieur'
};

// ─── 1. MATRICES DE TENSION BIOMÉCANIQUES PRÉCISES (Coefficients physiologiques) ───
export const EXERCISE_TENSION_MATRICES: Record<string, Partial<Record<MuscleId, number>>> = {
  squat: { quadriceps: 1.0, gluteal: 0.7, lowerBack: 0.4, hamstring: 0.15 },
  deadlift: { lowerBack: 1.0, gluteal: 0.8, hamstring: 0.85, trapezius: 0.5, forearm: 0.4, upperBack: 0.3 },
  bench_press: { chest: 1.0, frontDeltoid: 0.6, triceps: 0.5 },
  ohp: { frontDeltoid: 1.0, triceps: 0.5, upperChest: 0.2, trapezius: 0.3 },
  pull_ups: { upperBack: 1.0, biceps: 0.6, forearm: 0.4, trapezius: 0.2 },
  barbell_row: { upperBack: 1.0, trapezius: 0.6, rhomboids: 0.6, biceps: 0.5, lowerBack: 0.5, forearm: 0.4 },
  dips: { lowerChest: 0.8, chest: 0.4, triceps: 0.8, frontDeltoid: 0.5 },
  biceps_curl: { biceps: 1.0, forearm: 0.3 },
  triceps_pushdown: { triceps: 1.0 },
  incline_bench: { upperChest: 1.0, chest: 0.4, frontDeltoid: 0.7, triceps: 0.4 },
  leg_press: { quadriceps: 1.0, gluteal: 0.4 },
  leg_curl: { hamstring: 1.0 },
  leg_extension: { quadriceps: 1.0 },
  lateral_raise: { deltoids: 1.0 }, // Cible le groupe parent pour inclure le faisceau latéral
  face_pull: { rearDeltoid: 1.0, trapezius: 0.5, rhomboids: 0.6 },
  calf_raise: { calves: 1.0 },
  crunchs: { abs: 1.0 },
  plank: { abs: 1.0, obliques: 0.5, lowerBack: 0.3 },
  lunges: { quadriceps: 0.8, gluteal: 0.7, hamstring: 0.2 },
  hip_thrust: { gluteal: 1.0, hamstring: 0.3 },
  pec_deck: { chest: 1.0 },
  lat_pulldown: { upperBack: 1.0, biceps: 0.5, trapezius: 0.3, forearm: 0.2 }
};

// ─── 2. CINÉTIQUES DE RÉCUPÉRATION SPÉCIFIQUES AUX MUSCLES (Taux de rétention de fatigue par 24h) ───
export const MUSCLE_FATIGUE_DECAY: Record<MuscleId, number> = {
  abs: 0.3,
  upperAbs: 0.3,
  lowerAbs: 0.3,
  biceps: 0.3,
  calves: 0.3,
  chest: 0.5,
  upperChest: 0.5,
  lowerChest: 0.5,
  deltoids: 0.3,
  frontDeltoid: 0.3,
  rearDeltoid: 0.3,
  forearm: 0.3,
  obliques: 0.3,
  trapezius: 0.5,
  upperTrapezius: 0.5,
  lowerTrapezius: 0.5,
  triceps: 0.5,
  upperBack: 0.5,
  rhomboids: 0.5,
  rotatorCuff: 0.5,
  serratus: 0.3,
  
  quadriceps: 0.75,
  innerQuad: 0.75,
  outerQuad: 0.75,
  hamstring: 0.75,
  gluteal: 0.75,
  lowerBack: 0.75,

  // Non-interactive decorative groups
  feet: 0.3,
  hands: 0.3,
  head: 0.3,
  knees: 0.5,
  tibialis: 0.3,
  ankles: 0.3,
  adductors: 0.5,
  neck: 0.5,
  hipFlexors: 0.5
};

// Taux de rétention de la Fitness (l'adaptation s'estompe beaucoup plus lentement que la fatigue)
export const FITNESS_RETENTION_RATE = 0.92;

/**
 * Estime le 1RM théorique en utilisant la formule d'Epley modifiée par le RPE.
 */
export function estimate1RM(weight: number, reps: number, rpe: number): number {
  if (reps <= 0) return 0;
  const rpeDiff = 10 - Math.min(10, Math.max(0, rpe));
  const effectiveReps = reps + rpeDiff;
  
  if (effectiveReps <= 1) return weight;
  return weight * (1 + effectiveReps / 30);
}

/**
 * Détermine le 1RM applicable pour un exercice et un profil donnés
 */
export function getApplicable1RM(exerciseId: string, userPrs: UserPRs, weight: number, reps: number, rpe: number): number {
  if (exerciseId === 'squat') return userPrs.squat || estimate1RM(weight, reps, rpe);
  if (exerciseId === 'bench_press') return userPrs.bench || estimate1RM(weight, reps, rpe);
  if (exerciseId === 'deadlift') return userPrs.deadlift || estimate1RM(weight, reps, rpe);
  if (exerciseId === 'ohp') return userPrs.ohp || estimate1RM(weight, reps, rpe);

  return estimate1RM(weight, reps, rpe);
}

/**
 * Calcule l'impact d'une série unique (INOL et SNC) avec multiplicateur RPE exponentiel
 */
export function calculateSetImpact(
  set: PlannedSet,
  exercise: Exercise,
  profile: UserProfile
): { inol: number; sncPoints: number } {
  if (!set.active || set.series <= 0 || set.reps <= 0) {
    return { inol: 0, sncPoints: 0 };
  }

  // 1. Détermination du 1RM de référence
  const pr = getApplicable1RM(exercise.id, profile.prs, set.poids, set.reps, set.rpe);
  
  // 2. Calcul de l'intensité relative (%)
  let intensity = 70;
  if (pr > 0) {
    intensity = (set.poids / pr) * 100;
  }
  intensity = Math.min(99, Math.max(10, intensity));

  // 3. Multiplicateur RPE Exponentiel (courbe polynomiale de fatigue neurologique/physique)
  // RPE 10 = 1.0, RPE 9 = 0.55, RPE 8 = 0.30, RPE 7 = 0.17, RPE 6 = 0.09
  const clampedRpe = Math.min(10, Math.max(5, set.rpe || 8));
  const rpeFactor = Math.pow(1.8, clampedRpe - 10);

  // 4. Calcul de l'INOL brut accumulé par cette série
  const baseInol = set.reps / (100 - intensity);
  const totalInol = baseInol * rpeFactor * set.series;

  // 5. Calcul de l'impact SNC (Système Nerveux Central)
  const pdc = profile.pdc || 75;
  const weightRatio = set.poids / pdc;
  
  // Pondération de fatigue axiale SNC : Tier 1 = 100%, Tier 2 = 50%, Tier 3 (isolation) = 5%
  const sncMultiplier = exercise.tier_snc === 1 ? 1.0 : (exercise.tier_snc === 2 ? 0.5 : 0.05);

  // Formule SNC : Proportionnel au ratio de poids, au multiplicateur de Tier, et au RPE exponentiel
  const sncPoints = weightRatio * sncMultiplier * rpeFactor * set.series * 1.2;

  return { inol: totalInol, sncPoints };
}

/**
 * Exécute la simulation chronologique complète (Modèle Fitness-Fatigue Banister)
 * Retourne le snapshot de l'avatar pour le jour sélectionné (ou Dimanche par défaut)
 */
export function runWeeklySimulation(
  blueprint: WeeklyBlueprint,
  profile: UserProfile,
  toggledDays: { [day: string]: boolean } = {},
  selectedDay?: string
): SimulationResult {
  const DAYS_OF_WEEK = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

  // Initialisation des états musculaires à T0 (Lundi matin, vierge de fatigue)
  const musclesMap: {
    [muscleId: string]: {
      fatigue: number;
      fitness: number;
      sets: number;
      contributions: { [exId: string]: number };
    };
  } = {};
  
  Object.keys(MUSCLE_DETAILS).forEach(id => {
    musclesMap[id] = { fatigue: 0, fitness: 0, sets: 0, contributions: {} };
  });

  let sncFatigue = 0;

  // Clones pour capturer l'état au jour de snapshot sélectionné
  let snapshotMuscles: typeof musclesMap = JSON.parse(JSON.stringify(musclesMap));
  let snapshotSnc = 0;

  // Simulation séquentielle journalière
  DAYS_OF_WEEK.forEach(day => {
    // A. Dissipation de la fatigue et de l'adaptation accumulée (au début de chaque jour)
    Object.keys(musclesMap).forEach(id => {
      const decay = MUSCLE_FATIGUE_DECAY[id as MuscleId] ?? 0.5;
      musclesMap[id].fatigue = musclesMap[id].fatigue * decay;
      musclesMap[id].fitness = musclesMap[id].fitness * FITNESS_RETENTION_RATE;
    });

    // Dissipation très rapide du SNC (demi-vie de 24h, rétention de 0.20)
    sncFatigue = sncFatigue * 0.20;

    // B. Application des séances d'entraînement du jour (si le jour est activé)
    if (toggledDays[day] !== false) {
      const plannedExercises = blueprint[day] || [];
      plannedExercises.forEach(plannedEx => {
        if (!plannedEx.active) return;

        const exercise = EXERCISE_LIBRARY.find(e => e.id === plannedEx.exerciseId);
        if (!exercise) return;

        // Récupérer la matrice de distribution de tension pour l'exercice
        const tensionMatrix = EXERCISE_TENSION_MATRICES[plannedEx.exerciseId] || { [exercise.muscle_primaire]: 1.0 };

        plannedEx.sets.forEach(set => {
          if (!set.active) return;

          const { inol, sncPoints } = calculateSetImpact(set, exercise, profile);

          // Accumuler la fatigue centrale (SNC)
          sncFatigue += sncPoints;

          // Distribuer la fatigue périphérique (INOL) et l'adaptation (Fitness) aux muscles concernés
          Object.entries(tensionMatrix).forEach(([muscleId, coeff]) => {
            if (musclesMap[muscleId]) {
              const muscleLoad = inol * coeff;
              musclesMap[muscleId].fatigue += muscleLoad;
              musclesMap[muscleId].fitness += muscleLoad * 0.5; // Gain en Fitness = 50% de la fatigue induite
              musclesMap[muscleId].sets += set.series * coeff;
              musclesMap[muscleId].contributions[exercise.nom] = (musclesMap[muscleId].contributions[exercise.nom] || 0) + muscleLoad;
            }
          });
        });
      });
    }

    // C. Capture du snapshot s'il s'agit du jour choisi par l'utilisateur
    if (selectedDay && day.toLowerCase() === selectedDay.toLowerCase()) {
      snapshotMuscles = JSON.parse(JSON.stringify(musclesMap));
      snapshotSnc = sncFatigue;
    }
  });

  // Déterminer la source finale des données (Snapshot journalier ou bilan final du dimanche)
  const targetMuscles = selectedDay ? snapshotMuscles : musclesMap;
  const targetSnc = selectedDay ? snapshotSnc : sncFatigue;

  // ─── AGGREGATION DES SOUS-MUSCLES PHYSIOLOGIQUES VERS LES GROUPES VISUELS DE L'AVATAR ───
  // Cela garantit que la tension appliquée sur un sous-muscle (ex: upperChest) se répercute visuellement
  // sur le groupe principal de l'avatar (ex: chest) pour éviter les incohérences d'affichage.
  const aggregateMuscle = (parentKey: MuscleId, childKeys: MuscleId[]) => {
    const parent = targetMuscles[parentKey] || { fatigue: 0, fitness: 0, sets: 0, contributions: {} };
    let maxFatigue = parent.fatigue;
    let maxFitness = parent.fitness;
    let totalSets = parent.sets;
    const combinedContributions = { ...parent.contributions };

    childKeys.forEach(childKey => {
      const child = targetMuscles[childKey];
      if (child) {
        if (child.fatigue > maxFatigue) {
          maxFatigue = child.fatigue;
        }
        if (child.fitness > maxFitness) {
          maxFitness = child.fitness;
        }
        totalSets += child.sets;
        Object.entries(child.contributions).forEach(([exNom, val]) => {
          combinedContributions[exNom] = (combinedContributions[exNom] || 0) + val;
        });
      }
    });

    targetMuscles[parentKey] = {
      fatigue: maxFatigue,
      fitness: maxFitness,
      sets: totalSets,
      contributions: combinedContributions
    };
  };

  // Répercuter les sous-groupes vers les parents visuels SVG
  aggregateMuscle('chest', ['upperChest', 'lowerChest', 'serratus']);
  aggregateMuscle('quadriceps', ['innerQuad', 'outerQuad']);
  aggregateMuscle('abs', ['upperAbs', 'lowerAbs']);
  aggregateMuscle('trapezius', ['upperTrapezius', 'lowerTrapezius']);
  aggregateMuscle('upperBack', ['rhomboids', 'rotatorCuff']);
  aggregateMuscle('frontDeltoid', ['deltoids']);
  aggregateMuscle('rearDeltoid', ['deltoids']);

  // Calcul du statut du Système Nerveux Central (SNC)
  const maxSnc = profile.maxSnc || 15.0;
  const cnsFailure = targetSnc > maxSnc;

  // Construction des statuts musculaires finaux basés sur la Readiness
  const finalMuscles: { [muscleId in MuscleId]?: MuscleStatus } = {};

  Object.entries(targetMuscles).forEach(([id, data]) => {
    const mId = id as MuscleId;
    // Calcul de la Readiness (Forme nette)
    const readiness = data.fitness - data.fatigue;

    let color: 'grey' | 'green' | 'orange' | 'red' = 'grey';
    let statusLabel = 'Maintien / Repos';

    // Grille d'évaluation colorimétrique
    if (data.fitness < 0.05) {
      color = 'grey';
      statusLabel = 'Volume Insuffisant (Repos / Maintien)';
    } else if (readiness >= -0.20) {
      color = 'green';
      statusLabel = 'Zone Optimale (Hypertrophie / Surcompensation)';
    } else if (readiness < -0.20 && readiness >= -0.80) {
      color = 'orange';
      statusLabel = 'Surcharge / Fatigue modérée';
    } else {
      color = 'red';
      statusLabel = 'Surentraînement (Seuil de tolérance dépassé)';
    }

    // Extraction des 2 contributeurs majeurs
    const totalInolAccumulated = Object.values(data.contributions).reduce((sum, val) => sum + val, 0);
    const contributors = Object.entries(data.contributions)
      .map(([name, val]) => ({
        nom: name,
        percentage: totalInolAccumulated > 0 ? Math.round((val / totalInolAccumulated) * 100) : 0
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 2);

    finalMuscles[mId] = {
      name: MUSCLE_DETAILS[mId],
      inol: parseFloat(readiness.toFixed(2)), // On expose le score de Readiness comme métrique d'effort principale
      sets: Math.round(data.sets),
      color,
      statusLabel,
      contributors
    };
  });

  const sncPercentage = Math.min(100, Math.round((targetSnc / maxSnc) * 100));

  return {
    muscles: finalMuscles,
    sncScore: parseFloat(targetSnc.toFixed(2)),
    sncPercentage,
    cnsFailure
  };
}
