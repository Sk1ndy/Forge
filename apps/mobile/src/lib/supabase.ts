import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { WeeklyBlueprint, ExerciseLog } from '@forge/shared';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://cphqilfezxvtsjfumsfc.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_5ss9lGsOqokU6pIPSnKshg_71LB_zGW';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("⚠️ SUPABASE ENV VARS MISSING! Please restart Metro bundler.");
}

// Custom storage adapter that doesn't crash on SSR
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    if (Platform.OS === 'web' && typeof window === 'undefined') return Promise.resolve(null);
    return AsyncStorage.getItem(key);
  },
  setItem: (key: string, value: string) => {
    if (Platform.OS === 'web' && typeof window === 'undefined') return Promise.resolve();
    return AsyncStorage.setItem(key, value);
  },
  removeItem: (key: string) => {
    if (Platform.OS === 'web' && typeof window === 'undefined') return Promise.resolve();
    return AsyncStorage.removeItem(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function getCachedData<T>(key: string): Promise<{ data: T; isStale: boolean } | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && 'timestamp' in parsed && 'payload' in parsed) {
      return {
        data: parsed.payload as T,
        isStale: Date.now() - parsed.timestamp > CACHE_TTL_MS
      };
    }
    return { data: parsed as T, isStale: true };
  } catch {
    return null;
  }
}

async function setCachedData<T>(key: string, data: T) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify({ timestamp: Date.now(), payload: data }));
  } catch {
    // Ignore storage errors
  }
}

export async function loadLatestBlueprint(): Promise<{ id: string; name: string; blueprint: WeeklyBlueprint } | null> {
  const CACHE_KEY = 'forge_mobile_latest_blueprint';
  const cached = await getCachedData<{ id: string; name: string; blueprint: WeeklyBlueprint }>(CACHE_KEY);
  
  if (cached && !cached.isStale) {
    return cached.data;
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return cached?.data || null;

    const { data, error } = await supabase
      .from('blueprints')
      .select('id, nom, state')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return cached?.data || null;

    const result = {
      id: data.id,
      name: data.nom,
      blueprint: data.state as WeeklyBlueprint
    };
    
    await setCachedData(CACHE_KEY, result);
    return result;
  } catch (e) {
    console.warn("Error loading blueprint:", e);
    return cached?.data || null;
  }
}

export async function createWorkoutSession(blueprintId?: string): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return `guest_sess_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    }

    const { data, error } = await supabase
      .from('workout_sessions')
      .insert([{ user_id: user.id, blueprint_id: blueprintId }])
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  } catch (e) {
    console.warn("Offline/Error creating workout session, generating local ID", e);
    return `local_sess_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }
}

import {
  getUnsyncedLogs,
  markLogAsSynced,
  saveLogLocally,
  saveProfileLocally,
  getLocalProfile,
  getUnsyncedProfiles,
  markProfileAsSynced,
  deleteLocalProfile,
  LocalProfile
} from './sqlite';

export async function saveUserProfile(profile: Omit<LocalProfile, 'is_synced' | 'updated_at'>): Promise<boolean> {
  try {
    // 1. Save Locally (Offline First)
    saveProfileLocally(profile);
    
    // 2. Try to sync immediately (fire and forget)
    syncLocalProfileToSupabase().catch(console.error);

    return true;
  } catch (e) {
    console.error("Error saving user profile locally", e);
    return false;
  }
}

export async function syncLocalProfileToSupabase() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Check if there is a guest profile we need to adopt
    const guestProfile = getLocalProfile('guest');
    if (guestProfile) {
      saveProfileLocally({
        ...guestProfile,
        id: user.id,
        is_synced: 0
      });
      // Delete guest profile so we don't sync it again
      deleteLocalProfile('guest');
    }

    const unsynced = getUnsyncedProfiles();
    for (const profile of unsynced) {
      const { error } = await supabase
        .from('users')
        .upsert({
          id: profile.id,
          pdc: profile.pdc,
          gender: profile.gender,
          age: profile.age,
          is_beginner: profile.experience === 'beginner',
          pr_squat: profile.pr_squat,
          pr_bench: profile.pr_bench,
          pr_deadlift: profile.pr_deadlift,
          pr_ohp: profile.pr_ohp,
          updated_at: new Date().toISOString()
        });

      if (!error) {
        markProfileAsSynced(profile.id);
      }
    }
  } catch (e) {
    console.error("Failed to sync profile to Supabase", e);
  }
}

export async function syncAll() {
  await syncLocalProfileToSupabase();
  await syncLocalLogsToSupabase();
}

export async function saveExerciseLog(log: Omit<ExerciseLog, 'id' | 'created_at'>): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || 'guest';

    // 1. Save Locally (Offline First)
    saveLogLocally({ ...log, user_id: userId } as any);
    
    // 2. Try to sync immediately (fire and forget)
    if (user) {
      syncLocalLogsToSupabase().catch(console.error);
    }

    return true;
  } catch (e) {
    console.error("Error saving exercise log locally", e);
    return false;
  }
}

export async function syncLocalLogsToSupabase() {
  const unsynced = getUnsyncedLogs();
  if (unsynced.length === 0) return;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  for (const log of unsynced) {
    try {
      const payload = JSON.parse(log.payload);
      
      const { error } = await supabase
        .from('exercise_logs')
        .insert([{
          session_id: payload.session_id,
          exercise_id: payload.exercise_id,
          user_id: user.id,
          day: payload.day || 'Lundi',
          set_index: payload.set_index || 0,
          week: payload.week || 1,
          planned_weight: payload.planned_weight,
          planned_reps: payload.planned_reps,
          planned_rpe: payload.planned_rpe,
          actual_weight: payload.actual_weight,
          actual_reps: payload.actual_reps,
          actual_rpe: payload.actual_rpe,
          is_completed: payload.is_completed ?? true,
          skipped_reason: payload.skipped_reason
        }]);

      if (!error) {
        markLogAsSynced(log.id);
      }
    } catch (e) {
      console.error(`Failed to sync log ${log.id}`, e);
    }
  }
}

import { Exercise, DEFAULT_EXERCISE_LIBRARY } from '@forge/shared';

export async function loadExercises(): Promise<Exercise[]> {
  const CACHE_KEY = 'forge_mobile_exercises';
  const cached = await getCachedData<Exercise[]>(CACHE_KEY);
  
  if (cached && !cached.isStale) {
    return cached.data;
  }

  try {
    const { data, error } = await supabase
      .from('exercises')
      .select('*');

    if (!error && data && data.length > 0) {
      const mapped = data.map(dbEx => {
        const defaultEx = DEFAULT_EXERCISE_LIBRARY.find(e => e.id === dbEx.id);
        return {
          ...defaultEx,
          ...dbEx,
          ppl_category: dbEx.ppl_category || defaultEx?.ppl_category || 'none'
        } as Exercise;
      });
      await setCachedData(CACHE_KEY, mapped);
      return mapped;
    }
  } catch (e) {
    console.warn("Supabase loadExercises error. Falling back to default library.", e);
  }
  
  return cached?.data || DEFAULT_EXERCISE_LIBRARY;
}
