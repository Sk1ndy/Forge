import { createClient } from './supabase/client';
import { UserProfile, WeeklyBlueprint, Exercise, DEFAULT_EXERCISE_LIBRARY } from '@forge/shared';
import { SupabaseClient } from '@supabase/supabase-js';

// Initialisation sûre du client Supabase
let supabaseClient: SupabaseClient | null = null;
try {
  supabaseClient = createClient();
} catch (e) {
  console.warn("Supabase client could not be initialized. Using LocalStorage fallback.", e);
}

const STORAGE_KEYS = {
  PROFILE: 'forge_user_profile',
  BLUEPRINTS: 'forge_saved_blueprints',
  CURRENT_BLUEPRINT: 'forge_current_blueprint',
  TOGGLED_DAYS: 'forge_toggled_days'
};

// Valeurs par défaut du profil utilisateur
const DEFAULT_PROFILE: UserProfile = {
  pdc: 75,
  prs: {
    squat: 100,
    bench: 80,
    deadlift: 120,
    ohp: 50
  },
  maxSnc: 15.0,
  age: 28,
  sleepHours: 8,
  caloricStatus: 'maintenance',
  stressLevel: 'moderate'
};

// Blueprint initial vide
const DEFAULT_BLUEPRINT: WeeklyBlueprint = {
  Lundi: [],
  Mardi: [],
  Mercredi: [],
  Jeudi: [],
  Vendredi: [],
  Samedi: [],
  Dimanche: []
};

const DEFAULT_TOGGLED_DAYS = {
  Lundi: true,
  Mardi: true,
  Mercredi: true,
  Jeudi: true,
  Vendredi: true,
  Samedi: true,
  Dimanche: true
};

/**
 * Charge le profil de l'utilisateur
 */
export async function loadUserProfile(): Promise<UserProfile> {
  if (supabaseClient) {
    try {
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (user) {
        const { data, error } = await supabaseClient
          .from('users')
          .select('pdc, pr_squat, pr_bench, pr_deadlift, pr_ohp, max_snc, age, sleep_hours, caloric_status, stress_level')
          .eq('id', user.id)
          .single();

        if (!error && data) {
          return {
            pdc: data.pdc || 75,
            prs: {
              squat: data.pr_squat || 100,
              bench: data.pr_bench || 80,
              deadlift: data.pr_deadlift || 120,
              ohp: data.pr_ohp || 50
            },
            maxSnc: data.max_snc || 15.0,
            age: data.age !== null && data.age !== undefined ? data.age : 28,
            sleepHours: data.sleep_hours !== null && data.sleep_hours !== undefined ? Number(data.sleep_hours) : 8,
            caloricStatus: data.caloric_status || 'maintenance',
            stressLevel: data.stress_level || 'moderate'
          };
        }
      }
    } catch (e) {
      console.warn("Supabase loadUserProfile error. Falling back to local storage.", e);
    }
  }

  // Fallback Local Storage
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (local) {
      try {
        return JSON.parse(local);
      } catch {
        return DEFAULT_PROFILE;
      }
    }
  }
  return DEFAULT_PROFILE;
}

/**
 * Sauvegarde le profil utilisateur
 */
export async function saveUserProfile(profile: UserProfile): Promise<boolean> {
  // Toujours persister localement d'abord
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  }

  if (supabaseClient) {
    try {
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (user) {
        const { error } = await supabaseClient
          .from('users')
          .upsert({
            id: user.id,
            pdc: profile.pdc,
            pr_squat: profile.prs.squat,
            pr_bench: profile.prs.bench,
            pr_deadlift: profile.prs.deadlift,
            pr_ohp: profile.prs.ohp,
            max_snc: profile.maxSnc,
            age: profile.age,
            sleep_hours: profile.sleepHours,
            caloric_status: profile.caloricStatus,
            stress_level: profile.stressLevel,
            updated_at: new Date().toISOString()
          });

        if (!error) return true;
        console.warn("Supabase saveUserProfile DB error:", error);
      }
    } catch (e) {
      console.warn("Supabase saveUserProfile network error:", e);
    }
  }
  return true; // Retourne true car sauvegardé en local
}

/**
 * Charge tous les Blueprints sauvegardés de l'utilisateur
 */
export async function loadSavedBlueprints(): Promise<{ id: string; name: string; blueprint: WeeklyBlueprint }[]> {
  if (supabaseClient) {
    try {
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (user) {
        const { data, error } = await supabaseClient
          .from('blueprints')
          .select('id, nom, state')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false });

        if (!error && data) {
          return data.map((d: { id: string; nom: string; state: unknown }) => ({
            id: d.id,
            name: d.nom,
            blueprint: d.state as WeeklyBlueprint
          }));
        }
      }
    } catch (e) {
      console.warn("Supabase loadSavedBlueprints error. Falling back to local storage.", e);
    }
  }

  // Fallback Local Storage
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem(STORAGE_KEYS.BLUEPRINTS);
    if (local) {
      try {
        return JSON.parse(local);
      } catch {
        return [];
      }
    }
  }
  return [];
}

/**
 * Sauvegarde un nouveau Blueprint ou met à jour un existant
 */
