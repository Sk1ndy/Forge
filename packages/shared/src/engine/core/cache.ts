import { WeeklyBlueprint, UserProfile, ExerciseLog, SimulationResult, RawWearableData } from '../../types';

export class LRUCache<K, V> {
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
}

export const simulationCache = new LRUCache<string, SimulationResult>(50);

export function generateCacheKey(
  blueprint: WeeklyBlueprint,
  profile: UserProfile,
  toggledDays: { [day: string]: boolean },
  selectedDay: string | undefined,
  totalWeeks: number,
  deloadWeeks: number[],
  sessionLogs: ExerciseLog[] | undefined,
  blueprintId: string | undefined,
  wearableData?: RawWearableData,
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
    JSON.stringify(profile.biometricConstants || {}),
    JSON.stringify(profile.dailyVFC || {}),
    JSON.stringify(wearableData || {}),
  ].join('|');
}
