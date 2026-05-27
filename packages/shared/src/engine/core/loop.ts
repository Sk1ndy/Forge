import { WeeklyBlueprint, UserProfile, ExerciseLog, Exercise, PlannedSetSchema } from '../../types';
import { DEFAULT_EXERCISE_TENSION_MATRICES, MUSCLE_FATIGUE_DECAY, FITNESS_RETENTION_RATE } from '../../constants';
import { createInitialState, createLightSnapshot, aggregateMuscle, MusclesMap } from './state';
import { applyExponentialDecay, getProgressionMultiplier, normalize } from '../biomechanics/physiology';
import { calculateSetImpact } from '../biomechanics/impact';
import { calculateInjuryPredictions } from '../algorithms/injury';
import { generateBiomechanicsConfig } from '../config';

const DAYS_OF_WEEK = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

export function* executeSimulationGenerator(
  blueprint: WeeklyBlueprint,
  profile: UserProfile,
  toggledDays: { [day: string]: boolean },
  selectedDay: string | undefined,
  exerciseLibrary: Exercise[],
  totalWeeks: number,
  deloadWeeks: number[],
  sessionLogs: ExerciseLog[] | undefined
) {
  const config = generateBiomechanicsConfig(profile);
  const musclesMap = createInitialState();

  let sncFatigue = 0;
  let snapshotMuscles = createLightSnapshot(musclesMap);
  let snapshotSnc = 0;

  const dailyInol: { [muscleId: string]: number } = {};
  const peakFatigue: Record<string, { value: number; day: string }> = {};
  const weeklyEffectiveSetsRaw: Record<string, number> = {};
  let axialSncLoad = 0;

  const muscleDangerWeeks: { [muscleId: string]: number } = {};
  const injuryPredictions: string[] = [];
  const weeklySystemicInol: { [week: number]: number[] } = {};
  
  let pushSets = 0;
  let pullSets = 0;
  let legsSets = 0;

  Object.entries(blueprint).forEach(([day, dayExercises]) => {
    if (toggledDays[day] === false) return;
    dayExercises.forEach(plannedEx => {
      if (!plannedEx.active) return;
      const exDef = exerciseLibrary.find(e => e.id === plannedEx.exerciseId);
      if (!exDef) return;
      plannedEx.sets.forEach(set => {
        if (!set.active) return;
        if (exDef.ppl_category === 'push') pushSets += set.series;
        else if (exDef.ppl_category === 'pull') pullSets += set.series;
        else if (exDef.ppl_category === 'legs') legsSets += set.series;
      });
    });
  });

  for (let week = 1; week <= totalWeeks; week++) {
    weeklySystemicInol[week] = [];
    const weekHitRed = new Set<string>();

    Object.keys(musclesMap).forEach(id => {
      musclesMap[id].sets = 0;
      musclesMap[id].setsContributions = {};
      musclesMap[id].uniqueSets.clear();
      musclesMap[id].weeklyInol[week] = 0;
    });

    const isDeload = deloadWeeks.includes(week);

    for (const day of DAYS_OF_WEEK) {
      let dailySystemicLoad = 0;

      Object.keys(musclesMap).forEach(id => {
        // True Banister Exponential Decay
        musclesMap[id].fatigue = applyExponentialDecay(musclesMap[id].fatigue, config.tauFatigue, 1);
        musclesMap[id].fitness = applyExponentialDecay(musclesMap[id].fitness, config.tauFitness, 1);
        
        // Joint stress takes ~1.5x longer to heal than muscle fatigue
        musclesMap[id].jointStress = applyExponentialDecay((musclesMap[id].jointStress || 0), config.tauFatigue * 1.5, 1);

        if (isDeload) {
          // Accelerated flush during deload
          musclesMap[id].fatigue = normalize(musclesMap[id].fatigue * 0.85);
          musclesMap[id].jointStress = normalize((musclesMap[id].jointStress || 0) * 0.90);
        }

        if (musclesMap[id].contributions) {
          Object.keys(musclesMap[id].contributions).forEach(exNom => {
            musclesMap[id].contributions[exNom] = applyExponentialDecay(musclesMap[id].contributions[exNom], config.tauFatigue, 1);
          });
        }
      });

      sncFatigue = applyExponentialDecay(sncFatigue, config.tauFatigue, 1);
      if (isDeload) sncFatigue = normalize(sncFatigue * 0.70);

      if (toggledDays[day] !== false) {
        const plannedExercises = blueprint[day as keyof typeof blueprint] || [];
        plannedExercises.forEach(plannedEx => {
          if (!plannedEx.active) return;

          const exercise = exerciseLibrary.find(e => e.id === plannedEx.exerciseId);
          if (!exercise) return;

          const tensionMatrix = exercise.tension_matrix || DEFAULT_EXERCISE_TENSION_MATRICES[plannedEx.exerciseId] || { [exercise.muscle_primaire]: 1.0 };

          plannedEx.sets.forEach((set, setIndex) => {
            const parsedSet = PlannedSetSchema.safeParse(set);
            if (!parsedSet.success || !parsedSet.data.active) return;
            
            let validSet = parsedSet.data;
            let logMatch: ExerciseLog | undefined;

            if (sessionLogs && sessionLogs.length > 0) {
              logMatch = sessionLogs.find(
                l => l.exercise_id === plannedEx.exerciseId &&
                     l.day === day &&
                     l.set_index === setIndex &&
                     (l.week !== undefined ? l.week === week : week === 1)
              );
              if (logMatch && logMatch.is_completed !== false) {
                validSet = {
                  ...validSet,
                  reps: logMatch.actual_reps ?? validSet.reps,
                  poids: logMatch.actual_weight ?? validSet.poids,
                  rpe: logMatch.actual_rpe ?? validSet.rpe
                };
              } else if (logMatch && logMatch.is_completed === false) {
                  return;
              }
            }

            const impact = calculateSetImpact(validSet, exercise, profile, config);
            const overloadMultiplier = getProgressionMultiplier(week, isDeload, !!logMatch);

            const finalInol = impact.inol * overloadMultiplier;
            const finalSnc = impact.sncPoints * overloadMultiplier;

            const setIdBase = `${week}-${day}-${plannedEx.exerciseId}-${setIndex}`;
            sncFatigue = normalize(sncFatigue + finalSnc);

            if (week === totalWeeks && exercise.tier_snc === 1 && exercise.equipment === 'poids_libre') {
              axialSncLoad = normalize(axialSncLoad + finalInol);
            }

            let setSystemicLoad = 0;

            Object.entries(tensionMatrix).forEach(([muscleId, coeff]) => {
              if (musclesMap[muscleId]) {
                const muscleLoad = finalInol * coeff;
                setSystemicLoad += muscleLoad;
                
                musclesMap[muscleId].fatigue = normalize(musclesMap[muscleId].fatigue + muscleLoad);
                musclesMap[muscleId].inol = normalize((musclesMap[muscleId].inol || 0) + muscleLoad);
                musclesMap[muscleId].weeklyInol[week] = (musclesMap[muscleId].weeklyInol[week] || 0) + muscleLoad;
                
                let adaptationMultiplier = config.k1;
                const currentFatigue = musclesMap[muscleId].fatigue;
                if (currentFatigue > 1.5) {
                  adaptationMultiplier = Math.max(0.0, config.k1 - (currentFatigue - 1.5) * config.k2);
                }
                musclesMap[muscleId].fitness = normalize(musclesMap[muscleId].fitness + muscleLoad * 0.5 * adaptationMultiplier);
                
                musclesMap[muscleId].sets = normalize(musclesMap[muscleId].sets + validSet.series * coeff);
                musclesMap[muscleId].contributions[exercise.nom] = normalize((musclesMap[muscleId].contributions[exercise.nom] || 0) + muscleLoad);
                musclesMap[muscleId].setsContributions[exercise.nom] = normalize((musclesMap[muscleId].setsContributions[exercise.nom] || 0) + validSet.series * coeff);

                let jointStressIncrement = muscleLoad * 0.5;
                if (validSet.reps <= 5 && validSet.rpe >= 9) {
                  jointStressIncrement += muscleLoad * 1.5;
                }
                musclesMap[muscleId].jointStress = normalize((musclesMap[muscleId].jointStress || 0) + jointStressIncrement);
                
                if (week === totalWeeks) {
                  weeklyEffectiveSetsRaw[muscleId] = (weeklyEffectiveSetsRaw[muscleId] || 0) + validSet.series;
                }

                if (week === totalWeeks && selectedDay && day.toLowerCase() === selectedDay.toLowerCase()) {
                  dailyInol[muscleId] = normalize((dailyInol[muscleId] || 0) + muscleLoad);
                }
                
                for (let i = 0; i < validSet.series; i++) {
                  musclesMap[muscleId].uniqueSets.add(`${setIdBase}-${i}`);
                }
              }
            });

            dailySystemicLoad += setSystemicLoad;
          });
        });
      }

      weeklySystemicInol[week].push(dailySystemicLoad);

      Object.keys(musclesMap).forEach(id => {
        const f = musclesMap[id].fatigue;
        musclesMap[id].fatigueHistory.push(f);
        if (f > 2.5) weekHitRed.add(id);

        if (week === totalWeeks) {
          if (!peakFatigue[id] || f > peakFatigue[id].value) {
            peakFatigue[id] = { value: parseFloat(f.toFixed(4)), day };
          }
        }
      });

      if (week === totalWeeks) {
        if (selectedDay && day.toLowerCase() === selectedDay.toLowerCase()) {
          snapshotMuscles = createLightSnapshot(musclesMap);
          snapshotSnc = sncFatigue;
        } else if (!selectedDay && day === 'Dimanche') {
          snapshotMuscles = createLightSnapshot(musclesMap);
          snapshotSnc = sncFatigue;
        }
      }
    } // day loop

    calculateInjuryPredictions(musclesMap, weekHitRed, muscleDangerWeeks, injuryPredictions);

    yield; // Rendre la main (Yield) après chaque semaine
  } // week loop

  const targetMuscles = selectedDay ? snapshotMuscles : musclesMap;
  const targetSnc = selectedDay ? snapshotSnc : sncFatigue;

  aggregateMuscle(targetMuscles, dailyInol, totalWeeks, 'chest', ['upperChest', 'lowerChest', 'serratus']);
  aggregateMuscle(targetMuscles, dailyInol, totalWeeks, 'quadriceps', ['innerQuad', 'outerQuad']);
  aggregateMuscle(targetMuscles, dailyInol, totalWeeks, 'abs', ['upperAbs', 'lowerAbs']);
  aggregateMuscle(targetMuscles, dailyInol, totalWeeks, 'trapezius', ['upperTrapezius', 'lowerTrapezius']);
  aggregateMuscle(targetMuscles, dailyInol, totalWeeks, 'upperBack', ['rhomboids', 'rotatorCuff']);
  aggregateMuscle(targetMuscles, dailyInol, totalWeeks, 'frontDeltoid', ['deltoids']);
  aggregateMuscle(targetMuscles, dailyInol, totalWeeks, 'rearDeltoid', ['deltoids']);

  return {
    targetMuscles,
    targetSnc,
    dailyInol,
    injuryPredictions,
    weeklySystemicInol,
    weeklyEffectiveSetsRaw,
    peakFatigue,
    axialSncLoad,
    pushSets,
    pullSets,
    legsSets
  };
}
