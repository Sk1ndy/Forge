export interface Exercise {
  id: string;
  nom: string;
  tier_snc: 1 | 2 | 3;
  muscle_primaire: string;
  muscles_secondaires: string[];
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
  inol: number;
  sets: number;
  color: 'grey' | 'green' | 'orange' | 'red';
  statusLabel: string;
  contributors: { nom: string; percentage: number }[];
}

export interface SimulationResult {
  muscles: { [muscleId: string]: MuscleStatus };
  sncScore: number;
  sncPercentage: number;
  cnsFailure: boolean;
}

// Liste de tous les exercices prédéfinis de la bibliothèque
export const EXERCISE_LIBRARY: Exercise[] = [
  { id: 'squat', nom: 'Squat Arrière', tier_snc: 1, muscle_primaire: 'quads', muscles_secondaires: ['glutes', 'hamstrings', 'lower_back'], equipment: 'poids_libre' },
  { id: 'deadlift', nom: 'Soulevé de Terre', tier_snc: 1, muscle_primaire: 'lower_back', muscles_secondaires: ['glutes', 'hamstrings', 'traps', 'forearms', 'lats'], equipment: 'poids_libre' },
  { id: 'bench_press', nom: 'Développé Couché', tier_snc: 2, muscle_primaire: 'chest_major', muscles_secondaires: ['deltoids_ant', 'triceps'], equipment: 'poids_libre' },
  { id: 'ohp', nom: 'Overhead Press (OHP)', tier_snc: 1, muscle_primaire: 'deltoids_ant', muscles_secondaires: ['triceps', 'traps'], equipment: 'poids_libre' },
  { id: 'pull_ups', nom: 'Tractions', tier_snc: 2, muscle_primaire: 'lats', muscles_secondaires: ['biceps', 'forearms', 'traps'], equipment: 'pdc' },
  { id: 'barbell_row', nom: 'Rowing Barre', tier_snc: 1, muscle_primaire: 'lats', muscles_secondaires: ['traps', 'biceps', 'lower_back', 'forearms'], equipment: 'poids_libre' },
  { id: 'dips', nom: 'Dips', tier_snc: 2, muscle_primaire: 'chest_major', muscles_secondaires: ['triceps', 'deltoids_ant'], equipment: 'pdc' },
  { id: 'biceps_curl', nom: 'Curl Biceps (Barre/Haltères)', tier_snc: 3, muscle_primaire: 'biceps', muscles_secondaires: ['forearms'], equipment: 'poids_libre' },
  { id: 'triceps_pushdown', nom: 'Extension Triceps Poulie', tier_snc: 3, muscle_primaire: 'triceps', muscles_secondaires: [], equipment: 'machine' },
  { id: 'incline_bench', nom: 'Développé Incliné', tier_snc: 2, muscle_primaire: 'chest_major', muscles_secondaires: ['deltoids_ant', 'triceps'], equipment: 'poids_libre' },
  { id: 'leg_press', nom: 'Presse à Cuisses', tier_snc: 2, muscle_primaire: 'quads', muscles_secondaires: ['glutes', 'hamstrings'], equipment: 'machine' },
  { id: 'leg_curl', nom: 'Leg Curl', tier_snc: 3, muscle_primaire: 'hamstrings', muscles_secondaires: [], equipment: 'machine' },
  { id: 'leg_extension', nom: 'Leg Extension', tier_snc: 3, muscle_primaire: 'quads', muscles_secondaires: [], equipment: 'machine' },
  { id: 'lateral_raise', nom: 'Élévations Latérales', tier_snc: 3, muscle_primaire: 'deltoids_ant', muscles_secondaires: [], equipment: 'poids_libre' },
  { id: 'face_pull', nom: 'Face Pull', tier_snc: 3, muscle_primaire: 'deltoids_post', muscles_secondaires: ['traps'], equipment: 'machine' },
  { id: 'calf_raise', nom: 'Mollets Debout', tier_snc: 3, muscle_primaire: 'calves', muscles_secondaires: [], equipment: 'poids_libre' },
  { id: 'crunchs', nom: 'Crunchs Abdominaux', tier_snc: 3, muscle_primaire: 'abs', muscles_secondaires: [], equipment: 'pdc' },
  { id: 'plank', nom: 'Planche Gainage', tier_snc: 3, muscle_primaire: 'abs', muscles_secondaires: ['obliques', 'lower_back'], equipment: 'pdc' },
  { id: 'lunges', nom: 'Fentes Haltères', tier_snc: 2, muscle_primaire: 'quads', muscles_secondaires: ['glutes', 'hamstrings'], equipment: 'poids_libre' },
  { id: 'hip_thrust', nom: 'Hip Thrust', tier_snc: 2, muscle_primaire: 'glutes', muscles_secondaires: ['hamstrings'], equipment: 'poids_libre' },
  { id: 'pec_deck', nom: 'Pec Deck', tier_snc: 3, muscle_primaire: 'chest_major', muscles_secondaires: [], equipment: 'machine' },
  { id: 'lat_pulldown', nom: 'Tirage Poitrine Poulie', tier_snc: 2, muscle_primaire: 'lats', muscles_secondaires: ['biceps', 'traps', 'forearms'], equipment: 'machine' }
];

