import * as SQLite from 'expo-sqlite';
import { ExerciseLog } from '@forge/shared';

const db = SQLite.openDatabaseSync('forge_mobile.db');

export interface LocalLog {
  id: string;
  session_id: string;
  exercise_id: string;
  payload: string; // JSON stringified ExerciseLog
  is_synced: number; // 0 for false, 1 for true
  created_at: string;
}

export interface LocalProfile {
  id: string; // User ID from auth or 'guest'
  pdc: number;
  gender: string;
  age: number;
  height_cm: number;
  experience: string;
  weekly_frequency: number;
  pr_squat: number;
  pr_bench: number;
  pr_deadlift: number;
  pr_ohp: number;
  is_synced: number; // 0 for false, 1 for true
  updated_at: string;
}

export function initDB() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS local_exercise_logs (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      exercise_id TEXT NOT NULL,
      payload TEXT NOT NULL,
      is_synced INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS local_user_profile (
      id TEXT PRIMARY KEY,
      pdc REAL NOT NULL,
      gender TEXT NOT NULL DEFAULT 'male',
      age INTEGER NOT NULL,
      height_cm REAL NOT NULL,
      experience TEXT NOT NULL DEFAULT 'beginner',
      weekly_frequency INTEGER DEFAULT 3,
      pr_squat REAL DEFAULT 0,
      pr_bench REAL DEFAULT 0,
      pr_deadlift REAL DEFAULT 0,
      pr_ohp REAL DEFAULT 0,
      is_synced INTEGER DEFAULT 0,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS blueprints_cache (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pending_logs (
      id TEXT PRIMARY KEY,
      action_type TEXT NOT NULL,
      payload TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL
    );
  `);
}

export function saveLogLocally(log: Omit<ExerciseLog, 'id' | 'created_at'>): string {
  const localId = `loc_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const now = new Date().toISOString();
  
  const payload = JSON.stringify(log);

  db.runSync(
    'INSERT INTO local_exercise_logs (id, session_id, exercise_id, payload, is_synced, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    localId,
    log.session_id || 'unknown',
    log.exercise_id,
    payload,
    0,
    now
  );

  return localId;
}

export function getUnsyncedLogs(): LocalLog[] {
  return db.getAllSync<LocalLog>('SELECT * FROM local_exercise_logs WHERE is_synced = 0');
}

export function markLogAsSynced(localId: string) {
  db.runSync('UPDATE local_exercise_logs SET is_synced = 1 WHERE id = ?', localId);
}

// User Profile persistence helpers
export function saveProfileLocally(profile: Omit<LocalProfile, 'is_synced' | 'updated_at'> & { is_synced?: number }): void {
  const now = new Date().toISOString();
  db.runSync(`
    INSERT OR REPLACE INTO local_user_profile (
      id, pdc, gender, age, height_cm, experience, weekly_frequency,
      pr_squat, pr_bench, pr_deadlift, pr_ohp, is_synced, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    profile.id,
    profile.pdc,
    profile.gender,
    profile.age,
    profile.height_cm,
    profile.experience || 'beginner',
    profile.weekly_frequency || 3,
    profile.pr_squat || 0,
    profile.pr_bench || 0,
    profile.pr_deadlift || 0,
    profile.pr_ohp || 0,
    profile.is_synced !== undefined ? profile.is_synced : 0,
    now
  ]);
}

export function getLocalProfile(userId: string): LocalProfile | null {
  return db.getFirstSync<LocalProfile>('SELECT * FROM local_user_profile WHERE id = ?', userId);
}

export function getUnsyncedProfiles(): LocalProfile[] {
  return db.getAllSync<LocalProfile>('SELECT * FROM local_user_profile WHERE is_synced = 0 AND id != \'guest\'');
}

export function markProfileAsSynced(userId: string) {
  db.runSync('UPDATE local_user_profile SET is_synced = 1 WHERE id = ?', userId);
}

export function deleteLocalProfile(userId: string) {
  db.runSync('DELETE FROM local_user_profile WHERE id = ?', userId);
}

// Call initDB on startup
initDB();
