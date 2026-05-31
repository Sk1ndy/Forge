import { WeeklyBlueprint, UserProfile, ExerciseLog, Exercise, SimulationResult, WeeklyTrauma, MuscleId, MuscleStatus } from '../types';
import { DEFAULT_EXERCISE_LIBRARY, MUSCLE_DETAILS } from '../constants';
import { generateCacheKey, simulationCache } from './core/cache';
import { executeSimulationGenerator } from './core/loop';
import { formatMuscleStatus } from './formatters/ui-tokens';
import { calculateGlobalWorkCapacity } from './formatters/cns';
import { calculateJunkVolumeAlerts } from './algorithms/junk-volume';
import { calculateProgressiveOverload } from './algorithms/progressive-overload';
import { calculateMonotonyAlerts } from './algorithms/monotony';
import { normalizeFatigueHistoryToTensors } from './formatters/tensors';
import { MusclesMap, EngineState } from './core/state';
import { RawWearableData, WeeklyBlueprintSchema, UserProfileSchema } from '../schemas';
import { TelemetryAdapter } from './adapters/TelemetryAdapter';
import { adjustRecovery } from './biomechanics/adaptive';

export interface LoopSimulationResult {
  finalState?: EngineState;
  targetMuscles: MusclesMap;
  targetSnc: number;
  snapshotChronicSnc: number;
  dailyInol: Record<string, number>;
  injuryPredictions: { muscleId: string; acwr: number; code: string }[];
  weeklySystemicInol: Record<number, number[]>;
  weeklyEffectiveSetsRaw: Record<string, number>;
  peakFatigue: Record<string, { value: number; day: number }>;
  axialSncLoad: number;
  pushSets: number;
  pullSets: number;
  legsSets: number;
}

export const emptySimulationResult: SimulationResult = {
  muscles: {},
  sncScore: 0,
  sncPercentage: 0,
  cnsFailure: false,
  chronicSncStress: 0,
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
  monotonyAlerts: [],
  globalAcwr: 1.0
};

