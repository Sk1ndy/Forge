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
  tension_matrix?: Record<string, number>;
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
  age?: number;
  sleepHours?: number;      // Heures de sommeil moyennes
  caloricStatus?: 'deficit' | 'maintenance' | 'surplus';
  stressLevel?: 'low' | 'moderate' | 'high';
}

export interface PlannedSet {
  series: number;
  reps: number;
  poids: number;
  rpe: number;
  active: boolean;
}

import { z } from 'zod';

export const PlannedSetSchema = z.object({
  series: z.number().int().positive(),
  reps: z.number().int().positive(),
  poids: z.number().nonnegative(),
  rpe: z.number().min(1).max(10),
  active: z.boolean()
});

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
  remainingCapacity: number; // Valeur de 0 à 1 représentant le budget d'entraînement restant
  jointStress: number; // Jauge de stress articulaire/tendineux
  readiness: number; // État de forme net (fitness - fatigue)
  fatigueHistory?: number[]; // Historique de fatigue sur les 7 derniers jours
}

export interface SimulationResult {
  muscles: { [muscleId in MuscleId]?: MuscleStatus };
  sncScore: number;
  sncPercentage: number;
  cnsFailure: boolean;
  junkVolumeAlerts: string[]; // Alertes de junk volume basées sur l'INOL de la séance
  globalWorkCapacity: number; // Capacité de travail systémique restante (0-100)
  topSurcharged: MuscleStatus[];
  topNeglected: MuscleStatus[];
  pushPullLegsRatio: { push: number; pull: number; legs: number };
}

