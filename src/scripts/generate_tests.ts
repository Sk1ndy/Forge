import fs from 'fs';
import path from 'path';
import { runWeeklySimulation, DEFAULT_EXERCISE_LIBRARY, UserProfile, UserPRs } from '../lib/calculations';
import { PPL_TEMPLATE, FULL_BODY_TEMPLATE } from '../lib/templates';
import { WeeklyBlueprint, PlannedSet, PlannedExercise } from '../lib/calculations';

// Utils to create sets and exercises
const createSet = (series: number, reps: number, rpe: number = 8, poids: number = 0): PlannedSet => ({
  series,
  reps,
  poids,
  rpe,
  active: true
});

let idCounter = 0;
const createExercise = (exerciseId: string, sets: PlannedSet[]): PlannedExercise => {
  idCounter++;
  return {
    id: `ex-${exerciseId}-${idCounter}`,
    exerciseId,
    sets,
    active: true
  };
};

// Profile and PRs par défaut
const defaultPrs: UserPRs = {
  squat: 100,
  bench: 80,
  deadlift: 120,
  ohp: 50
};

const defaultProfile: UserProfile = {
  pdc: 75,
  maxSnc: 15.0,
  prs: defaultPrs
};

// Custom Extreme Blueprints
const EXTREME_VOLUME_TEMPLATE: WeeklyBlueprint = {
  Lundi: [
    createExercise('bench_press', [createSet(10, 10, 8, 60)]),
    createExercise('incline_bench', [createSet(10, 10, 8, 50)]),
    createExercise('dips', [createSet(10, 10, 8, 0)])
  ],
  Mardi: [],
  Mercredi: [],
  Jeudi: [],
  Vendredi: [],
  Samedi: [],
  Dimanche: []
};

const CNS_FRIED_TEMPLATE: WeeklyBlueprint = {
  Lundi: [createExercise('deadlift', [createSet(5, 5, 9, 100)])],
  Mardi: [createExercise('squat', [createSet(5, 5, 9, 90)])],
  Mercredi: [createExercise('barbell_row', [createSet(5, 5, 9, 70)])],
  Jeudi: [createExercise('deadlift', [createSet(5, 5, 9, 100)])],
  Vendredi: [createExercise('squat', [createSet(5, 5, 9, 90)])],
  Samedi: [createExercise('barbell_row', [createSet(5, 5, 9, 70)])],
  Dimanche: [createExercise('deadlift', [createSet(5, 5, 10, 100)])]
};

const BRO_SPLIT_TEMPLATE: WeeklyBlueprint = {
  Lundi: [createExercise('bench_press', [createSet(4, 10, 8, 70)]), createExercise('incline_bench', [createSet(4, 10, 8, 60)])],
  Mardi: [createExercise('pull_ups', [createSet(4, 10, 8, 0)]), createExercise('barbell_row', [createSet(4, 10, 8, 60)])],
  Mercredi: [createExercise('squat', [createSet(4, 10, 8, 80)]), createExercise('leg_press', [createSet(4, 10, 8, 120)])],
  Jeudi: [createExercise('ohp', [createSet(4, 10, 8, 40)]), createExercise('lateral_raise', [createSet(4, 15, 8, 10)])],
  Vendredi: [createExercise('biceps_curl', [createSet(4, 12, 8, 15)]), createExercise('triceps_pushdown', [createSet(4, 12, 8, 20)])],
  Samedi: [],
  Dimanche: []
};

const IMBALANCE_TEMPLATE: WeeklyBlueprint = {
  Lundi: [createExercise('bench_press', [createSet(5, 10, 8, 70)])],
  Mardi: [createExercise('ohp', [createSet(5, 10, 8, 40)])],
  Mercredi: [createExercise('dips', [createSet(5, 10, 8, 0)])],
  Jeudi: [createExercise('bench_press', [createSet(5, 10, 8, 70)])],
  Vendredi: [createExercise('incline_bench', [createSet(5, 10, 8, 60)])],
  Samedi: [],
  Dimanche: []
};

const SEDENTARY_TEMPLATE: WeeklyBlueprint = {
  Lundi: [], Mardi: [], Mercredi: [], Jeudi: [], Vendredi: [], Samedi: [], Dimanche: []
};

const SEDENTARY_RECOVERY_TEMPLATE: WeeklyBlueprint = {
  Lundi: [
    createExercise('bench_press', [createSet(5, 10, 9, 80)]),
    createExercise('squat', [createSet(5, 10, 9, 100)]),
    createExercise('deadlift', [createSet(5, 5, 9, 120)])
  ],
  Mardi: [createExercise('pull_ups', [createSet(5, 10, 9, 0)])],
  Mercredi: [createExercise('ohp', [createSet(5, 10, 9, 50)])],
  Jeudi: [createExercise('dips', [createSet(5, 10, 9, 0)])],
  Vendredi: [createExercise('barbell_row', [createSet(5, 10, 9, 70)])],
  Samedi: [createExercise('leg_press', [createSet(5, 12, 9, 150)])],
  Dimanche: [createExercise('hip_thrust', [createSet(5, 12, 9, 100)])]
};

const testCases: { name: string; blueprint: WeeklyBlueprint; week2Blueprint?: WeeklyBlueprint }[] = [
  { name: 'PPL_Standard', blueprint: PPL_TEMPLATE },
  { name: 'FullBody_3x', blueprint: FULL_BODY_TEMPLATE },
  { name: 'Bro_Split', blueprint: BRO_SPLIT_TEMPLATE },
  { name: 'Extreme_Volume_Chest', blueprint: EXTREME_VOLUME_TEMPLATE },
  { name: 'CNS_Fried', blueprint: CNS_FRIED_TEMPLATE },
  { name: 'Push_Imbalance', blueprint: IMBALANCE_TEMPLATE },
  { name: 'Sedentary', blueprint: SEDENTARY_TEMPLATE },
  { name: 'Sedentary_Recovery', blueprint: SEDENTARY_RECOVERY_TEMPLATE, week2Blueprint: SEDENTARY_TEMPLATE }
];

async function generateTests() {
  const dataset = testCases.map((tc) => {
    console.log(`Running simulation for ${tc.name}...`);
    const simulationResult = runWeeklySimulation(
      tc.blueprint,
      defaultProfile,
      {},
      undefined,
      DEFAULT_EXERCISE_LIBRARY,
      tc.week2Blueprint
    );

    return {
      testName: tc.name,
      input: {
        profile: defaultProfile,
        prs: defaultPrs,
        blueprint: tc.blueprint
      },
      output: simulationResult
    };
  });

  const outputPath = path.join(process.cwd(), 'forge_tests_dataset.json');
  fs.writeFileSync(outputPath, JSON.stringify(dataset, null, 2));
  console.log(`\n✅ Dataset généré avec succès ! (${dataset.length} cas de test)`);
  console.log(`📂 Sauvegardé dans : ${outputPath}`);
}

generateTests().catch(console.error);
