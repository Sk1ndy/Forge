// Re-export tous les types de base générés par Zod pour la rétrocompatibilité
export * from './schemas';
import { MuscleStatus, MuscleId } from './schemas';

// ─── Simulation Outputs (Read-only) ─────────────────────────────────────────

export interface WeeklyMacro {
  peakFatigue: Record<string, { value: number; day: string }>;
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
  junkVolumeAlerts: string[]; // Alertes de junk volume basées sur l'INOL de la séance
  globalWorkCapacity: number; // Capacité de travail systémique restante (0-100)
  systemicReadiness: number; // Score gamifié de Readiness globale (0-100)
  topSurcharged: MuscleStatus[];
  topNeglected: MuscleStatus[];
  pushPullLegsRatio: { push: number; pull: number; legs: number };
  weeklyMacro: WeeklyMacro;
  weeklyTraumas: WeeklyTrauma[];
}
