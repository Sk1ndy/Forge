import { MuscleId } from '../../types';
import { MUSCLE_DETAILS, PARENT_CHILD_WEIGHTS } from '../../constants';
import { normalize } from '../biomechanics/physiology';

export interface MuscleState {
  fatigue: number; // Total fatigue = metabolic + damage
  fatigueMetabolic: number;
  fatigueDamage: number;
  inol: number;
  fitness: number;
  sets: number;
  jointStress: number;
  contributions: { [exId: string]: number };
  setsContributions: { [exId: string]: number };
  fatigueHistory: number[];
  uniqueSets: Set<string>;
  weeklyInol: { [week: number]: number };
}

export type MusclesMap = Record<string, MuscleState>;

export interface EngineState {
  muscles: MusclesMap;
  sncFatigue: number;
  chronicSncStress: number;
  dayIndex: number; // Index absolu depuis le début de la simulation
  pushSets: number;
  pullSets: number;
  legsSets: number;
  axialSncLoad: number;
}

export function createInitialState(): MusclesMap {
  const map: MusclesMap = {};
  Object.keys(MUSCLE_DETAILS).forEach(id => {
    map[id] = { fatigue: 0, fatigueMetabolic: 0, fatigueDamage: 0, inol: 0, fitness: 0, sets: 0, jointStress: 0, contributions: {}, setsContributions: {}, fatigueHistory: [], uniqueSets: new Set<string>(), weeklyInol: {} };
  });
  return map;
}

export function createLightSnapshot(source: MusclesMap): MusclesMap {
  const snapshot: MusclesMap = {};
  for (const key in source) {
    const s = source[key];
    snapshot[key] = {
      ...s,
      contributions: { ...s.contributions },
      setsContributions: { ...s.setsContributions },
      fatigueHistory: [...s.fatigueHistory],
      uniqueSets: new Set<string>(s.uniqueSets),
      weeklyInol: { ...s.weeklyInol }
    };
  }
  return snapshot;
}

export function aggregateMuscle(
  targetMuscles: MusclesMap, 
  dailyInol: Record<string, number>, 
  totalWeeks: number, 
  parentKey: MuscleId, 
  childKeys: MuscleId[]
) {
  const parent = targetMuscles[parentKey] || { fatigue: 0, fatigueMetabolic: 0, fatigueDamage: 0, inol: 0, fitness: 0, sets: 0, jointStress: 0, contributions: {}, setsContributions: {}, fatigueHistory: [], uniqueSets: new Set<string>(), weeklyInol: {} };
  const weights = PARENT_CHILD_WEIGHTS[parentKey] || {};
  
  let totalFatigueMetabolic = parent.fatigueMetabolic;
  let totalFatigueDamage = parent.fatigueDamage;
  let totalFitness = parent.fitness;
  let totalInol = parent.inol || 0;
  let totalJointStress = parent.jointStress;
  let totalDailyInol = dailyInol[parentKey] || 0;
  
  let totalFatigueHistory = parent.fatigueHistory && parent.fatigueHistory.length > 0 ? [...parent.fatigueHistory] : Array(totalWeeks * 7).fill(0);
  const combinedContributions = { ...parent.contributions };
  const combinedSetsContributions = { ...parent.setsContributions };
  const combinedUniqueSets = new Set<string>(parent.uniqueSets);
  const combinedWeeklyInol = { ...parent.weeklyInol };

  childKeys.forEach(childKey => {
    const child = targetMuscles[childKey];
    if (child) {
      const coeff = weights[childKey] ?? 1.0;
      totalFatigueMetabolic = normalize(totalFatigueMetabolic + child.fatigueMetabolic * coeff);
      totalFatigueDamage = normalize(totalFatigueDamage + child.fatigueDamage * coeff);
      totalFitness = normalize(totalFitness + child.fitness * coeff);
      totalInol = normalize(totalInol + (child.inol || 0) * coeff);
      totalJointStress = normalize(totalJointStress + child.jointStress * coeff);
      totalDailyInol = normalize(totalDailyInol + (dailyInol[childKey] || 0) * coeff);

      if (child.fatigueHistory) {
        totalFatigueHistory = totalFatigueHistory.map((val, idx) => normalize(val + (child.fatigueHistory[idx] || 0) * coeff));
      }

      Object.entries(child.contributions || {}).forEach(([exNom, val]) => {
        combinedContributions[exNom] = normalize((combinedContributions[exNom] || 0) + val * coeff);
      });
      
      Object.entries(child.setsContributions || {}).forEach(([exNom, val]) => {
        combinedSetsContributions[exNom] = (combinedSetsContributions[exNom] || 0) + val;
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
  const totalFatigue = normalize(totalFatigueMetabolic + totalFatigueDamage);
  targetMuscles[parentKey] = {
    fatigue: totalFatigue,
    fatigueMetabolic: totalFatigueMetabolic,
    fatigueDamage: totalFatigueDamage,
    inol: totalInol,
    fitness: totalFitness,
    sets: combinedUniqueSets.size,
    jointStress: totalJointStress,
    contributions: combinedContributions,
    setsContributions: combinedSetsContributions,
    fatigueHistory: totalFatigueHistory,
    uniqueSets: combinedUniqueSets,
    weeklyInol: combinedWeeklyInol
  };
}
