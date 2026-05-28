import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useSimulatorStore } from '@/store/useSimulatorStore';
import { useUIStore } from '@/store/useUIStore';
import {
  loadUserProfile,
  loadSavedBlueprints,
  loadCurrentWorkPlan,
  loadExercises
} from '@/lib/supabase';

export function useAppInit() {
  const setProfile = useSimulatorStore(state => state.setProfile);
  const setBlueprint = useSimulatorStore(state => state.setBlueprint);
  const setToggledDays = useSimulatorStore(state => state.setToggledDays);
  const setSavedBlueprints = useSimulatorStore(state => state.setSavedBlueprints);
  const setExercises = useSimulatorStore(state => state.setExercises);
  
  const setSupabaseUser = useUIStore(state => state.setSupabaseUser);
  const setIsLoadingExercises = useUIStore(state => state.setIsLoadingExercises);

  useEffect(() => {
    async function initData() {
      const supabase = createClient();
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setSupabaseUser(user);
      } catch (err) {
        console.warn("Supabase auth check failed, operating in local mode.", err);
      }

      // Load Profile
      const userProfile = await loadUserProfile();
      setProfile(userProfile);

      // Load Current Work Plan
      const savedPlan = loadCurrentWorkPlan();
      setBlueprint(savedPlan.blueprint);
      setToggledDays(savedPlan.toggledDays);

      // Load History of Blueprints
      const history = await loadSavedBlueprints();
      setSavedBlueprints(history);

      // Load Exercises
      const loadedExercises = await loadExercises();
      setExercises(loadedExercises);
      setIsLoadingExercises(false);
    }
    initData();
  }, [setProfile, setBlueprint, setToggledDays, setSavedBlueprints, setExercises, setSupabaseUser, setIsLoadingExercises]);
}
