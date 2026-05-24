import { Exercise, MuscleId } from './types';

// Liste de fallback pour les exercices
export const DEFAULT_EXERCISE_LIBRARY: Exercise[] = [
  { id: 'squat', nom: 'Squat Arrière', tier_snc: 1, muscle_primaire: 'quadriceps', muscles_secondaires: ['gluteal', 'hamstring', 'lowerBack'], equipment: 'poids_libre', ppl_category: 'legs' },
  { id: 'deadlift', nom: 'Soulevé de Terre', tier_snc: 1, muscle_primaire: 'lowerBack', muscles_secondaires: ['gluteal', 'hamstring', 'trapezius', 'forearm', 'upperBack'], equipment: 'poids_libre', ppl_category: 'legs' },
  { id: 'bench_press', nom: 'Développé Couché', tier_snc: 2, muscle_primaire: 'chest', muscles_secondaires: ['frontDeltoid', 'triceps'], equipment: 'poids_libre', ppl_category: 'push' },
  { id: 'ohp', nom: 'Overhead Press (OHP)', tier_snc: 1, muscle_primaire: 'frontDeltoid', muscles_secondaires: ['triceps', 'trapezius'], equipment: 'poids_libre', ppl_category: 'push' },
  { id: 'pull_ups', nom: 'Tractions', tier_snc: 2, muscle_primaire: 'upperBack', muscles_secondaires: ['biceps', 'forearm', 'trapezius'], equipment: 'pdc', ppl_category: 'pull' },
  { id: 'barbell_row', nom: 'Rowing Barre', tier_snc: 1, muscle_primaire: 'upperBack', muscles_secondaires: ['trapezius', 'biceps', 'lowerBack', 'forearm'], equipment: 'poids_libre', ppl_category: 'pull' },
  { id: 'dips', nom: 'Dips', tier_snc: 2, muscle_primaire: 'chest', muscles_secondaires: ['triceps', 'frontDeltoid'], equipment: 'pdc', ppl_category: 'push' },
  { id: 'biceps_curl', nom: 'Curl Biceps (Barre/Haltères)', tier_snc: 3, muscle_primaire: 'biceps', muscles_secondaires: ['forearm'], equipment: 'poids_libre', ppl_category: 'pull' },
  { id: 'triceps_pushdown', nom: 'Extension Triceps Poulie', tier_snc: 3, muscle_primaire: 'triceps', muscles_secondaires: [], equipment: 'machine', ppl_category: 'push' },
  { id: 'incline_bench', nom: 'Développé Incliné', tier_snc: 2, muscle_primaire: 'chest', muscles_secondaires: ['frontDeltoid', 'triceps'], equipment: 'poids_libre', ppl_category: 'push' },
  { id: 'leg_press', nom: 'Presse à Cuisses', tier_snc: 2, muscle_primaire: 'quadriceps', muscles_secondaires: ['gluteal'], equipment: 'machine', ppl_category: 'legs' },
  { id: 'leg_curl', nom: 'Leg Curl', tier_snc: 3, muscle_primaire: 'hamstring', muscles_secondaires: [], equipment: 'machine', ppl_category: 'legs' },
  { id: 'leg_extension', nom: 'Leg Extension', tier_snc: 3, muscle_primaire: 'quadriceps', muscles_secondaires: [], equipment: 'machine', ppl_category: 'legs' },
  { id: 'lateral_raise', nom: 'Élévations Latérales', tier_snc: 3, muscle_primaire: 'deltoids', muscles_secondaires: [], equipment: 'poids_libre', ppl_category: 'push' },
  { id: 'face_pull', nom: 'Face Pull', tier_snc: 3, muscle_primaire: 'rearDeltoid', muscles_secondaires: ['trapezius'], equipment: 'machine', ppl_category: 'pull' },
  { id: 'calf_raise', nom: 'Mollets Debout', tier_snc: 3, muscle_primaire: 'calves', muscles_secondaires: [], equipment: 'poids_libre', ppl_category: 'legs' },
  { id: 'crunchs', nom: 'Crunchs Abdominaux', tier_snc: 3, muscle_primaire: 'abs', muscles_secondaires: [], equipment: 'pdc', ppl_category: 'core' },
  { id: 'plank', nom: 'Planche Gainage', tier_snc: 3, muscle_primaire: 'abs', muscles_secondaires: ['obliques', 'lowerBack'], equipment: 'pdc', ppl_category: 'core' },
  { id: 'lunges', nom: 'Fentes Haltères', tier_snc: 2, muscle_primaire: 'quadriceps', muscles_secondaires: ['gluteal', 'hamstring'], equipment: 'poids_libre', ppl_category: 'legs' },
  { id: 'hip_thrust', nom: 'Hip Thrust', tier_snc: 2, muscle_primaire: 'gluteal', muscles_secondaires: ['hamstring'], equipment: 'poids_libre', ppl_category: 'legs' },
  { id: 'pec_deck', nom: 'Pec Deck', tier_snc: 3, muscle_primaire: 'chest', muscles_secondaires: [], equipment: 'machine', ppl_category: 'push' },
  { id: 'lat_pulldown', nom: 'Tirage Poitrine Poulie', tier_snc: 2, muscle_primaire: 'upperBack', muscles_secondaires: ['biceps', 'trapezius', 'forearm'], equipment: 'machine', ppl_category: 'pull' }
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
  ohp: { frontDeltoid: 1.0, triceps: 0.5, trapezius: 0.3 }, // Retrait de upperChest pour isoler les épaules
  pull_ups: { upperBack: 1.0, biceps: 0.6, forearm: 0.4, trapezius: 0.2 },
  barbell_row: { upperBack: 1.0, trapezius: 0.6, rhomboids: 0.6, biceps: 0.5, lowerBack: 0.5, forearm: 0.4 },
  dips: { lowerChest: 0.8, triceps: 0.8, frontDeltoid: 0.5 }, // Retrait de chest (évite le double-comptage)
  biceps_curl: { biceps: 1.0, forearm: 0.3 },
  triceps_pushdown: { triceps: 1.0 },
  incline_bench: { upperChest: 1.0, frontDeltoid: 0.7, triceps: 0.4 }, // Retrait de chest (évite le double-comptage)
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