function finalizeSimulationResult(loopResult: LoopSimulationResult, totalWeeks: number, deloadWeeks: number[], maxSnc: number): SimulationResult {
  const finalMuscles = formatMuscleStatus(loopResult.targetMuscles);
  const { sncPercentage, globalWorkCapacity, cnsFailure } = calculateGlobalWorkCapacity(loopResult.targetSnc, maxSnc, loopResult.targetMuscles);
  const progressiveOverload = calculateProgressiveOverload(loopResult.targetMuscles, totalWeeks);
  const junkVolumeAlerts = calculateJunkVolumeAlerts(loopResult.dailyInol, finalMuscles);
  const monotonyAlerts = calculateMonotonyAlerts(loopResult.weeklySystemicInol, deloadWeeks);
  const tensors = normalizeFatigueHistoryToTensors(loopResult.targetMuscles);

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

  const totalSets = loopResult.pushSets + loopResult.pullSets + loopResult.legsSets;
  const pushPullLegsRatio = { 
    push: totalSets > 0 ? Math.round((loopResult.pushSets / totalSets) * 100) : 0, 
    pull: totalSets > 0 ? Math.round((loopResult.pullSets / totalSets) * 100) : 0, 
    legs: totalSets > 0 ? Math.round((loopResult.legsSets / totalSets) * 100) : 0 
  };

  const pushPullTotal = loopResult.pushSets + loopResult.pullSets;
  const pushPullRatio = {
    push: pushPullTotal > 0 ? Math.round((loopResult.pushSets / pushPullTotal) * 100) : 50,
    pull: pushPullTotal > 0 ? Math.round((loopResult.pullSets / pushPullTotal) * 100) : 50,
  };

  const GRAND_GROUP_IDS: MuscleId[] = ['chest', 'upperBack', 'frontDeltoid', 'biceps', 'triceps', 'quadriceps', 'hamstring'];
  const filteredPeakFatigue: Record<string, { value: number; day: number }> = {};
  GRAND_GROUP_IDS.forEach(id => {
    const history = finalMuscles[id as MuscleId]?.fatigueHistory;
    if (history && history.length > 0) {
      const maxVal = history.reduce((a, b) => Math.max(a, b), 0);
      const dayIndex = history.indexOf(maxVal) % 7; 
      filteredPeakFatigue[id] = { value: parseFloat(maxVal.toFixed(4)), day: dayIndex };
    }
  });

  const weeklyEffectiveSets: Record<string, number> = {};
  GRAND_GROUP_IDS.forEach(id => { weeklyEffectiveSets[id] = Math.round((loopResult.weeklyEffectiveSetsRaw[id] ?? 0) / Math.max(1, totalWeeks)); });

  const traumaAlerts: string[] = [];
  Object.entries(filteredPeakFatigue).forEach(([id, { value, day: peakDay }]) => {
    if (value > 2.5) traumaAlerts.push(`${MUSCLE_DETAILS[id as MuscleId] ?? id} — pic critique jour ${peakDay} (fatigue ${value.toFixed(2)})`);
  });

  const weeklyTraumas: WeeklyTrauma[] = [];
  const seenTraumaIds = new Set<string>();
  MAJOR_GROUPS.forEach(id => {
    const muscle = finalMuscles[id as MuscleId];
    if (!muscle || !muscle.fatigueHistory || muscle.fatigueHistory.length === 0) return;
    const peakInol = muscle.fatigueHistory.reduce((a, b) => Math.max(a, b), 0);
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

  // ACWR global agrégé : max des ACWR des muscles en alerte, ou 1.0 si aucune alerte
  const globalAcwr: number = loopResult.injuryPredictions.length > 0
    ? parseFloat(Math.max(...loopResult.injuryPredictions.map(p => p.acwr)).toFixed(2))
    : 1.0;

  return {
    muscles: finalMuscles,
    sncScore: parseFloat(loopResult.targetSnc.toFixed(2)),
    sncPercentage,
    cnsFailure,
    chronicSncStress: parseFloat((loopResult.snapshotChronicSnc || 0).toFixed(2)),
    junkVolumeAlerts,
    globalWorkCapacity,
    systemicReadiness: globalWorkCapacity,
    topSurcharged,
    topNeglected,
    pushPullLegsRatio,
    weeklyMacro: { peakFatigue: filteredPeakFatigue, weeklyEffectiveSets, pushPullRatio, axialSncLoad: loopResult.axialSncLoad, traumaAlerts },
    weeklyTraumas,
    progressiveOverload,
    injuryPredictions: loopResult.injuryPredictions,
    monotonyAlerts,
    globalAcwr,
    tensors,
    finalState: loopResult.finalState
  };
}

export function runMesocycleSimulation(
  blueprint: WeeklyBlueprint,
  profile: UserProfile,
  toggledDays: { [day: string]: boolean } = {},
  selectedDay?: string,
  exerciseLibrary: Exercise[] = DEFAULT_EXERCISE_LIBRARY,
  totalWeeks: number = 4,
  deloadWeeks: number[] = [],
  sessionLogs?: ExerciseLog[],
  blueprintId?: string,
  wearableData?: RawWearableData,
  options?: { stochasticMode?: boolean, subscriptionTier?: 'free' | 'pro' | 'elite' },
  initialState?: EngineState
): SimulationResult {
  // Input validation (Bug #13 Fix)
  UserProfileSchema.parse(profile);
  WeeklyBlueprintSchema.parse(blueprint);

  if (totalWeeks < 1) totalWeeks = 1;
  const cacheKey = generateCacheKey(blueprint, profile, toggledDays, selectedDay, totalWeeks, deloadWeeks, sessionLogs, blueprintId, wearableData) + (options?.stochasticMode ? '_stochastic' : '');
  if (simulationCache.has(cacheKey)) return simulationCache.get(cacheKey)!;

  const runPass = (varianceMod: number) => {
    const modProfile = { ...profile, maxSnc: (profile.maxSnc || 15.0) * varianceMod };
    const generator = executeSimulationGenerator(
      blueprint, modProfile, toggledDays, selectedDay, exerciseLibrary, totalWeeks, deloadWeeks, sessionLogs, initialState, wearableData
    );
    let resultObj = generator.next();
    while (!resultObj.done) resultObj = generator.next();
    return resultObj.value;
  };

  const expectedLoop = runPass(1.0);
  const result = finalizeSimulationResult(expectedLoop, totalWeeks, deloadWeeks, profile.maxSnc || 15.0);

  if (options?.stochasticMode) {
    const worstLoop = runPass(0.9); // 10% less resilient
    const bestLoop = runPass(1.1);  // 10% more resilient
    const worstResult = finalizeSimulationResult(worstLoop, totalWeeks, deloadWeeks, profile.maxSnc || 15.0);
    const bestResult = finalizeSimulationResult(bestLoop, totalWeeks, deloadWeeks, profile.maxSnc || 15.0);
    
    result.stochasticBands = {
      systemicReadiness: {
        low: parseFloat(Math.min(worstResult.systemicReadiness, result.systemicReadiness).toFixed(2)),
        high: parseFloat(Math.max(bestResult.systemicReadiness, result.systemicReadiness).toFixed(2))
      }
    };
  }

  // Gating Premium (Axe E)
  const tier = options?.subscriptionTier || 'elite';
  if (tier === 'free') {
    result.injuryPredictions = [];
    result.monotonyAlerts = [];
    result.chronicSncStress = 0;
    delete result.stochasticBands;
    delete result.tensors;
  } else if (tier === 'pro') {
    delete result.stochasticBands;
    delete result.tensors;
  }

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
  blueprintId?: string,
  wearableData?: RawWearableData,
  options?: { stochasticMode?: boolean, subscriptionTier?: 'free' | 'pro' | 'elite' },
  initialState?: EngineState
): Promise<SimulationResult> {
  // Input validation (Bug #13 Fix)
  UserProfileSchema.parse(profile);
  WeeklyBlueprintSchema.parse(blueprint);

  if (totalWeeks < 1) totalWeeks = 1;
  const cacheKey = generateCacheKey(blueprint, profile, toggledDays, selectedDay, totalWeeks, deloadWeeks, sessionLogs, blueprintId, wearableData) + (options?.stochasticMode ? '_stochastic' : '');
  if (simulationCache.has(cacheKey)) return simulationCache.get(cacheKey)!;

  const runPassAsync = async (varianceMod: number) => {
    const modProfile = { ...profile, maxSnc: (profile.maxSnc || 15.0) * varianceMod };
    const generator = executeSimulationGenerator(
      blueprint, modProfile, toggledDays, selectedDay, exerciseLibrary, totalWeeks, deloadWeeks, sessionLogs, initialState, wearableData
    );
    let resultObj = generator.next();
    while (!resultObj.done) {
      await new Promise(r => setTimeout(r, 16));
      resultObj = generator.next();
    }
    return resultObj.value;
  };

  const expectedLoop = await runPassAsync(1.0);
  const result = finalizeSimulationResult(expectedLoop, totalWeeks, deloadWeeks, profile.maxSnc || 15.0);

  if (options?.stochasticMode) {
    const worstLoop = await runPassAsync(0.9);
    const bestLoop = await runPassAsync(1.1);
    const worstResult = finalizeSimulationResult(worstLoop, totalWeeks, deloadWeeks, profile.maxSnc || 15.0);
    const bestResult = finalizeSimulationResult(bestLoop, totalWeeks, deloadWeeks, profile.maxSnc || 15.0);
    
    result.stochasticBands = {
      systemicReadiness: {
        low: parseFloat(Math.min(worstResult.systemicReadiness, result.systemicReadiness).toFixed(2)),
        high: parseFloat(Math.max(bestResult.systemicReadiness, result.systemicReadiness).toFixed(2))
      }
    };
  }

  // Gating Premium (Axe E)
  const tier = options?.subscriptionTier || 'elite';
  if (tier === 'free') {
    result.injuryPredictions = [];
    result.monotonyAlerts = [];
    result.chronicSncStress = 0;
    delete result.stochasticBands;
    delete result.tensors;
  } else if (tier === 'pro') {
    delete result.stochasticBands;
    delete result.tensors;
  }

  simulationCache.set(cacheKey, result);
  return result;
}

export const runWeeklySimulation = runMesocycleSimulation;
export const runWeeklySimulationAsync = runMesocycleSimulationAsync;

export { generateTrainingProgram } from './algorithms/program-generator';