export async function saveBlueprint(name: string, blueprint: WeeklyBlueprint, id?: string): Promise<string> {
  const newId = id || Math.random().toString(36).substring(2, 9);
  
  // 1. Sauvegarde locale
  if (typeof window !== 'undefined') {
    const saved = await loadSavedBlueprints();
    const existingIndex = saved.findIndex(s => s.id === newId);
    
    if (existingIndex > -1) {
      saved[existingIndex] = { id: newId, name, blueprint };
    } else {
      saved.unshift({ id: newId, name, blueprint });
    }
    
    localStorage.setItem(STORAGE_KEYS.BLUEPRINTS, JSON.stringify(saved));
  }

  // 2. Sauvegarde Supabase
  if (supabaseClient) {
    try {
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (user) {
        const { error } = await supabaseClient
          .from('blueprints')
          .upsert({
            id: id || undefined, // laissez Postgres générer si nouveau, ou spécifiez si update
            user_id: user.id,
            nom: name,
            state: blueprint,
            updated_at: new Date().toISOString()
          });

        if (error) {
          console.warn("Supabase saveBlueprint error:", error);
        }
      }
    } catch (e) {
      console.warn("Supabase saveBlueprint network error:", e);
    }
  }

  return newId;
}

/**
 * Supprime un blueprint
 */
export async function deleteBlueprint(id: string): Promise<boolean> {
  // 1. Suppression locale
  if (typeof window !== 'undefined') {
    const saved = await loadSavedBlueprints();
    const filtered = saved.filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.BLUEPRINTS, JSON.stringify(filtered));
  }

  // 2. Suppression Supabase
  if (supabaseClient) {
    try {
      const { error } = await supabaseClient
        .from('blueprints')
        .delete()
        .eq('id', id);

      if (error) {
        console.warn("Supabase deleteBlueprint error:", error);
      }
    } catch (e) {
      console.warn("Supabase deleteBlueprint network/auth error:", e);
    }
  }

  return true;
}

/**
 * Charge le plan de travail actuel (session en cours)
 */
export function loadCurrentWorkPlan(): { blueprint: WeeklyBlueprint; toggledDays: { [day: string]: boolean } } {
  if (typeof window !== 'undefined') {
    const blueprintLocal = localStorage.getItem(STORAGE_KEYS.CURRENT_BLUEPRINT);
    const toggledLocal = localStorage.getItem(STORAGE_KEYS.TOGGLED_DAYS);
    
    try {
      return {
        blueprint: blueprintLocal ? JSON.parse(blueprintLocal) : DEFAULT_BLUEPRINT,
        toggledDays: toggledLocal ? JSON.parse(toggledLocal) : DEFAULT_TOGGLED_DAYS
      };
    } catch {
      return { blueprint: DEFAULT_BLUEPRINT, toggledDays: DEFAULT_TOGGLED_DAYS };
    }
  }
  return { blueprint: DEFAULT_BLUEPRINT, toggledDays: DEFAULT_TOGGLED_DAYS };
}

/**
 * Sauvegarde le plan de travail actuel
 */
export function saveCurrentWorkPlan(blueprint: WeeklyBlueprint, toggledDays: { [day: string]: boolean }) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.CURRENT_BLUEPRINT, JSON.stringify(blueprint));
    localStorage.setItem(STORAGE_KEYS.TOGGLED_DAYS, JSON.stringify(toggledDays));
  }
}

/**
 * Charge la bibliothèque d'exercices dynamique
 */
export async function loadExercises(): Promise<Exercise[]> {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('exercises')
        .select('*');

      if (!error && data && data.length > 0) {
        return data.map(dbEx => {
          const defaultEx = DEFAULT_EXERCISE_LIBRARY.find(e => e.id === dbEx.id);
          return {
            ...defaultEx,
            ...dbEx,
            ppl_category: dbEx.ppl_category || defaultEx?.ppl_category || 'none'
          } as Exercise;
        });
      }
    } catch (e) {
      console.warn("Supabase loadExercises error. Falling back to default library.", e);
    }
  }
  return DEFAULT_EXERCISE_LIBRARY;
}

// ─── WORK MODE (SESSION & LOGS) ───

import { ExerciseLog } from '@forge/shared';

export async function createWorkoutSession(blueprintId?: string): Promise<string | null> {
  if (!supabaseClient) return null;
  try {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabaseClient
      .from('workout_sessions')
      .insert([{ user_id: user.id, blueprint_id: blueprintId }])
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  } catch (e) {
    console.error("Error creating workout session", e);
    return null;
  }
}

export async function saveExerciseLog(log: Omit<ExerciseLog, 'id' | 'created_at'>): Promise<boolean> {
  if (!supabaseClient) return false;
  try {
    const { error } = await supabaseClient
      .from('exercise_logs')
      .insert([log]);

    if (error) throw error;
    return true;
  } catch (e) {
    console.error("Error saving exercise log", e);
    return false;
  }
}

export async function getLatestExerciseLog(exerciseId: string): Promise<ExerciseLog | null> {
  if (!supabaseClient) return null;
  try {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabaseClient
      .from('exercise_logs')
      .select('*, workout_sessions!inner(user_id)')
      .eq('exercise_id', exerciseId)
      .eq('workout_sessions.user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows found
      throw error;
    }
    return data as ExerciseLog;
  } catch (e) {
    console.error("Error getting latest exercise log", e);
    return null;
  }
}
