import { 
  MuscleId, Exercise, UserProfile, WeeklyBlueprint, 
  PlannedSetSchema, MuscleStatus, MuscleStatusToken, WeeklyMacro, WeeklyTrauma, SimulationResult, ExerciseLog 
} from './types';
import { 
  DEFAULT_EXERCISE_LIBRARY, DEFAULT_EXERCISE_TENSION_MATRICES, 
  MUSCLE_FATIGUE_DECAY, FITNESS_RETENTION_RATE, 
  PARENT_CHILD_WEIGHTS, MUSCLE_DETAILS 
} from './constants';
import { calculateSetImpact, normalize } from './biomechanics';

// ─── FAILLE 4 CORRIGÉE : Vrai algorithme LRU O(1) ──────────────────────────
class LRUCache<K, V> {
  private capacity: number;
  private map: Map<K, V>;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.map = new Map<K, V>();
  }

  has(key: K): boolean {
    return this.map.has(key);
  }

  get(key: K): V | undefined {
    if (!this.map.has(key)) return undefined;
    const value = this.map.get(key)!;
    this.map.delete(key);
    this.map.set(key, value);
    return value;
  }

  set(key: K, value: V): void {
    if (this.map.has(key)) {
      this.map.delete(key);
    } else if (this.map.size >= this.capacity) {
      const lruKey = this.map.keys().next().value;
      if (lruKey !== undefined) this.map.delete(lruKey);
    }
    this.map.set(key, value);
  }

  get size(): number {
    return this.map.size;
  }
}

const simulationCache = new LRUCache<string, SimulationResult>(50);

function generateCacheKey(
  blueprint: WeeklyBlueprint,
  profile: UserProfile,
  toggledDays: { [day: string]: boolean },
  selectedDay: string | undefined,
  totalWeeks: number,
  deloadWeeks: number[],
  sessionLogs: ExerciseLog[] | undefined,
  blueprintId: string | undefined,
): string {
  const blueprintFingerprint = blueprintId ?? JSON.stringify(blueprint);
  const logsFingerprint = sessionLogs && sessionLogs.length > 0
    ? `${sessionLogs.length}:${sessionLogs[sessionLogs.length - 1]?.created_at ?? ''}`
    : '0';

  return [
    blueprintFingerprint,
    totalWeeks,
    deloadWeeks.join(','),
    selectedDay ?? 'ALL',
    profile.pdc,
    profile.maxSnc,
    profile.age ?? 28,
    profile.sleepHours ?? 8,
    profile.caloricStatus ?? 'maintenance',
    profile.stressLevel ?? 'moderate',
    profile.isBeginner ? '1' : '0',
    JSON.stringify(toggledDays),
    logsFingerprint,
  ].join('|');
}

export const emptySimulationResult: SimulationResult = {
  muscles: {},
  sncScore: 0,
  sncPercentage: 0,
  cnsFailure: false,
  junkVolumeAlerts: [],
  globalWorkCapacity: 100,
  systemicReadiness: 100,
  topSurcharged: [],
  topNeglected: [],
  pushPullLegsRatio: { push: 0, pull: 0, legs: 0 },
  weeklyMacro: {
    peakFatigue: {},
    weeklyEffectiveSets: {},
    pushPullRatio: { push: 50, pull: 50 },
    axialSncLoad: 0,
    traumaAlerts: []
  },
  weeklyTraumas: [],
  progressiveOverload: {},
  injuryPredictions: [],
  monotonyAlerts: []
};

/**
 * Exécute la simulation de Mésocycle complète (Modèle Fitness-Fatigue Banister)
 * Retourne le snapshot de l'avatar pour le jour sélectionné (ou Dimanche de la dernière semaine par défaut)
 */
