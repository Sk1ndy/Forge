// Re-export tous les types de base générés par Zod pour la rétrocompatibilité
export * from './schemas';
import { MuscleStatus, MuscleId } from './schemas';
import { EngineState } from './engine/core/state';

// ─── Simulation Outputs (Read-only) ─────────────────────────────────────────

export interface WeeklyMacro {
  peakFatigue: Record<string, { value: number; day: number }>;
  weeklyEffectiveSets: Record<string, number>;
  pushPullRatio: { push: number; pull: number };
  axialSncLoad: number;
  traumaAlerts: string[];
}

export interface WeeklyTrauma {
  muscleId: string;  // ID brut du muscle (ex: 'chest') — traduit côté UI
  peakInol: number;
  dayIndex: number; // 0 = Lundi … 6 = Dimanche
}

export interface SimulationResult {
  muscles: { [muscleId in MuscleId]?: MuscleStatus };
  sncScore: number;
  sncPercentage: number;
  cnsFailure: boolean;
  chronicSncStress: number; // Accumulation à long terme du stress nerveux
  junkVolumeAlerts: { muscleId: string; inolScore: number; code: string }[]; // Alertes de junk volume basées sur l'INOL de la séance
  globalWorkCapacity: number; // Capacité de travail systémique restante (0-100)
  systemicReadiness: number; // Score gamifié de Readiness globale (0-100)
  topSurcharged: MuscleStatus[];
  topNeglected: MuscleStatus[];
  pushPullLegsRatio: { push: number; pull: number; legs: number };
  weeklyMacro: WeeklyMacro;
  weeklyTraumas: WeeklyTrauma[];
  progressiveOverload: { [muscleId: string]: { weekOverWeekGrowthPct: number } };
  injuryPredictions: { muscleId: string; acwr: number; code: string }[]; // Alertes si un muscle est en DANGER (rouge) > 3 semaines
  monotonyAlerts: { week: number; code: string; monotonyIndex: number }[]; // Alertes de faible variance + indice CV numérique
  globalAcwr: number; // ACWR systémique agrégé (max des muscles en alerte, ou 1.0) — zones: <0.8 gris, 0.8-1.3 vert, 1.3-1.5 orange, >1.5 rouge
  weeklySystemicInol?: Record<number, number[]>; // Array de 7 nombres (Lundi->Dimanche) pour chaque semaine
  tensors?: Record<string, number[]>; // Normalized ML tensors [0,1]
  finalState?: EngineState; // EngineState final pour la reprise (remplace any)
  stochasticBands?: {
    systemicReadiness: { low: number; high: number };
  };
}