export const MUSCLE_DETAILS: { [id: string]: string } = {
  chest_major: 'Grand Pectoral',
  deltoids_ant: 'Deltoïde Antérieur',
  deltoids_post: 'Deltoïde Postérieur',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearms: 'Avant-bras',
  abs: 'Abdominaux',
  obliques: 'Obliques',
  traps: 'Trapèzes',
  lats: 'Grand Dorsal',
  lower_back: 'Lombaires (Érecteurs du rachis)',
  glutes: 'Fessiers',
  quads: 'Quadriceps',
  hamstrings: 'Ischio-jambiers',
  calves: 'Mollets'
};

/**
 * Estime le 1RM théorique en utilisant la formule d'Epley modifiée par le RPE.
 */
export function estimate1RM(weight: number, reps: number, rpe: number): number {
  if (reps <= 0) return 0;
  // Reps effectives estimées jusqu'à l'échec
  const rpeDiff = 10 - Math.min(10, Math.max(0, rpe));
  const effectiveReps = reps + rpeDiff;
  
  if (effectiveReps <= 1) return weight;
  // Formule d'Epley : 1RM = W * (1 + R / 30)
  return weight * (1 + effectiveReps / 30);
}

/**
 * Détermine le 1RM applicable pour un exercice et un profil donnés
 */
export function getApplicable1RM(exerciseId: string, userPrs: UserPRs, weight: number, reps: number, rpe: number): number {
  // Mapping vers les PR majeurs
  if (exerciseId === 'squat') return userPrs.squat || estimate1RM(weight, reps, rpe);
  if (exerciseId === 'bench_press') return userPrs.bench || estimate1RM(weight, reps, rpe);
  if (exerciseId === 'deadlift') return userPrs.deadlift || estimate1RM(weight, reps, rpe);
  if (exerciseId === 'ohp') return userPrs.ohp || estimate1RM(weight, reps, rpe);

  // Estimation dynamique pour le reste
  return estimate1RM(weight, reps, rpe);
}

/**
 * Calcule l'impact d'une série unique (INOL et SNC)
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
  let intensity = 70; // valeur par défaut si PR non calculable
  if (pr > 0) {
    intensity = (set.poids / pr) * 100;
  }
  
  // Borner l'intensité pour éviter des divisions par zéro ou des scores astronomiques
  intensity = Math.min(99, Math.max(10, intensity));

  // 3. Score INOL pour une série simple = reps / (100 - intensité)
  const singleSetInol = set.reps / (100 - intensity);
  // Score cumulé pour le nombre de séries identiques dans le bloc
  const totalInol = singleSetInol * set.series;

  // 4. Calcul de l'impact SNC (Système Nerveux Central)
  // Base : (Poids / PDC) * RPE factor * Tier Multiplier
  const pdc = profile.pdc || 75; // 75kg par défaut si non renseigné
  const weightRatio = set.poids / pdc;
  
  let tierMultiplier = 1.0;
  if (exercise.tier_snc === 1) {
    // Tier 1 : Axial Lourd. x1.5 si la charge > 1.5x PDC, sinon x1.2
    tierMultiplier = weightRatio > 1.5 ? 1.5 : 1.2;
  } else if (exercise.tier_snc === 2) {
    // Tier 2 : Polyarticulaire standard
    tierMultiplier = 1.2;
  } else {
    // Tier 3 : Isolation
    tierMultiplier = 1.0;
  }

  // Facteur RPE (un entraînement à l'échec taxe beaucoup plus le SNC)
  const rpeFactor = set.rpe / 10;

  // Formule SNC par série : (ratio * tierMultiplier * rpeFactor * nombre de séries)
  // On applique un facteur d'échelle constant pour garder les points réalistes
  const sncPoints = weightRatio * tierMultiplier * rpeFactor * set.series * 0.15;

  return { inol: totalInol, sncPoints };
}

/**
 * Exécute la simulation complète sur le Blueprint hebdomadaire
 */
