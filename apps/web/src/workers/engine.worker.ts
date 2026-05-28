import * as Comlink from 'comlink';
import { runWeeklySimulationAsync } from '@forge/shared';

const engineWorker = {
  runSimulation: async (
    blueprint: any,
    profile: any,
    toggledDays: any,
    selectedDay: string | undefined,
    exercises: any,
    totalWeeks: number = 4,
    deloadWeeks: number[] = [],
    sessionLogs: any[] = [],
    blueprintId?: string
  ) => {
    return runWeeklySimulationAsync(
      blueprint,
      profile,
      toggledDays,
      selectedDay,
      exercises,
      totalWeeks,
      deloadWeeks,
      sessionLogs,
      blueprintId
    );
  }
};

Comlink.expose(engineWorker);
export type EngineWorker = typeof engineWorker;
