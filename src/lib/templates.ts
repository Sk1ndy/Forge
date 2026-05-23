import { WeeklyBlueprint, PlannedExercise, PlannedSet } from './calculations';

const createSet = (series: number, reps: number, rpe: number = 8): PlannedSet => ({
  series,
  reps,
  poids: 0,
  rpe,
  active: true
});

const createExercise = (exerciseId: string, sets: PlannedSet[]): PlannedExercise => ({
  id: Math.random().toString(36).substring(2, 9),
  exerciseId,
  sets,
  active: true
});

export const PPL_TEMPLATE: WeeklyBlueprint = {
  Lundi: [
    createExercise('bench_press', [createSet(3, 8, 8)]),
    createExercise('ohp', [createSet(3, 8, 8)]),
    createExercise('incline_bench', [createSet(3, 10, 8)]),
    createExercise('dips', [createSet(3, 10, 8)]),
    createExercise('triceps_pushdown', [createSet(3, 12, 9)])
  ],
  Mardi: [
    createExercise('deadlift', [createSet(3, 5, 8)]),
    createExercise('pull_ups', [createSet(3, 8, 8)]),
    createExercise('barbell_row', [createSet(3, 8, 8)]),
    createExercise('face_pull', [createSet(3, 12, 8)]),
    createExercise('biceps_curl', [createSet(3, 12, 9)])
  ],
  Mercredi: [
    createExercise('squat', [createSet(3, 6, 8)]),
    createExercise('leg_press', [createSet(3, 10, 8)]),
    createExercise('leg_extension', [createSet(3, 12, 8)]),
    createExercise('leg_curl', [createSet(3, 12, 8)]),
    createExercise('calf_raise', [createSet(4, 15, 9)])
  ],
  Jeudi: [],
  Vendredi: [
    createExercise('bench_press', [createSet(3, 8, 8)]),
    createExercise('ohp', [createSet(3, 8, 8)]),
    createExercise('incline_bench', [createSet(3, 10, 8)]),
    createExercise('triceps_pushdown', [createSet(3, 12, 9)])
  ],
  Samedi: [
    createExercise('pull_ups', [createSet(3, 8, 8)]),
    createExercise('barbell_row', [createSet(3, 8, 8)]),
    createExercise('face_pull', [createSet(3, 12, 8)]),
    createExercise('biceps_curl', [createSet(3, 12, 9)])
  ],
  Dimanche: []
};

export const FULL_BODY_TEMPLATE: WeeklyBlueprint = {
  Lundi: [
    createExercise('squat', [createSet(3, 6, 8)]),
    createExercise('bench_press', [createSet(3, 8, 8)]),
    createExercise('barbell_row', [createSet(3, 8, 8)]),
    createExercise('biceps_curl', [createSet(2, 12, 8)]),
    createExercise('crunchs', [createSet(3, 15, 8)])
  ],
  Mardi: [],
  Mercredi: [
    createExercise('deadlift', [createSet(3, 5, 8)]),
    createExercise('ohp', [createSet(3, 8, 8)]),
    createExercise('pull_ups', [createSet(3, 8, 8)]),
    createExercise('leg_press', [createSet(3, 10, 8)]),
    createExercise('triceps_pushdown', [createSet(3, 12, 8)])
  ],
  Jeudi: [],
  Vendredi: [
    createExercise('squat', [createSet(3, 6, 8)]),
    createExercise('incline_bench', [createSet(3, 8, 8)]),
    createExercise('lat_pulldown', [createSet(3, 10, 8)]),
    createExercise('leg_curl', [createSet(3, 12, 8)]),
    createExercise('lateral_raise', [createSet(3, 12, 8)])
  ],
  Samedi: [],
  Dimanche: []
};
