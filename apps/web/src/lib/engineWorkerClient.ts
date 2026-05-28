import * as Comlink from 'comlink';
import type { EngineWorker } from '../workers/engine.worker';
import { SimulationResult } from '@forge/shared';

let workerApi: Comlink.Remote<EngineWorker> | null = null;

function getWorkerApi() {
  if (typeof window === 'undefined') return null;
  if (!workerApi) {
    const worker = new Worker(new URL('../workers/engine.worker.ts', import.meta.url), { type: 'module' });
    workerApi = Comlink.wrap<EngineWorker>(worker);
  }
  return workerApi;
}

export async function runSimulationViaWorker(
  blueprint: any,
  profile: any,
  toggledDays: any,
  selectedDay: string | undefined,
  exercises: any,
  totalWeeks: number = 4,
  deloadWeeks: number[] = [],
  sessionLogs: any[] = [],
  blueprintId?: string
): Promise<SimulationResult> {
  const api = getWorkerApi();
  
  if (!api) {
    const { runWeeklySimulationAsync } = await import('@forge/shared');
    return runWeeklySimulationAsync(blueprint, profile, toggledDays, selectedDay, exercises, totalWeeks, deloadWeeks, sessionLogs, blueprintId);
  }

  // Promise.race to handle timeout
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("Worker timeout: Simulation took more than 5 seconds.")), 5000);
  });

  return Promise.race([
    api.runSimulation(blueprint, profile, toggledDays, selectedDay, exercises, totalWeeks, deloadWeeks, sessionLogs, blueprintId),
    timeoutPromise
  ]);
}