export function runWeeklySimulation(
  blueprint: WeeklyBlueprint,
  profile: UserProfile,
  toggledDays: { [day: string]: boolean } = {}
): SimulationResult {
  // Initialisation des muscles
  const musclesMap: { [muscleId: string]: { inol: number; sets: number; contributions: { [exId: string]: number } } } = {};
  
  Object.keys(MUSCLE_DETAILS).forEach(id => {
    musclesMap[id] = { inol: 0, sets: 0, contributions: {} };
  });

  let totalSncScore = 0;

  // Parcourir chaque jour de la semaine
  Object.entries(blueprint).forEach(([day, plannedExercises]) => {
    // Si le jour entier est désactivé, on passe
    if (toggledDays[day] === false) return;

    plannedExercises.forEach(plannedEx => {
      // Si l'exercice est désactivé, on l'exclut
      if (!plannedEx.active) return;

      const exercise = EXERCISE_LIBRARY.find(e => e.id === plannedEx.exerciseId);
      if (!exercise) return;

      plannedEx.sets.forEach(set => {
        if (!set.active) return;

        const { inol, sncPoints } = calculateSetImpact(set, exercise, profile);

        // Accumuler les points SNC
        totalSncScore += sncPoints;

        // Distribuer la fatigue locale (INOL) et les séries effectives
        // Muscle primaire : 100% de l'INOL, ajoute le nombre complet de séries
        const prim = exercise.muscle_primaire;
        if (musclesMap[prim]) {
          musclesMap[prim].inol += inol;
          musclesMap[prim].sets += set.series;
          musclesMap[prim].contributions[exercise.nom] = (musclesMap[prim].contributions[exercise.nom] || 0) + inol;
        }

        // Muscles synergistes (secondaires) : 50% de l'INOL et 50% des séries effectives
        exercise.muscles_secondaires.forEach(sec => {
          if (musclesMap[sec]) {
            musclesMap[sec].inol += inol * 0.5;
            musclesMap[sec].sets += set.series * 0.5;
            musclesMap[sec].contributions[exercise.nom] = (musclesMap[sec].contributions[exercise.nom] || 0) + (inol * 0.5);
          }
        });
      });
    });
  });

  // Déterminer le statut de fatigue systémique (CNS Failure)
  const maxSnc = profile.maxSnc || 15.0; // Seuil max de tolérance SNC par défaut
  const cnsFailure = totalSncScore > maxSnc;

  // Calcul final des MuscleStatus
  const finalMuscles: { [muscleId: string]: MuscleStatus } = {};

  Object.entries(musclesMap).forEach(([id, data]) => {
    let color: 'grey' | 'green' | 'orange' | 'red' = 'grey';
    let statusLabel = 'Maintien / Repos';

    // Grille de colorimétrie INOL hebdomadaire
    if (data.inol < 0.5) {
      color = 'grey';
      statusLabel = 'Volume Insuffisant (Maintien)';
    } else if (data.inol >= 0.5 && data.inol <= 1.2) {
      color = 'green';
      statusLabel = 'Zone Optimale (Hypertrophie)';
    } else if (data.inol > 1.2 && data.inol <= 2.0) {
      color = 'orange';
      statusLabel = 'Overreaching (Récupération lente)';
    } else {
      color = 'red';
      statusLabel = 'Surentraînement (MRV dépassé)';
    }

    // Calcul des pourcentages des top contributeurs
    const totalInolAccumulated = Object.values(data.contributions).reduce((sum, val) => sum + val, 0);
    const contributors = Object.entries(data.contributions)
      .map(([name, val]) => ({
        nom: name,
        percentage: totalInolAccumulated > 0 ? Math.round((val / totalInolAccumulated) * 100) : 0
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 2); // Top 2 contributeurs uniquement

    finalMuscles[id] = {
      name: MUSCLE_DETAILS[id],
      inol: parseFloat(data.inol.toFixed(2)),
      sets: Math.round(data.sets),
      color: cnsFailure ? 'grey' : color, // Si échec systémique, tout l'avatar se grise
      statusLabel: cnsFailure ? 'Échec Systémique Général' : statusLabel,
      contributors
    };
  });

  const sncPercentage = Math.min(100, Math.round((totalSncScore / maxSnc) * 100));

  return {
    muscles: finalMuscles,
    sncScore: parseFloat(totalSncScore.toFixed(2)),
    sncPercentage,
    cnsFailure
  };
}
