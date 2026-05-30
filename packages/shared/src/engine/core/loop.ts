import { WeeklyBlueprint, UserProfile, ExerciseLog, Exercise, PlannedSetSchema } from '../../types';
import { DEFAULT_EXERCISE_TENSION_MATRICES, MUSCLE_FATIGUE_DECAY, FITNESS_RETENTION_RATE } from '../../constants';
import { createInitialState, createLightSnapshot, aggregateMuscle, MusclesMap, EngineState } from './state';
import { applyExponentialDecay, normalize, getProgressionMultiplier, applyLogisticCeilingEffect } from '../biomechanics/physiology';
import { calculateSetImpact } from '../biomechanics/impact';
import { calculateInjuryPredictions } from '../algorithms/injury';
import { applyDiminishingReturns } from '../algorithms/junk-volume';
import { generateBiomechanicsConfig } from '../config';

const DAYS_OF_WEEK = [0, 1, 2, 3, 4, 5, 6];
const DAY_NAMES = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'] as const;

export function* executeSimulationGenerator(
  blueprint: WeeklyBlueprint,
  profile: UserProfile,
  toggledDays: { [day: string]: boolean | undefined; [day: number]: boolean | undefined },
  selectedDay: string | undefined,
  exerciseLibrary: Exercise[],
  totalWeeks: number,
  deloadWeeks: number[],
  sessionLogs: ExerciseLog[] | undefined,
  initialState?: EngineState
) {
  const config = generateBiomechanicsConfig(profile);
  const musclesMap = initialState ? createLightSnapshot(initialState.muscles) : createInitialState();

  let sncFatigue = initialState ? initialState.sncFatigue : 0;
  let chronicSncStress = initialState ? initialState.chronicSncStress : 0; // Mémoire long terme du SNC
  let snapshotMuscles = createLightSnapshot(musclesMap);
  let snapshotSnc = 0;
  let snapshotChronicSnc = 0;

  const dailyInol: { [muscleId: string]: number } = {};
  const peakFatigue: Record<string, { value: number; day: string }> = {};
  const weeklyEffectiveSetsRaw: Record<string, number> = {};
  let axialSncLoad = initialState ? initialState.axialSncLoad : 0;

  const injuryPredictions: string[] = [];
  const weeklySystemicInol: { [week: number]: number[] } = {};
  
  let pushSets = initialState ? initialState.pushSets : 0;
  let pullSets = initialState ? initialState.pullSets : 0;
  let legsSets = initialState ? initialState.legsSets : 0;
  
  let globalDayIndex = initialState ? initialState.dayIndex : 0;


  for (let week = 1; week <= totalWeeks; week++) {
    weeklySystemicInol[week] = [];

    Object.keys(musclesMap).forEach(id => {
      musclesMap[id].sets = 0;
      musclesMap[id].setsContributions = {};
      musclesMap[id].uniqueSets.clear();
      musclesMap[id].weeklyInol[week] = 0;
    });

    const isDeload = deloadWeeks.includes(week);

    for (const dayIndex of DAYS_OF_WEEK) {
      const day = DAY_NAMES[dayIndex];
      globalDayIndex = (week - 1) * 7 + dayIndex;

      let dailySystemicLoad = 0;
      
      // Structure to hold raw daily accumulation before diminishing returns
      const dailyRawAccumulator: Record<string, { 
        metabolic: number; 
        damage: number; 
        joint: number; 
        inol: number;
        rawFitnessGain: number;
        contributions: Record<string, number>;
        setsContributions: Record<string, number>;
      }> = {};

      Object.keys(musclesMap).forEach(id => {
        dailyRawAccumulator[id] = { metabolic: 0, damage: 0, joint: 0, inol: 0, rawFitnessGain: 0, contributions: {}, setsContributions: {} };
        // 1. Récupération du taux de rétention local
        const retention = MUSCLE_FATIGUE_DECAY[id as keyof typeof MUSCLE_FATIGUE_DECAY] || 0.5;
        // 2. Conversion du taux de rétention en modificateur de temps de demi-vie
        // Clause de garde (Bug #8 Fix) : Éviter une division par zéro ou log négatif si la rétention vaut 1.0 ou est trop faible
        const safeRetention = Math.max(0.01, Math.min(retention, 0.99));
        const localTauMultiplier = Math.log(0.5) / Math.log(safeRetention);

        // Bi-Phasic Exponential Decay (Modulé par la récupération locale)
        const baseTauMetabolic = config.tauMetabolic * localTauMultiplier;
        const baseTauDamage = config.tauDamage * localTauMultiplier;

        // Accelerated flush during deload by dividing the time constant (tau)
        const currentTauMetabolic = isDeload ? baseTauMetabolic / 1.5 : baseTauMetabolic;
        const currentTauDamage = isDeload ? baseTauDamage / 1.5 : baseTauDamage;
        let currentTauFitness = isDeload ? config.tauFitness * 1.1 : config.tauFitness; // retain fitness better during deload
        
        // Catabolisme du Cortisol : Perte accélérée de la masse musculaire si le SNC est en Burnout
        if (chronicSncStress > 3.0) {
          currentTauFitness = currentTauFitness * Math.max(0.3, 1.0 - (chronicSncStress - 3.0) * 0.15);
        }
        
        musclesMap[id].fatigueMetabolic = applyExponentialDecay(musclesMap[id].fatigueMetabolic, currentTauMetabolic, 1);
        musclesMap[id].fatigueDamage = applyExponentialDecay(musclesMap[id].fatigueDamage, currentTauDamage, 1);
        musclesMap[id].fatigue = normalize(musclesMap[id].fatigueMetabolic + musclesMap[id].fatigueDamage);
        
        musclesMap[id].fitness = applyExponentialDecay(musclesMap[id].fitness, currentTauFitness, 1);
        
        // Joint stress takes ~4x longer to heal than muscle damage (tendons heal very slowly)
        const currentTauJoint = isDeload ? (baseTauDamage * 4.0) / 1.5 : baseTauDamage * 4.0;
        musclesMap[id].jointStress = applyExponentialDecay((musclesMap[id].jointStress || 0), currentTauJoint, 1);

        if (musclesMap[id].contributions) {
          Object.keys(musclesMap[id].contributions).forEach(exNom => {
            musclesMap[id].contributions[exNom] = applyExponentialDecay(musclesMap[id].contributions[exNom], currentTauDamage, 1);
          });
        }
      });

      sncFatigue = applyExponentialDecay(sncFatigue, config.tauMetabolic, 1);
      chronicSncStress = applyExponentialDecay(chronicSncStress, config.tauChronicSnc, 1);

      const dayName = DAY_NAMES[day];
      if (toggledDays[dayName] !== false && toggledDays[day] !== false) {
        const plannedExercises = (blueprint[dayName as keyof typeof blueprint] || blueprint[day as unknown as keyof typeof blueprint]) || [];
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

            // Dynamic PPL tracking (Bug #5 Fix): Increment based on sets actually executed
            if (exercise.ppl_category === 'push') pushSets += validSet.series;
            else if (exercise.ppl_category === 'pull') pullSets += validSet.series;
            else if (exercise.ppl_category === 'legs') legsSets += validSet.series;
            
            const currentFatigueForGovernor = musclesMap[exercise.muscle_primaire]?.fatigue || 0;
            const impact = calculateSetImpact(validSet, exercise, profile, config, currentFatigueForGovernor);
            const overloadMultiplier = getProgressionMultiplier(week, isDeload, !!logMatch);

            const finalInol = impact.inol * overloadMultiplier;
            const sncPoints = impact.sncPoints * overloadMultiplier;
            
            sncFatigue = normalize(sncFatigue + sncPoints * (1 / config.cnsResilience));
            chronicSncStress = normalize(chronicSncStress + sncPoints * (1 / config.cnsResilience));

            const setIdBase = `${week}-${day}-${plannedEx.exerciseId}-${setIndex}`;

            if (week === totalWeeks && exercise.tier_snc === 1 && exercise.equipment === 'poids_libre') {
              axialSncLoad = normalize(axialSncLoad + finalInol);
            }

            let setSystemicLoad = 0;

            Object.entries(tensionMatrix).forEach(([muscleId, coeff]) => {
              if (musclesMap[muscleId]) {
                const muscleLoad = finalInol * coeff;
                setSystemicLoad += muscleLoad;
                
                // RBE (Repeated Bout Effect) : Moins de dommages structurels si l'athlète est avancé
                const fitnessRatio = musclesMap[muscleId].fitness / config.geneticCeiling;
                let baseDamageRatio = Math.max(0.1, 0.4 - fitnessRatio * 0.3); // Débutant: ~0.4. Élite: ~0.1
                if (validSet.rpe >= 9 || validSet.reps <= 5) baseDamageRatio += 0.1; // Heavy/Failure adds damage
                const damageRatio = Math.min(1.0, baseDamageRatio);
                const metabolicRatio = 1 - damageRatio;

                dailyRawAccumulator[muscleId].metabolic += muscleLoad * metabolicRatio;
                dailyRawAccumulator[muscleId].damage += muscleLoad * damageRatio;
                dailyRawAccumulator[muscleId].inol += muscleLoad;
                
                let adaptationMultiplier = config.k1;
                const currentFatigue = musclesMap[muscleId].fatigue;
                if (currentFatigue > 1.5) {
                  adaptationMultiplier = Math.max(0.0, config.k1 - (currentFatigue - 1.5) * config.k2);
                }
                
                // Burnout Penalty (Catabolisme) : Si le SNC est épuisé, le gain est bloqué
                let burnoutPenalty = 1.0;
                if (chronicSncStress > 3.0) burnoutPenalty = Math.max(0, 1.0 - (chronicSncStress - 3.0) * 0.2);
                
                // Gain brut accumulé pour la journée (le plafond et l'atténuation du junk volume s'appliqueront en fin de journée)
                const rawGain = muscleLoad * 0.5 * adaptationMultiplier * burnoutPenalty;
                dailyRawAccumulator[muscleId].rawFitnessGain += rawGain;
                
                musclesMap[muscleId].sets = normalize(musclesMap[muscleId].sets + validSet.series * coeff);
                dailyRawAccumulator[muscleId].contributions[exercise.nom] = (dailyRawAccumulator[muscleId].contributions[exercise.nom] || 0) + muscleLoad;
                dailyRawAccumulator[muscleId].setsContributions[exercise.nom] = (dailyRawAccumulator[muscleId].setsContributions[exercise.nom] || 0) + validSet.series * coeff;

                let jointStressIncrement = muscleLoad * 0.5;
                if (validSet.reps <= 5 && validSet.rpe >= 9) {
                  jointStressIncrement += muscleLoad * 1.5;
                }
                dailyRawAccumulator[muscleId].joint += jointStressIncrement;
                
                if (week === totalWeeks) {
                  weeklyEffectiveSetsRaw[muscleId] = (weeklyEffectiveSetsRaw[muscleId] || 0) + validSet.series;
                }

                if (week === totalWeeks && selectedDay && String(day) === String(selectedDay)) {
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

      // Apply Junk Volume Diminishing Returns at the end of the day
      Object.entries(dailyRawAccumulator).forEach(([muscleId, raw]) => {
        if (raw.inol > 0) {
          const effectiveTotalInol = applyDiminishingReturns(raw.inol);
          const attenuation = effectiveTotalInol / raw.inol; // e.g. 0.8 => 80% effective

          musclesMap[muscleId].fatigueMetabolic = normalize(musclesMap[muscleId].fatigueMetabolic + raw.metabolic * attenuation);
          musclesMap[muscleId].fatigueDamage = normalize(musclesMap[muscleId].fatigueDamage + raw.damage * attenuation);
          musclesMap[muscleId].fatigue = normalize(musclesMap[muscleId].fatigueMetabolic + musclesMap[muscleId].fatigueDamage);
          musclesMap[muscleId].jointStress = normalize((musclesMap[muscleId].jointStress || 0) + raw.joint); // BUG FIX: Joint stress takes RAW impact
          
          const effectiveRawGain = raw.rawFitnessGain * attenuation;
          const adjustedGain = applyLogisticCeilingEffect(effectiveRawGain, musclesMap[muscleId].fitness, config.geneticCeiling);
          musclesMap[muscleId].fitness = normalize(musclesMap[muscleId].fitness + Math.max(0, adjustedGain));
          
          musclesMap[muscleId].inol = normalize((musclesMap[muscleId].inol || 0) + effectiveTotalInol);
          musclesMap[muscleId].weeklyInol[week] = (musclesMap[muscleId].weeklyInol[week] || 0) + effectiveTotalInol;

          Object.entries(raw.contributions).forEach(([exNom, val]) => {
            musclesMap[muscleId].contributions[exNom] = normalize((musclesMap[muscleId].contributions[exNom] || 0) + val * attenuation);
          });
          Object.entries(raw.setsContributions).forEach(([exNom, val]) => {
            musclesMap[muscleId].setsContributions[exNom] = normalize((musclesMap[muscleId].setsContributions[exNom] || 0) + val); // Keep raw sets for UI
          });
        }
      });

      weeklySystemicInol[week].push(dailySystemicLoad);

      Object.keys(musclesMap).forEach(id => {
        const f = musclesMap[id].fatigue;
        musclesMap[id].fatigueHistory.push(f);
        if (musclesMap[id].fatigueHistory.length > 60) {
          musclesMap[id].fatigueHistory.shift();
        }

        if (week === totalWeeks) {
          if (!peakFatigue[id] || f > peakFatigue[id].value) {
            peakFatigue[id] = { value: parseFloat(f.toFixed(4)), day };
          }
        }
      });

      if (week === totalWeeks) {
        if (selectedDay && String(day) === String(selectedDay)) {
          snapshotMuscles = createLightSnapshot(musclesMap);
          snapshotSnc = sncFatigue;
          snapshotChronicSnc = chronicSncStress;
        } else if (!selectedDay && dayIndex === 6) {
          snapshotMuscles = createLightSnapshot(musclesMap);
          snapshotSnc = sncFatigue;
          snapshotChronicSnc = chronicSncStress;
        }
      }
    } // day loop

    calculateInjuryPredictions(musclesMap, week, injuryPredictions);

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
    finalMuscles: musclesMap,
    targetMuscles,
    targetSnc,
    snapshotMuscles,
    snapshotSnc,
    snapshotChronicSnc,
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
