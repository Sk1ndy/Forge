import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { WeeklyBlueprint, ExerciseLog } from '@forge/shared';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export async function loadLatestBlueprint(): Promise<{ id: string; name: string; blueprint: WeeklyBlueprint } | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('blueprints')
      .select('id, nom, state')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      name: data.nom,
      blueprint: data.state as WeeklyBlueprint
    };
  } catch (e) {
    console.warn("Error loading blueprint:", e);
    return null;
  }
}

export async function createWorkoutSession(blueprintId?: string): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
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
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('exercise_logs')
      .insert([{ ...log, user_id: user.id }]);

    if (error) throw error;
    return true;
  } catch (e) {
    console.error("Error saving exercise log", e);
    return false;
  }
}
