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
import { RawWearableData } from '../../schemas';
import { TelemetryAdapter } from './adapters/TelemetryAdapter';
import { adjustRecovery } from './biomechanics/adaptive';

export interface LoopSimulationResult {
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
  monotonyAlerts: []
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
      const maxVal = Math.max(...history);
      const dayIndex = history.indexOf(maxVal) % 7; 
      filteredPeakFatigue[id] = { value: parseFloat(maxVal.toFixed(4)), day: dayIndex };
    }
  });

  const weeklyEffectiveSets: Record<string, number> = {};
  GRAND_GROUP_IDS.forEach(id => { weeklyEffectiveSets[id] = Math.round(loopResult.weeklyEffectiveSetsRaw[id] ?? 0); });

  const traumaAlerts: string[] = [];
  Object.entries(filteredPeakFatigue).forEach(([id, { value, day: peakDay }]) => {
    if (value > 2.5) traumaAlerts.push(`${MUSCLE_DETAILS[id as MuscleId] ?? id} — pic critique jour ${peakDay} (fatigue ${value.toFixed(2)})`);
  });

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
    tensors
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
  blueprintId?: string
): SimulationResult {
  if (totalWeeks < 1) totalWeeks = 1;
  const cacheKey = generateCacheKey(blueprint, profile, toggledDays, selectedDay, totalWeeks, deloadWeeks, sessionLogs, blueprintId);
  if (simulationCache.has(cacheKey)) return simulationCache.get(cacheKey)!;

  const generator = executeSimulationGenerator(
    blueprint, profile, toggledDays, selectedDay, exerciseLibrary, totalWeeks, deloadWeeks, sessionLogs
  );
  
  let loopResult: LoopSimulationResult;
  let resultObj = generator.next();
  while (!resultObj.done) {
    resultObj = generator.next();
  }
  loopResult = resultObj.value;

  const result = finalizeSimulationResult(loopResult, totalWeeks, deloadWeeks, profile.maxSnc || 15.0);
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
  if (totalWeeks < 1) totalWeeks = 1;
  const cacheKey = generateCacheKey(blueprint, profile, toggledDays, selectedDay, totalWeeks, deloadWeeks, sessionLogs, blueprintId);
  if (simulationCache.has(cacheKey)) return simulationCache.get(cacheKey)!;

  const generator = executeSimulationGenerator(
    blueprint, profile, toggledDays, selectedDay, exerciseLibrary, totalWeeks, deloadWeeks, sessionLogs
  );
  
  let loopResult: LoopSimulationResult;
  let resultObj = generator.next();
  while (!resultObj.done) {
    // Yield to the event loop
    await new Promise(r => setTimeout(r, 16));
    resultObj = generator.next();
  }
  loopResult = resultObj.value;

  const result = finalizeSimulationResult(loopResult, totalWeeks, deloadWeeks, profile.maxSnc || 15.0);
  simulationCache.set(cacheKey, result);
  return result;
}

export const runWeeklySimulation = runMesocycleSimulation;
export const runWeeklySimulationAsync = runMesocycleSimulationAsync;