export function runMesocycleSimulation(
  blueprint: WeeklyBlueprint,
  profile: UserProfile,
  toggledDays: { [day: string]: boolean } = {},
  selectedDay?: string,
  exerciseLibrary: Exercise[] = DEFAULT_EXERCISE_LIBRARY,
  totalWeeks: number = 4,
  deloadWeeks: number[] = [],
  sessionLogs?: ExerciseLog[],
  blueprintId?: string
): SimulationResult {
  
  // Backward compatibility safety guard
  if (totalWeeks < 1) totalWeeks = 1;

  const cacheKey = generateCacheKey(
    blueprint, profile, toggledDays, selectedDay,
    totalWeeks, deloadWeeks, sessionLogs, blueprintId
  );

  if (simulationCache.has(cacheKey)) {
    return simulationCache.get(cacheKey)!;
  }

  const DAYS_OF_WEEK = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

  const userAge = profile.age ?? 28;
  const userSleep = profile.sleepHours ?? 8;
  const userCaloric = profile.caloricStatus ?? 'maintenance';
  const userStress = profile.stressLevel ?? 'moderate';

  let recoveryMultiplier = 1.0;
  if (userAge > 40) recoveryMultiplier *= Math.max(0.70, 1 - (userAge - 40) * 0.01);
  if (userSleep < 7.5) recoveryMultiplier *= Math.max(0.60, 0.60 + (userSleep / 7.5) * 0.40);
  else if (userSleep >= 9) recoveryMultiplier *= 1.05;
  if (userCaloric === 'deficit') recoveryMultiplier *= 0.80;
  else if (userCaloric === 'surplus') recoveryMultiplier *= 1.05;
  if (userStress === 'high') recoveryMultiplier *= 0.80;
  else if (userStress === 'low') recoveryMultiplier *= 1.05;

  const musclesMap: {
    [muscleId: string]: {
      fatigue: number;
      inol: number;
      fitness: number;
      sets: number;
      jointStress: number;
      contributions: { [exId: string]: number };
      setsContributions: { [exId: string]: number };
      fatigueHistory: number[];
      uniqueSets: Set<string>;
      weeklyInol: { [week: number]: number }; // For Progressive Overload tracking
    };
  } = {};

  Object.keys(MUSCLE_DETAILS).forEach(id => {
    musclesMap[id] = { fatigue: 0, inol: 0, fitness: 0, sets: 0, jointStress: 0, contributions: {}, setsContributions: {}, fatigueHistory: [], uniqueSets: new Set<string>(), weeklyInol: {} };
  });

  const createLightSnapshot = (source: typeof musclesMap): typeof musclesMap => {
    const snapshot: typeof musclesMap = {};
    for (const key in source) {
      const s = source[key];
      snapshot[key] = {
        fatigue: s.fatigue,
        inol: s.inol,
        fitness: s.fitness,
        sets: s.sets,
        jointStress: s.jointStress,
        contributions: { ...s.contributions },
        setsContributions: { ...s.setsContributions },
        fatigueHistory: [...s.fatigueHistory],
        uniqueSets: new Set<string>(s.uniqueSets),
        weeklyInol: { ...s.weeklyInol }
      };
    }
    return snapshot;
  };

  let sncFatigue = 0;
  let snapshotMuscles = createLightSnapshot(musclesMap);
  let snapshotSnc = 0;

  const dailyInol: { [muscleId: string]: number } = {};
  const peakFatigue: Record<string, { value: number; day: string }> = {};
  const weeklyEffectiveSetsRaw: Record<string, number> = {};
  let axialSncLoad = 0;

  // Trackers for new algorithms
  const muscleDangerWeeks: { [muscleId: string]: number } = {};
  const injuryPredictions: string[] = [];
  const weeklySystemicInol: { [week: number]: number[] } = {}; // day by day total INOL
  
  // ─── MESOCYCLE LOOP ──────────────────────────────────────────────────────
  for (let week = 1; week <= totalWeeks; week++) {
    weeklySystemicInol[week] = [];
    const weekHitRed = new Set<string>();

    // Reset weekly accumulators
    Object.keys(musclesMap).forEach(id => {
      musclesMap[id].sets = 0;
      musclesMap[id].setsContributions = {};
      musclesMap[id].uniqueSets.clear();
      musclesMap[id].weeklyInol[week] = 0;
    });

    const isDeload = deloadWeeks.includes(week);

    for (const day of DAYS_OF_WEEK) {
      let dailySystemicLoad = 0;

      // A. Dissipation quotidienne
      Object.keys(musclesMap).forEach(id => {
        const baseDecay = MUSCLE_FATIGUE_DECAY[id as MuscleId] ?? 0.5;
        // Faster recovery during deload
        const deloadBonus = isDeload ? 0.85 : 1.0; 
        const adjustedDecay = Math.max(0.05, Math.min(0.98, baseDecay + (1 - recoveryMultiplier) * (1 - baseDecay))) * deloadBonus;

        musclesMap[id].fatigue = normalize(musclesMap[id].fatigue * adjustedDecay);
        musclesMap[id].fitness = normalize(musclesMap[id].fitness * FITNESS_RETENTION_RATE);
        musclesMap[id].jointStress = normalize((musclesMap[id].jointStress || 0) * (isDeload ? 0.70 : 0.90));

        if (musclesMap[id].contributions) {
          Object.keys(musclesMap[id].contributions).forEach(exNom => {
            musclesMap[id].contributions[exNom] = normalize(musclesMap[id].contributions[exNom] * adjustedDecay);
          });
        }
      });

      sncFatigue = normalize(sncFatigue * (isDeload ? 0.40 : 0.55));

      // B. Application des séances
      if (toggledDays[day] !== false) {
        const plannedExercises = blueprint[day] || [];
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

              if (logMatch) {
                if (logMatch.is_completed === false) return;
                validSet = {
                  ...validSet,
                  reps: logMatch.actual_reps ?? validSet.reps,
                  poids: logMatch.actual_weight ?? validSet.poids,
                  rpe: logMatch.actual_rpe ?? validSet.rpe
                };
              }
            }

            const impact = calculateSetImpact(validSet, exercise, profile, profile.isBeginner);
            
            // Progressive Overload Auto-increment or Deload Reduction for Unlogged Future Sets
            let overloadMultiplier = 1.0;
            if (!logMatch) {
                if (isDeload) {
                    overloadMultiplier = 0.70; // 30% cut in generated fatigue for unlogged deload sets
                } else if (week > 1) {
                    // Simulate progressive overload: 2.5% increase per week
                    overloadMultiplier = Math.pow(1.025, week - 1);
                }
            }

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
                
                let adaptationMultiplier = 1.0;
                const currentFatigue = musclesMap[muscleId].fatigue;
                if (currentFatigue > 1.5) {
                  adaptationMultiplier = Math.max(0.0, 1.0 - (currentFatigue - 1.5) * 0.6);
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

      // Fin de la journée : historique
      Object.keys(musclesMap).forEach(id => {
        const f = musclesMap[id].fatigue;
        musclesMap[id].fatigueHistory.push(f);
        
        if (f > 2.5) {
          weekHitRed.add(id);
        }

        if (week === totalWeeks) {
          if (!peakFatigue[id] || f > peakFatigue[id].value) {
            peakFatigue[id] = { value: parseFloat(f.toFixed(4)), day };
          }
        }
      });

      // Capture Snapshot sur la dernière semaine
      if (week === totalWeeks) {
        if (selectedDay && day.toLowerCase() === selectedDay.toLowerCase()) {
          snapshotMuscles = createLightSnapshot(musclesMap);
          snapshotSnc = sncFatigue;
        } else if (!selectedDay && day === 'Dimanche') {
          snapshotMuscles = createLightSnapshot(musclesMap);
          snapshotSnc = sncFatigue;
        }
      }
    } // Fin for day

    // Fin de semaine : Algorithme de Prédiction de Blessure
    Object.keys(musclesMap).forEach(id => {
        if (weekHitRed.has(id)) {
            muscleDangerWeeks[id] = (muscleDangerWeeks[id] || 0) + 1;
            if (muscleDangerWeeks[id] >= 3) {
                if (!injuryPredictions.some(p => p.includes(MUSCLE_DETAILS[id as MuscleId] || id))) {
                    injuryPredictions.push(`Risque de blessure/déchirure très élevé sur : ${MUSCLE_DETAILS[id as MuscleId] || id} (> 3 semaines en zone rouge)`);
                }
            }
        } else {
            muscleDangerWeeks[id] = 0; // reset
        }
    });

  } // Fin for week

  // Algorithme de Monotonie
  const monotonyAlerts: string[] = [];
  Object.entries(weeklySystemicInol).forEach(([wk, dailyLoads]) => {
      const w = Number(wk);
      if (deloadWeeks.includes(w)) return; // Don't flag deloads for monotony
      
      const activeDays = dailyLoads.filter(l => l > 0);
      if (activeDays.length >= 3) {
          const mean = activeDays.reduce((a, b) => a + b, 0) / activeDays.length;
          const variance = activeDays.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / activeDays.length;
          const stdDev = Math.sqrt(variance);
          
          if (mean > 0 && (stdDev / mean) < 0.15) { // Very low variance
              monotonyAlerts.push(`Semaine ${w} : Monotonie critique détectée. La charge intra-semaine est trop linéaire, augmentez la variance des intensités pour soulager le SNC.`);
          }
      }
  });

  const targetMuscles = selectedDay ? snapshotMuscles : musclesMap;
  const targetSnc = selectedDay ? snapshotSnc : sncFatigue;

  const aggregateMuscle = (parentKey: MuscleId, childKeys: MuscleId[]) => {
    const parent = targetMuscles[parentKey] || { fatigue: 0, inol: 0, fitness: 0, sets: 0, jointStress: 0, contributions: {}, setsContributions: {}, fatigueHistory: [], uniqueSets: new Set<string>(), weeklyInol: {} };
    const weights = PARENT_CHILD_WEIGHTS[parentKey] || {};
    
    let totalFatigue = parent.fatigue;
    let totalInol = parent.inol || 0;
    let totalJointStress = parent.jointStress;
    let totalDailyInol = dailyInol[parentKey] || 0;
    
    let totalFatigueHistory = parent.fatigueHistory ? [...parent.fatigueHistory] : Array(totalWeeks * 7).fill(0);
    const combinedContributions = { ...parent.contributions };
    const combinedSetsContributions = { ...parent.setsContributions };
    const combinedUniqueSets = new Set<string>(parent.uniqueSets);
    const combinedWeeklyInol = { ...parent.weeklyInol };

    childKeys.forEach(childKey => {
      const child = targetMuscles[childKey];
      if (child) {
        const coeff = weights[childKey] ?? 1.0;
        
        totalFatigue = normalize(totalFatigue + child.fatigue * coeff);
        totalInol = normalize(totalInol + (child.inol || 0) * coeff);
        totalJointStress = normalize(totalJointStress + child.jointStress * coeff);
        totalDailyInol = normalize(totalDailyInol + (dailyInol[childKey] || 0) * coeff);

        if (child.fatigueHistory) {
          totalFatigueHistory = totalFatigueHistory.map((val, idx) => normalize(val + (child.fatigueHistory[idx] || 0) * coeff));
        }

        Object.entries(child.contributions || {}).forEach(([exNom, val]) => {
          combinedContributions[exNom] = normalize((combinedContributions[exNom] || 0) + val * coeff);
        });
        
        if (child.uniqueSets) {
          child.uniqueSets.forEach(setId => combinedUniqueSets.add(setId));
        }

        Object.entries(child.weeklyInol || {}).forEach(([w, val]) => {
          combinedWeeklyInol[Number(w)] = normalize((combinedWeeklyInol[Number(w)] || 0) + val * coeff);
        });
      }
    });

    dailyInol[parentKey] = totalDailyInol;
    targetMuscles[parentKey] = {
      fatigue: totalFatigue,
      inol: totalInol,
      fitness: normalize(totalFatigue * 0.5),
      sets: combinedUniqueSets.size,
      jointStress: totalJointStress,
      contributions: combinedContributions,
      setsContributions: combinedSetsContributions,
      fatigueHistory: totalFatigueHistory,
      uniqueSets: combinedUniqueSets,
      weeklyInol: combinedWeeklyInol
    };
  };

  aggregateMuscle('chest', ['upperChest', 'lowerChest', 'serratus']);
  aggregateMuscle('quadriceps', ['innerQuad', 'outerQuad']);
  aggregateMuscle('abs', ['upperAbs', 'lowerAbs']);
  aggregateMuscle('trapezius', ['upperTrapezius', 'lowerTrapezius']);
  aggregateMuscle('upperBack', ['rhomboids', 'rotatorCuff']);
  aggregateMuscle('frontDeltoid', ['deltoids']);
  aggregateMuscle('rearDeltoid', ['deltoids']);

  const maxSnc = profile.maxSnc || 15.0;
  const cnsFailure = targetSnc > maxSnc;

  const finalMuscles: { [muscleId in MuscleId]?: MuscleStatus } = {};

  Object.entries(targetMuscles).forEach(([id, data]) => {
    const mId = id as MuscleId;
    const fatigueScore = data.fatigue;
    const trueInol = data.inol || 0;

    let color: 'grey' | 'green' | 'orange' | 'red';
    let statusLabel: MuscleStatusToken;

    if (fatigueScore < 0.5) { color = 'grey'; statusLabel = 'REST'; } 
    else if (fatigueScore <= 1.5) { color = 'green'; statusLabel = 'OPTIMAL'; } 
    else if (fatigueScore <= 2.5) { color = 'orange'; statusLabel = 'OVERLOAD'; } 
    else { color = 'red'; statusLabel = 'DANGER'; }

    const totalInolAccumulated = Object.values(data.contributions).reduce((sum, val) => sum + val, 0);
    const contributors = Object.entries(data.contributions)
      .map(([nom, val]) => ({ nom, value: val, percentage: totalInolAccumulated > 0 ? Math.round((val / totalInolAccumulated) * 100) : 0 }))
      .filter(c => c.percentage > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 3);

    const currentSum = contributors.reduce((sum, c) => sum + c.percentage, 0);
    if (currentSum > 0 && currentSum !== 100 && contributors.length > 0) {
      contributors[0].percentage += (100 - currentSum);
    }

    finalMuscles[mId] = {
      name: MUSCLE_DETAILS[mId],
      inol: parseFloat(trueInol.toFixed(2)),
      sets: data.sets,
      color,
      statusLabel,
      contributors,
      remainingCapacity: parseFloat(Math.max(0, 1 - (fatigueScore / 2.5)).toFixed(4)),
      jointStress: parseFloat((data.jointStress || 0).toFixed(2)),
      readiness: parseFloat((data.fitness - fatigueScore).toFixed(2)),
      fatigueHistory: data.fatigueHistory.map(v => parseFloat(v.toFixed(2)))
    };
  });

  // Calcul de la Surcharge Progressive
  const progressiveOverload: { [muscleId: string]: { weekOverWeekGrowthPct: number } } = {};
  if (totalWeeks > 1) {
    Object.entries(targetMuscles).forEach(([id, data]) => {
      const wk1 = data.weeklyInol[1] || 0;
      const wklast = data.weeklyInol[totalWeeks] || 0;
      if (wk1 > 0) {
         progressiveOverload[id] = {
             weekOverWeekGrowthPct: parseFloat((((wklast - wk1) / wk1) * 100).toFixed(1))
         };
      }
    });
  }

  const junkVolumeAlerts: string[] = [];
  Object.entries(dailyInol).sort((a, b) => b[1] - a[1]).forEach(([id, inolScore]) => {
      const isSubMuscle = !['chest', 'quadriceps', 'abs', 'trapezius', 'upperBack', 'frontDeltoid', 'rearDeltoid', 'biceps', 'triceps', 'lowerBack', 'gluteal', 'hamstring', 'calves', 'forearm'].includes(id);
      if (inolScore > 1.5 && finalMuscles[id as MuscleId] && !isSubMuscle) {
        junkVolumeAlerts.push(`${MUSCLE_DETAILS[id as MuscleId]} (INOL: ${inolScore.toFixed(1)})`);
      }
  });

  const sncPercentage = Math.min(100, Math.round((targetSnc / maxSnc) * 100));

  const fiveBigMuscles: MuscleId[] = ['quadriceps', 'chest', 'upperBack', 'lowerBack', 'gluteal'];
  let totalMuscleFatiguePct = 0;
  fiveBigMuscles.forEach(id => {
    const muscle = targetMuscles[id];
    totalMuscleFatiguePct += Math.min(100, Math.max(0, ((muscle ? muscle.fatigue : 0) / 2.5) * 100));
  });
  const globalWorkCapacity = Math.max(0, parseFloat((100 - ((sncPercentage + (totalMuscleFatiguePct / 5)) / 2)).toFixed(1)));

  const MAJOR_GROUPS: MuscleId[] = [
    'chest', 'upperChest', 'lowerChest', 'upperBack', 'lowerBack', 'rhomboids', 'trapezius', 'upperTrapezius', 'lowerTrapezius',
    'deltoids', 'frontDeltoid', 'rearDeltoid', 'biceps', 'triceps', 'quadriceps', 'innerQuad', 'outerQuad', 'hamstring', 'gluteal'
  ];

  const rawSurcharged = Object.entries(finalMuscles)
    .filter((entry): entry is [string, MuscleStatus] => {
      const [id, m] = entry;
      return m !== undefined && MAJOR_GROUPS.includes(id as MuscleId) && (m.color === 'red' || m.color === 'orange');
    })
    .map(([, m]) => ({ ...m }))
    .sort((a, b) => b.inol - a.inol);

  const uniqueSurcharged: MuscleStatus[] = [];
  const seenSurcharged = new Set<string>();
  for (const item of rawSurcharged) {
    if (!seenSurcharged.has(item.name)) { seenSurcharged.add(item.name); uniqueSurcharged.push(item); }
  }
  const topSurcharged = uniqueSurcharged.slice(0, 3);

  const rawNeglected = Object.entries(finalMuscles)
    .filter((entry): entry is [string, MuscleStatus] => {
      const [id, m] = entry;
      return m !== undefined && MAJOR_GROUPS.includes(id as MuscleId) && m.color === 'grey';
    })
    .map(([, m]) => ({ ...m }))
    .sort((a, b) => a.inol - b.inol);

  const uniqueNeglected: MuscleStatus[] = [];
  const seenNeglected = new Set<string>();
  for (const item of rawNeglected) {
    if (!seenNeglected.has(item.name)) { seenNeglected.add(item.name); uniqueNeglected.push(item); }
  }
  const topNeglected = uniqueNeglected.slice(0, 3);

  let totalSets = 0;
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
        if (exDef.ppl_category === 'push') { pushSets += set.series; totalSets += set.series; }
        else if (exDef.ppl_category === 'pull') { pullSets += set.series; totalSets += set.series; }
        else if (exDef.ppl_category === 'legs') { legsSets += set.series; totalSets += set.series; }
      });
    });
  });

  const GRAND_GROUP_IDS: MuscleId[] = ['chest', 'upperBack', 'frontDeltoid', 'biceps', 'triceps', 'quadriceps', 'hamstring'];
  const filteredPeakFatigue: Record<string, { value: number; day: string }> = {};
  GRAND_GROUP_IDS.forEach(id => {
    const history = finalMuscles[id]?.fatigueHistory;
    if (history && history.length > 0) {
      const maxVal = Math.max(...history);
      const dayIndex = history.indexOf(maxVal) % 7; // Modulo 7 pour le jour de la semaine
      filteredPeakFatigue[id] = { value: parseFloat(maxVal.toFixed(4)), day: DAYS_OF_WEEK[dayIndex] };
    }
  });

  const weeklyEffectiveSets: Record<string, number> = {};
  GRAND_GROUP_IDS.forEach(id => { weeklyEffectiveSets[id] = Math.round(weeklyEffectiveSetsRaw[id] ?? 0); });

  const traumaAlerts: string[] = [];
  Object.entries(filteredPeakFatigue).forEach(([id, { value, day: peakDay }]) => {
    if (value > 2.5) traumaAlerts.push(`${MUSCLE_DETAILS[id as MuscleId] ?? id} — pic critique ${peakDay} (fatigue ${value.toFixed(2)})`);
  });

  const pushPullTotal = pushSets + pullSets;
  const pushPullRatio = {
    push: pushPullTotal > 0 ? Math.round((pushSets / pushPullTotal) * 100) : 50,
    pull: pushPullTotal > 0 ? Math.round((pullSets / pushPullTotal) * 100) : 50,
  };

  const axialSncPct = Math.min(100, Math.round((axialSncLoad / profile.maxSnc!) * 100));

  const weeklyTraumas: WeeklyTrauma[] = [];
  const seenTraumaIds = new Set<string>();
  MAJOR_GROUPS.forEach(id => {
    const muscle = finalMuscles[id as MuscleId];
    if (!muscle || !muscle.fatigueHistory || muscle.fatigueHistory.length === 0) return;
    const peakInol = Math.max(...muscle.fatigueHistory);
    if (peakInol <= 2.5) return;
    const technicalName = MUSCLE_DETAILS[id as MuscleId] || id;
    if (seenTraumaIds.has(technicalName)) return;
    seenTraumaIds.add(technicalName);
    weeklyTraumas.push({
      muscleId: id,
      peakInol: parseFloat(peakInol.toFixed(2)),
      dayIndex: muscle.fatigueHistory.indexOf(peakInol) % 7,
    });
  });
  weeklyTraumas.sort((a, b) => b.peakInol - a.peakInol);

  const result: SimulationResult = {
    muscles: finalMuscles,
    sncScore: parseFloat(targetSnc.toFixed(2)),
    sncPercentage,
    cnsFailure,
    junkVolumeAlerts,
    globalWorkCapacity,
    systemicReadiness: globalWorkCapacity,
    topSurcharged,
    topNeglected,
    pushPullLegsRatio: { push: totalSets > 0 ? (pushSets / totalSets) * 100 : 0, pull: totalSets > 0 ? (pullSets / totalSets) * 100 : 0, legs: totalSets > 0 ? (legsSets / totalSets) * 100 : 0 },
    weeklyMacro: { peakFatigue: filteredPeakFatigue, weeklyEffectiveSets, pushPullRatio, axialSncLoad: axialSncPct, traumaAlerts },
    weeklyTraumas,
    progressiveOverload,
    injuryPredictions,
    monotonyAlerts
  };

  simulationCache.set(cacheKey, result);
  return result;
}

export async function runMesocycleSimulationAsync(
  blueprint: WeeklyBlueprint,
  profile: UserProfile,
  toggledDays: { [day: string]: boolean } = {},
  selectedDay?: string,
  exerciseLibrary: Exercise[] = DEFAULT_EXERCISE_LIBRARY,
  totalWeeks: number = 4,
  deloadWeeks: number[] = [],
  sessionLogs?: ExerciseLog[],
  blueprintId?: string
): Promise<SimulationResult> {
  const cacheKey = generateCacheKey(blueprint, profile, toggledDays, selectedDay, totalWeeks, deloadWeeks, sessionLogs, blueprintId);
  if (simulationCache.has(cacheKey)) return simulationCache.get(cacheKey)!;
  await new Promise(resolve => setTimeout(resolve, 0));
  return runMesocycleSimulation(blueprint, profile, toggledDays, selectedDay, exerciseLibrary, totalWeeks, deloadWeeks, sessionLogs, blueprintId);
}

// Rétrocompatibilité (Alias pour l'ancien nom de la fonction)
export const runWeeklySimulation = runMesocycleSimulation;
export const runWeeklySimulationAsync = runMesocycleSimulationAsync;
