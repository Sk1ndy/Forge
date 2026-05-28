import { useEffect } from 'react';
import { useSimulatorStore } from '@/store/useSimulatorStore';
import { useUIStore } from '@/store/useUIStore';
import { runSimulationViaWorker } from '@/lib/engineWorkerClient';
import { saveCurrentWorkPlan } from '@/lib/supabase';

export function useSimulation() {
  const blueprint = useSimulatorStore(state => state.blueprint);
  const profile = useSimulatorStore(state => state.profile);
  const toggledDays = useSimulatorStore(state => state.toggledDays);
  const exercises = useSimulatorStore(state => state.exercises);
  
  const setWeeklySimulationResult = useSimulatorStore(state => state.setWeeklySimulationResult);
  const setDailySimulationResult = useSimulatorStore(state => state.setDailySimulationResult);
  const setMainSimulationForCompare = useSimulatorStore(state => state.setMainSimulationForCompare);
  const setCompareSimulationResult = useSimulatorStore(state => state.setCompareSimulationResult);
  
  const selectedDay = useUIStore(state => state.selectedDay);
  const isComparing = useUIStore(state => state.isComparing);
  const compareBlueprint = useUIStore(state => state.compareBlueprint);

  // Auto-save session
  useEffect(() => {
    saveCurrentWorkPlan(blueprint, toggledDays);
  }, [blueprint, toggledDays]);

  // Weekly Simulation
  useEffect(() => {
    if (exercises.length === 0) return;
    let active = true;
    runSimulationViaWorker(blueprint, profile, toggledDays, undefined, exercises)
      .then(res => { if (active) setWeeklySimulationResult(res); });
    return () => { active = false; };
  }, [blueprint, profile, toggledDays, exercises, setWeeklySimulationResult]);

  // Daily Simulation
  useEffect(() => {
    if (exercises.length === 0) return;
    let active = true;
    runSimulationViaWorker(blueprint, profile, toggledDays, selectedDay, exercises)
      .then(res => { if (active) setDailySimulationResult(res); });
    return () => { active = false; };
  }, [blueprint, profile, toggledDays, selectedDay, exercises, setDailySimulationResult]);

  // Comparison A/B Simulations
  const fullyActiveDays = {
    Lundi: true, Mardi: true, Mercredi: true, Jeudi: true, Vendredi: true, Samedi: true, Dimanche: true
  };

  useEffect(() => {
    if (!compareBlueprint || exercises.length === 0) {
      setCompareSimulationResult(null);
      return;
    }
    let active = true;
    runSimulationViaWorker(compareBlueprint, profile, fullyActiveDays, undefined, exercises)
      .then(res => { if (active) setCompareSimulationResult(res); });
    return () => { active = false; };
  }, [compareBlueprint, profile, exercises, setCompareSimulationResult]);

  useEffect(() => {
    if (!isComparing || exercises.length === 0) return;
    let active = true;
    runSimulationViaWorker(blueprint, profile, fullyActiveDays, undefined, exercises)
      .then(res => { if (active) setMainSimulationForCompare(res); });
    return () => { active = false; };
  }, [isComparing, blueprint, profile, exercises, setMainSimulationForCompare]);
}