// Liste de fallback pour les exercices
export const DEFAULT_EXERCISE_LIBRARY: Exercise[] = [
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
export const DEFAULT_EXERCISE_TENSION_MATRICES: Record<string, Partial<Record<MuscleId, number>>> = {
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
  lateral_raise: { deltoids: 1.0 },
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

// Coefficients de pondération physiologiques pour l'agrégation des muscles enfants vers les parents
export const PARENT_CHILD_WEIGHTS: Partial<Record<MuscleId, Partial<Record<MuscleId, number>>>> = {
  chest: { upperChest: 1.0, lowerChest: 1.0, serratus: 0.3 },
  quadriceps: { innerQuad: 1.0, outerQuad: 1.0 },
  abs: { upperAbs: 1.0, lowerAbs: 1.0 },
  trapezius: { upperTrapezius: 1.0, lowerTrapezius: 1.0 },
  upperBack: { rhomboids: 0.5, rotatorCuff: 0.3 },
  frontDeltoid: { deltoids: 0.5 },
  rearDeltoid: { deltoids: 0.5 }
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
  
  // Formule de Brzycki sécurisée pour les séries longues (> 10 reps) pour éviter la surévaluation d'Epley
  if (effectiveReps > 10) {
    const denom = 1.0278 - (0.0278 * effectiveReps);
    return weight / Math.max(0.1, denom);
  }
  
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

// Fonction de normalisation pour éviter la dérive des virgules flottantes (float drift)
export const normalize = (val: number) => Math.round(val * 10000) / 10000;

/**
 * Calcule l'impact d'une série unique (INOL et SNC) avec la formule exponentielle continue du RPE
 */
export function calculateSetImpact(
  set: PlannedSet,
  exercise: Exercise,
  profile: UserProfile
): { inol: number; sncPoints: number } {
  if (!set.active || set.series <= 0 || set.reps <= 0) {
    return { inol: 0, sncPoints: 0 };
  }

  // Intégration de la charge réelle deplacée par le poids de corps (PDC)
  let effectiveWeight = set.poids;
  if (exercise.equipment === 'pdc') {
    const bodyweightContribution = (exercise.id === 'pull_ups' || exercise.id === 'dips') ? 0.90 : 0.65;
    effectiveWeight = set.poids + ((profile.pdc || 75) * bodyweightContribution);
  }

  // 1. Détermination du 1RM de référence
  const pr = getApplicable1RM(exercise.id, profile.prs, effectiveWeight, set.reps, set.rpe);
  
  // 2. Calcul de l'intensité relative (%)
  let intensity = 70;
  if (pr > 0) {
    intensity = (effectiveWeight / pr) * 100;
  }
  intensity = Math.min(99, Math.max(10, intensity));

  // 3. Multiplicateur RPE basé sur la formule exponentielle Math.pow(1.35, clampedRpe - 10)
  const clampedRpe = Math.min(10, Math.max(5, set.rpe || 8));
  const rpeFactor = Math.pow(1.35, clampedRpe - 10);

  // 4. Calcul de l'INOL brut accumulé par cette série
  const inolIntensity = Math.min(95, Math.max(10, intensity));
  const baseInol = set.reps / (100 - inolIntensity);
  const totalInol = baseInol * rpeFactor * set.series;

  // 5. Calcul de l'impact SNC (Système Nerveux Central)
  const pdc = profile.pdc || 75;
  const weightRatio = effectiveWeight / pdc;
  
  // Fatigue axiale SNC de base : Tier 1 = 100%, Tier 2 = 50%, Tier 3 (isolation) = 5%
  let sncMultiplier = exercise.tier_snc === 1 ? 1.0 : (exercise.tier_snc === 2 ? 0.5 : 0.05);

  // Le "Deadlift Effect" : le soulevé de terre applique un multiplicateur spécifique de 1.4 pour sa fatigue axiale unique.
  if (exercise.id === 'deadlift') {
    sncMultiplier *= 1.4;
  }

  // Formule SNC finale
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
  selectedDay?: string,
  exerciseLibrary: Exercise[] = DEFAULT_EXERCISE_LIBRARY
): SimulationResult {
  const DAYS_OF_WEEK = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

  // Récupération et modulation des facteurs biologiques individuels
  const userAge = profile.age ?? 28;
  const userSleep = profile.sleepHours ?? 8;
  const userCaloric = profile.caloricStatus ?? 'maintenance';
  const userStress = profile.stressLevel ?? 'moderate';

  let recoveryMultiplier = 1.0;
  if (userAge > 40) {
    recoveryMultiplier *= Math.max(0.70, 1 - (userAge - 40) * 0.01);
  }
  if (userSleep < 7.5) {
    recoveryMultiplier *= Math.max(0.60, 0.60 + (userSleep / 7.5) * 0.40);
  } else if (userSleep >= 9) {
    recoveryMultiplier *= 1.05;
  }
  if (userCaloric === 'deficit') recoveryMultiplier *= 0.80;
  else if (userCaloric === 'surplus') recoveryMultiplier *= 1.05;
  
  if (userStress === 'high') recoveryMultiplier *= 0.80;
  else if (userStress === 'low') recoveryMultiplier *= 1.05;

  // Initialisation des états musculaires à T0
  const musclesMap: {
    [muscleId: string]: {
      fatigue: number;
      fitness: number;
      sets: number;
      jointStress: number;
      contributions: { [exId: string]: number };
      setsContributions: { [exId: string]: number };
      fatigueHistory: number[];
    };
  } = {};
  
  Object.keys(MUSCLE_DETAILS).forEach(id => {
    musclesMap[id] = { fatigue: 0, fitness: 0, sets: 0, jointStress: 0, contributions: {}, setsContributions: {}, fatigueHistory: [] };
  });

  // Copie légère, ciblée et performante de l'état musculaire pour le snapshot
  const createLightSnapshot = (source: typeof musclesMap): typeof musclesMap => {
    const snapshot: typeof musclesMap = {};
    for (const key in source) {
      const s = source[key];
      snapshot[key] = {
        fatigue: s.fatigue,
        fitness: s.fitness,
        sets: s.sets,
        jointStress: s.jointStress,
        contributions: { ...s.contributions },
        setsContributions: { ...s.setsContributions },
        fatigueHistory: [...s.fatigueHistory]
      };
    }
    return snapshot;
  };

  let sncFatigue = 0;

  // Clones légers initialisés
  let snapshotMuscles = createLightSnapshot(musclesMap);
  let snapshotSnc = 0;

  // Suivi de l'INOL intra-séance pour détecter le Junk Volume (Intensité + Volume)
  const dailyInol: { [muscleId: string]: number } = {};

  // Simulation séquentielle sur 2 semaines
  for (let week = 1; week <= 2; week++) {
    // Réinitialisation des volumes de travail au début de la semaine
    Object.keys(musclesMap).forEach(id => {
      musclesMap[id].sets = 0;
      musclesMap[id].setsContributions = {};
    });

    DAYS_OF_WEEK.forEach(day => {
      // A. Dissipation quotidienne de la fatigue et de l'adaptation
      Object.keys(musclesMap).forEach(id => {
        const baseDecay = MUSCLE_FATIGUE_DECAY[id as MuscleId] ?? 0.5;
        const adjustedDecay = Math.max(0.05, Math.min(0.98, baseDecay + (1 - recoveryMultiplier) * (1 - baseDecay)));

        musclesMap[id].fatigue = normalize(musclesMap[id].fatigue * adjustedDecay);
        musclesMap[id].fitness = normalize(musclesMap[id].fitness * FITNESS_RETENTION_RATE);
        musclesMap[id].jointStress = normalize((musclesMap[id].jointStress || 0) * 0.90);

        if (musclesMap[id].contributions) {
          Object.keys(musclesMap[id].contributions).forEach(exNom => {
            musclesMap[id].contributions[exNom] = normalize(musclesMap[id].contributions[exNom] * adjustedDecay);
          });
        }
      });

      // Dissipation réaliste du SNC
      sncFatigue = normalize(sncFatigue * 0.55);

      // B. Application des séances du jour
      if (toggledDays[day] !== false) {
        const plannedExercises = blueprint[day] || [];
        plannedExercises.forEach(plannedEx => {
          if (!plannedEx.active) return;

          const exercise = exerciseLibrary.find(e => e.id === plannedEx.exerciseId);
          if (!exercise) return;

          const tensionMatrix = exercise.tension_matrix || DEFAULT_EXERCISE_TENSION_MATRICES[plannedEx.exerciseId] || { [exercise.muscle_primaire]: 1.0 };

          plannedEx.sets.forEach(set => {
            // Validation stricte via Zod avant simulation
            const parsedSet = PlannedSetSchema.safeParse(set);
            if (!parsedSet.success || !parsedSet.data.active) return;
            
            const validSet = parsedSet.data;
            const { inol, sncPoints } = calculateSetImpact(validSet, exercise, profile);

            // Accumuler la fatigue centrale
            sncFatigue = normalize(sncFatigue + sncPoints);

            // Distribuer la fatigue, l'adaptation et le stress articulaire
            Object.entries(tensionMatrix).forEach(([muscleId, coeff]) => {
              if (musclesMap[muscleId]) {
                const muscleLoad = inol * coeff;
                musclesMap[muscleId].fatigue = normalize(musclesMap[muscleId].fatigue + muscleLoad);
                
                // Inverted-U adaptation curve
                let adaptationMultiplier = 1.0;
                const currentFatigue = musclesMap[muscleId].fatigue;
                if (currentFatigue > 1.5) {
                  adaptationMultiplier = Math.max(0.0, 1.0 - (currentFatigue - 1.5) * 0.6);
                }
                musclesMap[muscleId].fitness = normalize(musclesMap[muscleId].fitness + muscleLoad * 0.5 * adaptationMultiplier);
                
                musclesMap[muscleId].sets = normalize(musclesMap[muscleId].sets + validSet.series * coeff);
                musclesMap[muscleId].contributions[exercise.nom] = normalize((musclesMap[muscleId].contributions[exercise.nom] || 0) + muscleLoad);
                musclesMap[muscleId].setsContributions[exercise.nom] = normalize((musclesMap[muscleId].setsContributions[exercise.nom] || 0) + validSet.series * coeff);

                // Contrainte mécanique articulaire cumulative
                let jointStressIncrement = inol * coeff * 0.5;
                if (validSet.reps <= 5 && validSet.rpe >= 9) {
                  jointStressIncrement += inol * coeff * 1.5;
                }
                musclesMap[muscleId].jointStress = normalize((musclesMap[muscleId].jointStress || 0) + jointStressIncrement);
                
                // Suivi de l'INOL intra-séance pour le jour cible
                if (week === 2 && selectedDay && day.toLowerCase() === selectedDay.toLowerCase()) {
                  dailyInol[muscleId] = normalize((dailyInol[muscleId] || 0) + muscleLoad);
                }
              }
            });
          });
        });
      }

      // Fin de la journée : enregistrement de l'historique sur la semaine 2
      if (week === 2) {
        Object.keys(musclesMap).forEach(id => {
          musclesMap[id].fatigueHistory.push(musclesMap[id].fatigue);
        });
      }

      // C. Capture légère du snapshot uniquement lors de la semaine 2 stabilisée
      if (week === 2 && selectedDay && day.toLowerCase() === selectedDay.toLowerCase()) {
        snapshotMuscles = createLightSnapshot(musclesMap);
        snapshotSnc = sncFatigue;
      }
    });
  }

  const targetMuscles = selectedDay ? snapshotMuscles : musclesMap;
  const targetSnc = selectedDay ? snapshotSnc : sncFatigue;

  // ─── AGGREGATION DES SOUS-MUSCLES PHYSIOLOGIQUES AVEC SOMMATION PONDÉRÉE ───
  // La fatigue totale du parent est la somme des fatigues des enfants (pondérée par les coefficients PARENT_CHILD_WEIGHTS) + sa propre fatigue.
  const aggregateMuscle = (parentKey: MuscleId, childKeys: MuscleId[]) => {
    const parent = targetMuscles[parentKey] || { fatigue: 0, fitness: 0, sets: 0, jointStress: 0, contributions: {}, setsContributions: {} };
    
    const weights = PARENT_CHILD_WEIGHTS[parentKey] || {};
    
    let totalFatigue = parent.fatigue;
    let totalSets = parent.sets;
    let totalJointStress = parent.jointStress;
    let totalDailyInol = dailyInol[parentKey] || 0;
    
    let totalFatigueHistory = parent.fatigueHistory ? [...parent.fatigueHistory] : Array(7).fill(0);
    
    const combinedContributions = { ...parent.contributions };
    const combinedSetsContributions = { ...parent.setsContributions };

    childKeys.forEach(childKey => {
      const child = targetMuscles[childKey];
      if (child) {
        const coeff = weights[childKey] ?? 1.0;
        
        totalFatigue = normalize(totalFatigue + child.fatigue * coeff);
        totalSets = normalize(totalSets + child.sets * coeff);
        // CORRECTION DE L'AGRÉGATION (CRITIQUE): Sommation cumulative pondérée au lieu de Math.max
        totalJointStress = normalize(totalJointStress + child.jointStress * coeff);
        totalDailyInol = normalize(totalDailyInol + (dailyInol[childKey] || 0) * coeff);

        if (child.fatigueHistory) {
          totalFatigueHistory = totalFatigueHistory.map((val, idx) => 
            normalize(val + (child.fatigueHistory[idx] || 0) * coeff)
          );
        }

        Object.entries(child.contributions || {}).forEach(([exNom, val]) => {
          combinedContributions[exNom] = normalize((combinedContributions[exNom] || 0) + val * coeff);
        });
        
        Object.entries(child.setsContributions || {}).forEach(([exNom, val]) => {
          combinedSetsContributions[exNom] = normalize((combinedSetsContributions[exNom] || 0) + val * coeff);
        });
      }
    });

    dailyInol[parentKey] = totalDailyInol;

    targetMuscles[parentKey] = {
      fatigue: totalFatigue,
      fitness: normalize(totalFatigue * 0.5),
      sets: totalSets,
      jointStress: totalJointStress,
      contributions: combinedContributions,
      setsContributions: combinedSetsContributions,
      fatigueHistory: totalFatigueHistory
    };
  };

  // Consolider les contributions vers les groupes parents
  aggregateMuscle('chest', ['upperChest', 'lowerChest', 'serratus']);
  aggregateMuscle('quadriceps', ['innerQuad', 'outerQuad']);
  aggregateMuscle('abs', ['upperAbs', 'lowerAbs']);
  aggregateMuscle('trapezius', ['upperTrapezius', 'lowerTrapezius']);
  aggregateMuscle('upperBack', ['rhomboids', 'rotatorCuff']);
  aggregateMuscle('frontDeltoid', ['deltoids']);
  aggregateMuscle('rearDeltoid', ['deltoids']);

  // Système Nerveux Central (SNC)
  const maxSnc = profile.maxSnc || 15.0;
  const cnsFailure = targetSnc > maxSnc;

  // Statuts musculaires finaux
  const finalMuscles: { [muscleId in MuscleId]?: MuscleStatus } = {};

  Object.entries(targetMuscles).forEach(([id, data]) => {
    const mId = id as MuscleId;
    const fatigueScore = data.fatigue;

    // COLORIMÉTRIE "SAFE-FIRST" : La couleur de MuscleStatus dépend UNIQUEMENT de data.fatigue
    let color: 'grey' | 'green' | 'orange' | 'red' = 'grey';
    let statusLabel = 'Volume Insuffisant (Repos / Maintien)';

    if (fatigueScore < 0.5) {
      color = 'grey';
      statusLabel = 'Volume Insuffisant (Repos / Maintien)';
    } else if (fatigueScore >= 0.5 && fatigueScore <= 1.5) {
      color = 'green';
      statusLabel = 'Stimulus Optimal (Zone d\'Adaptation)';
    } else if (fatigueScore > 1.5 && fatigueScore <= 2.5) {
      color = 'orange';
      statusLabel = 'Surcharge Locale (Fatigue Élevée)';
    } else {
      color = 'red';
      statusLabel = 'Surentraînement (Seuil de Tolérance Dépassé / Danger)';
    }

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
      inol: parseFloat(fatigueScore.toFixed(2)),
      sets: Math.round(data.sets),
      color,
      statusLabel,
      contributors,
      remainingCapacity: parseFloat(Math.max(0, 1 - (fatigueScore / 2.5)).toFixed(4)),
      jointStress: parseFloat((data.jointStress || 0).toFixed(2)),
      readiness: parseFloat((data.fitness - fatigueScore).toFixed(2)), // Readiness conservée et calculée proprement pour l'affichage
      fatigueHistory: data.fatigueHistory.map(v => parseFloat(v.toFixed(2)))
    };
  });

  // REFACTORING DU "JUNK VOLUME"
  // On détecte le volume poubelle en fonction de l'INOL généré dans la séance (Intensité + Volume).
  // Un INOL > 1.5 sur un même jour pour un muscle représente une surcharge inutile.
  const junkVolumeAlerts: string[] = [];
  const reportedParents = new Set<string>();

  // Trier par INOL décroissant pour alerter en priorité sur les gros muscles
  Object.entries(dailyInol)
    .sort((a, b) => b[1] - a[1])
    .forEach(([id, inolScore]) => {
      const isSubMuscle = !['chest', 'quadriceps', 'abs', 'trapezius', 'upperBack', 'frontDeltoid', 'rearDeltoid', 'biceps', 'triceps', 'lowerBack', 'gluteal', 'hamstring', 'calves', 'forearm'].includes(id);
      
      if (inolScore > 1.5 && finalMuscles[id as MuscleId] && !isSubMuscle) {
        junkVolumeAlerts.push(`${MUSCLE_DETAILS[id as MuscleId]} (INOL: ${inolScore.toFixed(1)})`);
        reportedParents.add(id);
      }
  });

  const sncPercentage = Math.min(100, Math.round((targetSnc / maxSnc) * 100));

  // Calcul de la capacité de récupération globale (globalWorkCapacity)
  const fiveBigMuscles: MuscleId[] = ['quadriceps', 'chest', 'upperBack', 'lowerBack', 'gluteal'];
  let totalMuscleFatiguePct = 0;
  fiveBigMuscles.forEach(id => {
    const muscle = targetMuscles[id];
    const fatigue = muscle ? muscle.fatigue : 0;
    // Fatigue max acceptable avant danger absolu est de 2.5
    const pct = Math.min(100, Math.max(0, (fatigue / 2.5) * 100));
    totalMuscleFatiguePct += pct;
  });
  const avgMuscleFatiguePct = totalMuscleFatiguePct / 5;
  const globalFatigueScore = (sncPercentage + avgMuscleFatiguePct) / 2;
  const globalWorkCapacity = Math.max(0, parseFloat((100 - globalFatigueScore).toFixed(1)));

  const MAJOR_GROUPS: MuscleId[] = [
    'chest', 'upperChest', 'lowerChest',
    'upperBack', 'lowerBack', 'rhomboids', 'trapezius', 'upperTrapezius', 'lowerTrapezius',
    'deltoids', 'frontDeltoid', 'rearDeltoid',
    'biceps', 'triceps', 'quadriceps', 'innerQuad', 'outerQuad',
    'hamstring', 'gluteal'
  ];

  const getCleanGroupName = (id: MuscleId): string => {
    switch (id) {
      case 'chest':
      case 'upperChest':
      case 'lowerChest':
        return 'Pectoraux';
      case 'upperBack':
      case 'lowerBack':
      case 'rhomboids':
      case 'trapezius':
      case 'upperTrapezius':
      case 'lowerTrapezius':
        return 'Dos';
      case 'deltoids':
      case 'frontDeltoid':
      case 'rearDeltoid':
        return 'Épaules';
      case 'biceps':
        return 'Biceps';
      case 'triceps':
        return 'Triceps';
      case 'quadriceps':
      case 'innerQuad':
      case 'outerQuad':
        return 'Quadriceps';
      case 'hamstring':
      case 'gluteal':
        return 'Ischios/Fessiers';
      default:
        return MUSCLE_DETAILS[id] || id;
    }
  };

  const rawSurcharged = Object.entries(finalMuscles)
    .filter((entry): entry is [string, MuscleStatus] => {
      const [id, m] = entry;
      return m !== undefined && MAJOR_GROUPS.includes(id as MuscleId) && (m.color === 'red' || m.color === 'orange');
    })
    .map(([id, m]) => ({
      ...m,
      name: getCleanGroupName(id as MuscleId)
    }))
    .sort((a, b) => b.inol - a.inol);

  const uniqueSurcharged: MuscleStatus[] = [];
  const seenSurcharged = new Set<string>();
  for (const item of rawSurcharged) {
    if (!seenSurcharged.has(item.name)) {
      seenSurcharged.add(item.name);
      uniqueSurcharged.push(item);
    }
  }
  const topSurcharged = uniqueSurcharged.slice(0, 3);

  const rawNeglected = Object.entries(finalMuscles)
    .filter((entry): entry is [string, MuscleStatus] => {
      const [id, m] = entry;
      return m !== undefined && MAJOR_GROUPS.includes(id as MuscleId) && m.color === 'grey';
    })
    .map(([id, m]) => ({
      ...m,
      name: getCleanGroupName(id as MuscleId)
    }))
    .sort((a, b) => a.inol - b.inol);

  const uniqueNeglected: MuscleStatus[] = [];
  const seenNeglected = new Set<string>();
  for (const item of rawNeglected) {
    if (!seenNeglected.has(item.name)) {
      seenNeglected.add(item.name);
      uniqueNeglected.push(item);
    }
  }
  const topNeglected = uniqueNeglected.slice(0, 3);

  const getPplCategory = (muscle: MuscleId): 'push' | 'pull' | 'legs' => {
    const pushMuscles: MuscleId[] = ['chest', 'frontDeltoid', 'triceps', 'deltoids', 'upperChest', 'lowerChest'];
    const pullMuscles: MuscleId[] = ['upperBack', 'lowerBack', 'biceps', 'trapezius', 'forearm', 'rearDeltoid', 'rhomboids', 'upperTrapezius', 'lowerTrapezius', 'abs', 'obliques', 'upperAbs', 'lowerAbs'];
    const legsMuscles: MuscleId[] = ['quadriceps', 'hamstring', 'gluteal', 'calves', 'adductors', 'hipFlexors', 'innerQuad', 'outerQuad', 'tibialis'];
    
    if (pushMuscles.includes(muscle)) return 'push';
    if (pullMuscles.includes(muscle)) return 'pull';
    if (legsMuscles.includes(muscle)) return 'legs';
    return 'push';
  };

  let pushSets = 0;
  let pullSets = 0;
  let legsSets = 0;

  Object.values(blueprint).forEach(dayExercises => {
    dayExercises.forEach(plannedEx => {
      if (!plannedEx.active) return;
      const exDef = exerciseLibrary.find(e => e.id === plannedEx.exerciseId);
      if (!exDef) return;
      
      const cat = getPplCategory(exDef.muscle_primaire);
      
      plannedEx.sets.forEach(set => {
        if (!set.active) return;
        if (cat === 'push') pushSets += set.series;
        else if (cat === 'pull') pullSets += set.series;
        else if (cat === 'legs') legsSets += set.series;
      });
    });
  });

  const totalPplSets = pushSets + pullSets + legsSets;
  const pushPct = totalPplSets > 0 ? Math.round((pushSets / totalPplSets) * 100) : 0;
  const pullPct = totalPplSets > 0 ? Math.round((pullSets / totalPplSets) * 100) : 0;
  const legsPct = totalPplSets > 0 ? 100 - pushPct - pullPct : 0;

  return {
    muscles: finalMuscles,
    sncScore: parseFloat(targetSnc.toFixed(2)),
    sncPercentage,
    cnsFailure,
    junkVolumeAlerts,
    globalWorkCapacity,
    topSurcharged,
    topNeglected,
    pushPullLegsRatio: {
      push: pushPct,
      pull: pullPct,
      legs: legsPct > 0 ? legsPct : 0
    }
  };
}
