import * as SQLite from 'expo-sqlite';
import { useSyncStore } from '../store/syncStore';
import { supabase } from './supabase'; // we'll need to create this later

export class SyncEngine {
  private db: SQLite.SQLiteDatabase;

  constructor(db: SQLite.SQLiteDatabase) {
    this.db = db;
  }

  /**
   * Pulls the active blueprints from Supabase and caches them locally
   */
  async pullBlueprints(userId: string) {
    const store = useSyncStore.getState();
    if (!store.isOnline) return;

    try {
      const { data, error } = await supabase
        .from('blueprints')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null);

      if (error) throw error;

      if (data && data.length > 0) {
        // Cache locally
        await this.db.withTransactionAsync(async () => {
          for (const bp of data) {
            await this.db.runAsync(
              'INSERT OR REPLACE INTO blueprints_cache (id, data, updated_at) VALUES (?, ?, ?)',
              [bp.id, JSON.stringify(bp), bp.updated_at || new Date().toISOString()]
            );
          }
        });
      }
    } catch (e) {
      console.error('SyncEngine: Failed to pull blueprints', e);
    }
  }

  /**
   * Pushes pending offline logs to Supabase
   */
  async pushPendingLogs() {
    const store = useSyncStore.getState();
    if (!store.isOnline || store.isSyncing) return;

    store.setSyncing(true);
    store.recordSyncAttempt();

    try {
      const pending = await this.db.getAllAsync<{ id: string, action_type: string, payload: string }>(
        "SELECT * FROM pending_logs WHERE status = 'pending'"
      );

      if (pending.length === 0) {
        store.setPendingCount(0);
        store.setSyncing(false);
        return;
      }

      for (const log of pending) {
        if (log.action_type === 'INSERT_LOG') {
          const payloadData = JSON.parse(log.payload);
          const { error } = await supabase
            .from('exercise_logs')
            .insert([payloadData]);

          if (!error) {
            // Mark as synced
            await this.db.runAsync(
              "UPDATE pending_logs SET status = 'synced' WHERE id = ?",
              [log.id]
            );
          } else {
            console.error('Failed to sync log', log.id, error);
          }
        }
      }
      
      // Update pending count
      const remaining = await this.db.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM pending_logs WHERE status = 'pending'"
      );
      store.setPendingCount(remaining?.count ?? 0);

    } catch (e) {
      console.error('SyncEngine: Failed to push pending logs', e);
    } finally {
      store.setSyncing(false);
    }
  }
}
