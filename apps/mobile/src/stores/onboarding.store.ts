import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AnthropometricData, MuscleMappingData, StrengthProfileData } from '../schemas/onboarding.schema';

interface OnboardingState {
  anthropometry: AnthropometricData | null;
  muscleMapping: MuscleMappingData | null;
  strengthProfile: StrengthProfileData | null;
  currentStep: number;
  completed: boolean;
  
  setAnthropometry: (data: AnthropometricData) => void;
  setMuscleMapping: (data: MuscleMappingData) => void;
  setStrengthProfile: (data: StrengthProfileData) => void;
  setStep: (step: number) => void;
  setCompleted: (completed: boolean) => void;
  reset: () => void;
}

const initialAnthropometry: AnthropometricData = {
  gender: 'male',
  age: 25,
  heightCm: 175,
  weightKg: 75,
  femurRatio: 'average',
  armRatio: 'average',
};

const initialMuscleMapping: MuscleMappingData = {
  weakPoints: [],
  strongPoints: [],
};

const initialStrengthProfile: StrengthProfileData = {
  experience: 'intermediate',
  weeklyFrequency: 4,
  squat1RM: 100,
  bench1RM: 80,
  deadlift1RM: 120,
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      anthropometry: initialAnthropometry,
      muscleMapping: initialMuscleMapping,
      strengthProfile: initialStrengthProfile,
      currentStep: 1,
      completed: false,

      setAnthropometry: (anthropometry) => set({ anthropometry }),
      setMuscleMapping: (muscleMapping) => set({ muscleMapping }),
      setStrengthProfile: (strengthProfile) => set({ strengthProfile }),
      setStep: (currentStep) => set({ currentStep }),
      setCompleted: (completed) => set({ completed }),
      reset: () => set({
        anthropometry: initialAnthropometry,
        muscleMapping: initialMuscleMapping,
        strengthProfile: initialStrengthProfile,
        currentStep: 1,
        completed: false,
      }),
    }),
    {
      name: 'forge-onboarding-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
export default useOnboardingStore;
