import { create } from 'zustand';
import { Exercise, WeeklyBlueprint } from '@forge/shared';

interface UIState {
  // Views
  viewMode: 'day' | 'week';
  selectedDay: string;
  selectedMuscle: string;
  libraryOpen: boolean;
  
  // Interactions
  hoveredExercise: Exercise | null;
  selectedExercise: Exercise | null;
  
  // Modals & Compare
  isCalibrageOpen: boolean;
  isBlueprintsModalOpen: boolean;
  isComparing: boolean;
  isStoryModalOpen: boolean;
  compareBlueprint: WeeklyBlueprint | null;
  compareBlueprintName: string | null;
  activeBlueprintId: string | null;
  currentBlueprintName: string;
  supabaseUser: any | null;
  isLoadingExercises: boolean;
  
  // Setters
  setViewMode: (mode: 'day' | 'week') => void;
  setSelectedDay: (day: string) => void;
  setSelectedMuscle: (muscle: string | ((prev: string) => string)) => void;
  setLibraryOpen: (isOpen: boolean) => void;
  
  setHoveredExercise: (ex: Exercise | null) => void;
  setSelectedExercise: (ex: Exercise | null) => void;
  
  setIsCalibrageOpen: (isOpen: boolean) => void;
  setIsBlueprintsModalOpen: (isOpen: boolean) => void;
  setIsComparing: (isComparing: boolean) => void;
  setIsStoryModalOpen: (isOpen: boolean) => void;
  
  setCompareBlueprint: (bp: WeeklyBlueprint | null) => void;
  setCompareBlueprintName: (name: string | null) => void;
  setActiveBlueprintId: (id: string | null) => void;
  setCurrentBlueprintName: (name: string) => void;
  setSupabaseUser: (user: any | null) => void;
  setIsLoadingExercises: (isLoading: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  viewMode: 'day',
  selectedDay: 'Dimanche',
  selectedMuscle: 'all',
  libraryOpen: true,
  
  hoveredExercise: null,
  selectedExercise: null,
  
  isCalibrageOpen: false,
  isBlueprintsModalOpen: false,
  isComparing: false,
  isStoryModalOpen: false,
  compareBlueprint: null,
  compareBlueprintName: null,
  activeBlueprintId: null,
  currentBlueprintName: 'Blueprint de travail',
  supabaseUser: null,
  isLoadingExercises: true,
  
  setViewMode: (mode) => set({ viewMode: mode }),
  setSelectedDay: (day) => set({ selectedDay: day }),
  setSelectedMuscle: (muscle) => set((state) => ({ 
    selectedMuscle: typeof muscle === 'function' ? muscle(state.selectedMuscle) : muscle 
  })),
  setLibraryOpen: (isOpen) => set({ libraryOpen: isOpen }),
  
  setHoveredExercise: (ex) => set({ hoveredExercise: ex }),
  setSelectedExercise: (ex) => set({ selectedExercise: ex }),
  
  setIsCalibrageOpen: (isOpen) => set({ isCalibrageOpen: isOpen }),
  setIsBlueprintsModalOpen: (isOpen) => set({ isBlueprintsModalOpen: isOpen }),
  setIsComparing: (isComparing) => set({ isComparing: isComparing }),
  setIsStoryModalOpen: (isOpen) => set({ isStoryModalOpen: isOpen }),
  
  setCompareBlueprint: (bp) => set({ compareBlueprint: bp }),
  setCompareBlueprintName: (name) => set({ compareBlueprintName: name }),
  setActiveBlueprintId: (id) => set({ activeBlueprintId: id }),
  setCurrentBlueprintName: (name) => set({ currentBlueprintName: name }),
  setSupabaseUser: (user) => set({ supabaseUser: user }),
  setIsLoadingExercises: (loading) => set({ isLoadingExercises: loading }),
}));
