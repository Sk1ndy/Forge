import { create } from 'zustand';
import { UserProfile, WeeklyBlueprint, Exercise, SimulationResult, emptySimulationResult } from '@forge/shared';

interface SimulatorState {
  // Data State
  profile: UserProfile;
  blueprint: WeeklyBlueprint;
  toggledDays: { [day: string]: boolean };
  exercises: Exercise[];
  savedBlueprints: { id: string; name: string; blueprint: WeeklyBlueprint }[];
  
  // Computed Simulation Results
  weeklySimulationResult: SimulationResult;
  dailySimulationResult: SimulationResult;
  mainSimulationForCompare: SimulationResult;
  compareSimulationResult: SimulationResult | null;
  
  // Actions - Setters
  setProfile: (profile: UserProfile) => void;
  setBlueprint: (blueprint: WeeklyBlueprint | ((prev: WeeklyBlueprint) => WeeklyBlueprint)) => void;
  setToggledDays: (days: { [day: string]: boolean }) => void;
  setExercises: (exercises: Exercise[]) => void;
  setSavedBlueprints: (blueprints: { id: string; name: string; blueprint: WeeklyBlueprint }[]) => void;
  
  setWeeklySimulationResult: (res: SimulationResult) => void;
  setDailySimulationResult: (res: SimulationResult) => void;
  setMainSimulationForCompare: (res: SimulationResult) => void;
  setCompareSimulationResult: (res: SimulationResult | null) => void;
}

const defaultProfile: UserProfile = {
  pdc: 75,
  prs: { squat: 100, bench: 80, deadlift: 120, ohp: 50 },
  maxSnc: 15.0,
  age: 28,
  sleepHours: 8,
  caloricStatus: 'maintenance',
  stressLevel: 'moderate'
};

const defaultBlueprint: WeeklyBlueprint = {
  Lundi: [], Mardi: [], Mercredi: [], Jeudi: [], Vendredi: [], Samedi: [], Dimanche: []
};

const defaultToggledDays = {
  Lundi: true, Mardi: true, Mercredi: true, Jeudi: true, Vendredi: true, Samedi: true, Dimanche: true
};

export const useSimulatorStore = create<SimulatorState>((set) => ({
  // Initial State
  profile: defaultProfile,
  blueprint: defaultBlueprint,
  toggledDays: defaultToggledDays,
  exercises: [],
  savedBlueprints: [],
  
  weeklySimulationResult: emptySimulationResult,
  dailySimulationResult: emptySimulationResult,
  mainSimulationForCompare: emptySimulationResult,
  compareSimulationResult: null,

  // Setters
  setProfile: (profile) => set({ profile }),
  setBlueprint: (blueprint) => set((state) => ({ 
    blueprint: typeof blueprint === 'function' ? blueprint(state.blueprint) : blueprint 
  })),
  setToggledDays: (toggledDays) => set({ toggledDays }),
  setExercises: (exercises) => set({ exercises }),
  setSavedBlueprints: (savedBlueprints) => set({ savedBlueprints }),
  
  setWeeklySimulationResult: (res) => set({ weeklySimulationResult: res }),
  setDailySimulationResult: (res) => set({ dailySimulationResult: res }),
  setMainSimulationForCompare: (res) => set({ mainSimulationForCompare: res }),
  setCompareSimulationResult: (res) => set({ compareSimulationResult: res }),
}));
