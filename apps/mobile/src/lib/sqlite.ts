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

// Call initDB on startup
initDB();
