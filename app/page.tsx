'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  UserProfile,
  WeeklyBlueprint,
  runWeeklySimulation,
  PlannedExercise,
  Exercise
} from '@/lib/calculations';
import {
  loadUserProfile,
  saveUserProfile,
  loadSavedBlueprints,
  saveBlueprint,
  deleteBlueprint,
  loadCurrentWorkPlan,
  saveCurrentWorkPlan,
  loadExercises
} from '@/lib/supabase';
import HumanAvatar from '@/components/simulator/HumanAvatar';
import Sequencer from '@/components/simulator/Sequencer';
import LibraryDrawer from '@/components/simulator/LibraryDrawer';
import CalibrageModal from '@/components/simulator/CalibrageModal';
import BlueprintsModal from '@/components/simulator/BlueprintsModal';

export default function Home() {
  const [profile, setProfile] = useState<UserProfile>({
    pdc: 75,
    prs: { squat: 100, bench: 80, deadlift: 120, ohp: 50 },
    maxSnc: 15.0,
    age: 28,
    sleepHours: 8,
    caloricStatus: 'maintenance',
    stressLevel: 'moderate'
  });

  const [blueprint, setBlueprint] = useState<WeeklyBlueprint>({
    Lundi: [],
    Mardi: [],
    Mercredi: [],
    Jeudi: [],
    Vendredi: [],
    Samedi: [],
    Dimanche: []
  });

  const [toggledDays, setToggledDays] = useState<{ [day: string]: boolean }>({
    Lundi: true,
    Mardi: true,
    Mercredi: true,
    Jeudi: true,
    Vendredi: true,
    Samedi: true,
    Dimanche: true
  });

  const [savedBlueprints, setSavedBlueprints] = useState<{ id: string; name: string; blueprint: WeeklyBlueprint }[]>([]);
  const [isCalibrageOpen, setIsCalibrageOpen] = useState(false);
  const [isBlueprintsModalOpen, setIsBlueprintsModalOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(true);
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [supabaseUser, setSupabaseUser] = useState<unknown>(null);
  const [activeBlueprintId, setActiveBlueprintId] = useState<string | null>(null);
  const [currentBlueprintName, setCurrentBlueprintName] = useState<string>('Blueprint de travail');
  const [selectedDay, setSelectedDay] = useState<string>('Dimanche');
  const [selectedMuscle, setSelectedMuscle] = useState<string>('all');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [hoveredExercise, setHoveredExercise] = useState<Exercise | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  const highlightedMuscles = useMemo(() => {
    const activeEx = hoveredExercise || selectedExercise;
    if (!activeEx) return [];
    return [activeEx.muscle_primaire, ...activeEx.muscles_secondaires];
  }, [hoveredExercise, selectedExercise]);

  const supabase = createClient();

  // 1. Initialisation : Chargement des données locales/Supabase
  useEffect(() => {
    async function initData() {
      // Vérifier si l'utilisateur est connecté
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setSupabaseUser(user);
      } catch (err) {
        console.warn("Supabase auth check failed, operating in local mode.", err);
      }

      // Charger le profil
      const userProfile = await loadUserProfile();
      setProfile(userProfile);

      // Charger le plan de travail actuel
      const savedPlan = loadCurrentWorkPlan();
      setBlueprint(savedPlan.blueprint);
      setToggledDays(savedPlan.toggledDays);

      // Charger l'historique des blueprints
      const history = await loadSavedBlueprints();
      setSavedBlueprints(history);

      // Charger les exercices dynamiques
      const loadedExercises = await loadExercises();
      setExercises(loadedExercises);
    }
    initData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Sauvegarde automatique de la session de travail actuelle
  useEffect(() => {
    saveCurrentWorkPlan(blueprint, toggledDays);
  }, [blueprint, toggledDays]);

  // 3. Calculs des simulations mémoïsées (Bascule instantanée Jour vs Semaine Cumulée)
  const weeklySimulationResult = useMemo(() => {
    return runWeeklySimulation(blueprint, profile, toggledDays, undefined, exercises);
  }, [blueprint, profile, toggledDays, exercises]);

  const dailySimulationResult = useMemo(() => {
    return runWeeklySimulation(blueprint, profile, toggledDays, selectedDay, exercises);
  }, [blueprint, profile, toggledDays, selectedDay, exercises]);

  const simulationResult = viewMode === 'week' ? weeklySimulationResult : dailySimulationResult;

  // 4. Ajouter un exercice au séquenceur
  const handleAddExercise = useCallback((exerciseId: string, day: string) => {
    const exercise = exercises.find(e => e.id === exerciseId);
    if (!exercise) return;

    // Blocage de sécurité si le muscle cible a dépassé son Volume Récupérable Maximal (MRV / Rouge)
    const muscleStatus = simulationResult.muscles[exercise.muscle_primaire];
    if (muscleStatus?.color === 'red') {
      alert(`⚠️ Ajout Bloqué ! Le muscle cible (${muscleStatus.name || exercise.muscle_primaire}) a dépassé son Volume Récupérable Maximal (MRV).`);
      return;
    }

    // Définir des valeurs de départ rationnelles selon l'équipement
    let startWeight = 60;
    if (exercise.equipment === 'pdc') {
      startWeight = 0; // poids de corps
    } else if (exercise.id === 'deadlift' || exercise.id === 'squat') {
      startWeight = 80;
    } else if (exercise.id === 'ohp' || exercise.id === 'biceps_curl') {
      startWeight = 30;
    }

    const newPlannedEx: PlannedExercise = {
      id: Math.random().toString(36).substring(2, 9),
      exerciseId: exercise.id,
      sets: [
        {
          series: 3,
          reps: 8,
          poids: startWeight,
          rpe: 8,
          active: true
        }
      ],
      active: true
    };

    setBlueprint(prev => ({
      ...prev,
      [day]: [...(prev[day] || []), newPlannedEx]
    }));
  }, [exercises, simulationResult]);

  // Mises à jour d'état robustes (évite les stale closures de blueprint)
  const handleUpdateExercise = useCallback((day: string, index: number, updatedEx: PlannedExercise) => {
    setBlueprint(prev => {
      const updatedDayExercises = [...(prev[day] || [])];
      updatedDayExercises[index] = updatedEx;
      return {
        ...prev,
        [day]: updatedDayExercises
      };
    });
  }, []);

  const handleReorderExercises = useCallback((day: string, startIndex: number, endIndex: number) => {
    setBlueprint(prev => {
      const updatedDayExercises = [...(prev[day] || [])];
      const [moved] = updatedDayExercises.splice(startIndex, 1);
      updatedDayExercises.splice(endIndex, 0, moved);
      return {
        ...prev,
        [day]: updatedDayExercises
      };
    });
  }, []);

  const handleDeleteExercise = useCallback((day: string, index: number) => {
    setBlueprint(prev => {
      const updatedDayExercises = (prev[day] || []).filter((_, i) => i !== index);
      return {
        ...prev,
        [day]: updatedDayExercises
      };
    });
  }, []);

  const handleClearDay = useCallback((day: string) => {
    setBlueprint(prev => ({
      ...prev,
      [day]: []
    }));
  }, []);

  const handleLoadTemplate = useCallback((template: WeeklyBlueprint) => {
    setBlueprint(template);
  }, []);

  // 5. Sauvegarder le profil
  const handleSaveProfile = async (newProfile: UserProfile) => {
    setProfile(newProfile);
    await saveUserProfile(newProfile);
  };

  // 6. Sauvegarder le Blueprint dans la liste
  const handleSaveBlueprint = async () => {
    const name = prompt("Entrez un nom pour votre Blueprint hebdomadaire :", activeBlueprintId ? currentBlueprintName : "Mon Programme Force");
    if (!name) return;

    const id = await saveBlueprint(name, blueprint, activeBlueprintId || undefined);
    setCurrentBlueprintName(name);
    setActiveBlueprintId(id);

    // Recharger l'historique
    const history = await loadSavedBlueprints();
    setSavedBlueprints(history);
  };


  // 7. Charger un Blueprint existant
  const handleLoadBlueprint = (id: string) => {
    const item = savedBlueprints.find(s => s.id === id);
    if (item) {
      setBlueprint(item.blueprint);
      setActiveBlueprintId(item.id);
      setCurrentBlueprintName(item.name);
    }
  };

  // 8. Créer un nouveau Blueprint vierge
  const handleNewBlueprint = () => {
    if (confirm("Voulez-vous réinitialiser le séquenceur actuel pour créer un nouveau programme ?")) {
      const blankBlueprint: WeeklyBlueprint = {
        Lundi: [],
        Mardi: [],
        Mercredi: [],
        Jeudi: [],
        Vendredi: [],
        Samedi: [],
        Dimanche: []
      };
      setBlueprint(blankBlueprint);
      setActiveBlueprintId(null);
      setCurrentBlueprintName('Nouveau Blueprint');
    }
  };


  const handleRenameBlueprintById = async (id: string, oldName: string) => {
    const name = prompt("Entrez un nouveau nom pour ce Blueprint :", oldName);
    if (!name || name === oldName) return;

    const bp = savedBlueprints.find(s => s.id === id);
    if (!bp) return;

    await saveBlueprint(name, bp.blueprint, id);
    if (activeBlueprintId === id) {
      setCurrentBlueprintName(name);
    }

    // Recharger l'historique
    const history = await loadSavedBlueprints();
    setSavedBlueprints(history);
  };

  const handleDeleteBlueprintById = async (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce Blueprint ?")) {
      await deleteBlueprint(id);
      if (activeBlueprintId === id) {
        setActiveBlueprintId(null);
        setCurrentBlueprintName('Mon Programme Force');
      }
      const history = await loadSavedBlueprints();
      setSavedBlueprints(history);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  // CNS stress gauge color calculations
  const getSncColorClass = (percentage: number) => {
    if (percentage > 100) return 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)] animate-pulse';
    if (percentage > 80) return 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]';
    return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]';
  };

  return (
    <main className="h-screen bg-zinc-950 text-zinc-100 flex flex-col md:flex-row overflow-hidden font-sans">
      
      {/* 1. LEFT PANEL (25% Width) - Biometrics, SNC, Saved Blueprints */}
      <section className="w-full md:w-[320px] h-full bg-zinc-950 border-r border-zinc-900 flex flex-col justify-between shrink-0 p-4 md:p-6 overflow-y-auto">
        <div className="space-y-6">
          {/* Brand Logo & Cloud Status */}
          <div className="flex items-center justify-between pb-4 border-b border-zinc-900">
            <div>
              <h1 className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500 flex items-center gap-1.5">
                FORGE
              </h1>
              <p className="text-[10px] text-zinc-500 tracking-wider uppercase font-semibold">Sports CAD Simulator</p>
            </div>
            
            {supabaseUser ? (
              <div className="flex items-center gap-2">
                <span className="text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-900 font-bold px-2 py-0.5 rounded-full" title="Connecté au Cloud (Supabase)">
                  CLOUD
                </span>
                <button
                  onClick={handleLogout}
                  className="text-zinc-500 hover:text-zinc-300 text-[10px] underline cursor-pointer"
                >
                  Déconnexion
                </button>
              </div>
            ) : (
              <a
                href="/login"
                className="text-[9px] bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold px-2.5 py-1 rounded border border-zinc-800 transition-colors"
              >
                MODE LOCAL (HORS LIGNE)
              </a>
            )}
          </div>

          {/* Profil & Calibrage */}
          <div className="space-y-3 p-3.5 border border-zinc-900 bg-zinc-950/60 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Mon Gabarit</span>
              <button
                onClick={() => setIsCalibrageOpen(true)}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-bold border-b border-dashed border-emerald-400/50 hover:border-emerald-300 transition-colors cursor-pointer"
              >
                Modifier
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-zinc-900/50 rounded-lg p-2 flex flex-col">
                <span className="text-[10px] text-zinc-500 font-medium">Poids de Corps</span>
                <span className="font-bold text-zinc-200 mt-0.5">{profile.pdc} kg</span>
              </div>
              <div className="bg-zinc-900/50 rounded-lg p-2 flex flex-col">
                <span className="text-[10px] text-zinc-500 font-medium">Capacité SNC</span>
                <span className="font-bold text-zinc-200 mt-0.5">{profile.maxSnc} pts</span>
              </div>
            </div>
            {/* PR list snippet */}
            <div className="pt-2 border-t border-zinc-900/50 flex flex-wrap gap-1 text-[10px] text-zinc-400 justify-between">
              <div>SQ: <span className="font-bold text-zinc-200">{profile.prs.squat}k</span></div>
              <div>BP: <span className="font-bold text-zinc-200">{profile.prs.bench}k</span></div>
              <div>DL: <span className="font-bold text-zinc-200">{profile.prs.deadlift}k</span></div>
              <div>OP: <span className="font-bold text-zinc-200">{profile.prs.ohp}k</span></div>
            </div>
          </div>

          {/* Jauge SNC (Central Nervous System) */}
          <div className="space-y-3 p-3.5 border border-zinc-900 bg-zinc-950/60 rounded-xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Stress Global (SNC)
              </span>
              <span className={`text-xs font-black ${simulationResult.cnsFailure ? 'text-red-400' : 'text-emerald-400'}`}>
                {simulationResult.sncScore} / {profile.maxSnc}
              </span>
            </div>
            
            {/* Progress Bar Container */}
            <div className="w-full h-3 rounded-full bg-zinc-900 overflow-hidden border border-zinc-850 p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getSncColorClass(simulationResult.sncPercentage)}`}
                style={{ width: `${simulationResult.sncPercentage}%` }}
              />
            </div>

            <div className="flex justify-between items-center text-[10px] text-zinc-500 mt-1">
              <span>Niveau de stress : <span className="text-zinc-300 font-bold">{simulationResult.sncPercentage}%</span></span>
              {simulationResult.cnsFailure && (
                <span className="text-red-400 font-extrabold tracking-widest animate-pulse">SATURE</span>
              )}
            </div>
          </div>

          {/* 1. Planning Hebdomadaire (Day Selector moved from middle rail) */}
          <div className="space-y-3 p-3.5 border border-zinc-900 bg-zinc-950/60 rounded-xl">
            <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
              Planning Hebdomadaire
            </span>
            <div className="space-y-1.5 pr-1">
              {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].map((day) => {
                const dayExercises = blueprint[day] || [];
                const isDayActive = toggledDays[day] !== false;
                const isSelected = selectedDay === day;
                
                // Day summary logic
                let summaryText = 'Repos ⚡';
                let isRest = true;
                if (!isDayActive) {
                  summaryText = 'Désactivé';
                } else if (dayExercises.length > 0) {
                  const activeExs = dayExercises.filter(e => e.active);
                  if (activeExs.length > 0) {
                    const totalSets = activeExs.reduce(
                      (sum, ex) => sum + ex.sets.reduce((sSum, s) => sSum + (s.active ? s.series : 0), 0),
                      0
                    );
                    summaryText = `${activeExs.length} exo${activeExs.length > 1 ? 's' : ''} · ${totalSets} sér.`;
                    isRest = false;
                  }
                }

                return (
                  <div
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`group flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-950/15 ring-1 ring-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.08)] text-white font-bold'
                        : isDayActive
                        ? 'border-zinc-900 bg-zinc-900/10 text-zinc-400 hover:bg-zinc-900/40 hover:text-white'
                        : 'border-zinc-950 bg-zinc-950/10 opacity-40 hover:opacity-60 text-zinc-500'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <input
                        type="checkbox"
                        checked={isDayActive}
                        onChange={(e) => {
                          e.stopPropagation();
                          setToggledDays(prev => ({
                            ...prev,
                            [day]: !prev[day]
                          }));
                        }}
                        className="rounded border-zinc-800 bg-zinc-950 text-emerald-500 focus:ring-emerald-500 h-3.5 w-3.5 cursor-pointer shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-[11px] truncate">{day}</span>
                        <span className={`text-[9px] font-semibold mt-0.5 leading-none ${isRest ? 'text-zinc-600' : 'text-emerald-500'}`}>
                          {summaryText}
                        </span>
                      </div>
                    </div>
                    {dayExercises.length > 0 && isDayActive && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Voulez-vous vider la séance de ${day} ?`)) {
                            handleClearDay(day);
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 text-[9px] text-zinc-550 hover:text-red-400 font-bold px-1.5 py-0.5 rounded hover:bg-zinc-900 transition-all cursor-pointer shrink-0"
                      >
                        Vider
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Blueprints Section (Compact: 2 last used, plus Gérer button) */}
          <div className="space-y-3 p-3.5 border border-zinc-900 bg-zinc-950/60 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Mes Blueprints</span>
              <button
                onClick={() => setIsBlueprintsModalOpen(true)}
                className="text-[9px] text-emerald-400 hover:text-emerald-300 font-bold border border-emerald-950 bg-emerald-950/30 px-2 py-0.5 rounded hover:bg-emerald-950/50 transition-all cursor-pointer shrink-0"
              >
                Gérer ({savedBlueprints.length})
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-1.5">
              <button
                onClick={handleNewBlueprint}
                className="flex-1 text-[9px] bg-zinc-900 hover:bg-zinc-850 hover:text-white text-zinc-400 font-bold py-1.5 rounded cursor-pointer transition-colors border border-zinc-800"
              >
                Nouveau
              </button>
              <button
                onClick={handleSaveBlueprint}
                className="flex-1 text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 font-bold py-1.5 rounded cursor-pointer transition-all"
              >
                Sauvegarder
              </button>
            </div>

            {/* Render 2 last used blueprints */}
            <div className="space-y-1.5 pt-0.5">
              {savedBlueprints.slice(0, 2).map(sb => {
                const isActive = activeBlueprintId === sb.id;
                return (
                  <div
                    key={sb.id}
                    onClick={() => handleLoadBlueprint(sb.id)}
                    className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                      isActive
                        ? 'border-emerald-500 bg-emerald-950/10 text-white font-bold'
                        : 'border-zinc-900 bg-zinc-900/10 text-zinc-450 hover:bg-zinc-900/40 hover:text-white'
                    }`}
                  >
                    <span className="truncate max-w-[190px]">{sb.name}</span>
                    {isActive && (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                    )}
                  </div>
                );
              })}
              {savedBlueprints.length === 0 && (
                <p className="text-[10px] text-zinc-500 text-center py-4 border border-dashed border-zinc-900 rounded-lg">
                  Aucun blueprint sauvegardé.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* User profile / copyright footer */}
        <div className="pt-4 border-t border-zinc-900 text-[10px] text-zinc-600 flex justify-between">
          <span>{currentBlueprintName}</span>
          <span>© 2026 FORGE</span>
        </div>
      </section>

      {/* 2. CENTRAL WORKSPACE - Heatmap & Sequencer */}
      <section className="flex-1 flex flex-col h-full overflow-hidden p-4 md:p-6 gap-4 relative">
        
        {/* View Mode Toggle Switch */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 shrink-0">
          <div className="flex bg-zinc-900/80 p-1 border border-zinc-850 rounded-xl max-w-max">
            <button
              onClick={() => setViewMode('day')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'day'
                  ? 'bg-emerald-500 text-zinc-950 shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Vue Journée
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'week'
                  ? 'bg-emerald-500 text-zinc-950 shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Vue Semaine Globale
            </button>
          </div>
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-extrabold font-mono">
            {viewMode === 'day' ? `Aperçu quotidien : ${selectedDay}` : 'Bilan cumulé hebdomadaire'}
          </span>
        </div>

        {/* Upper Portion: SVG Anatomical Avatar — fixed height, no scroll */}
        <div className="w-full flex justify-center shrink-0 h-[340px] sm:h-[380px] md:h-[45vh] min-h-[280px]">
          <div className="w-full h-full max-w-5xl bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden flex flex-col">
            <HumanAvatar 
              simulation={simulationResult} 
              selectedDay={selectedDay} 
              selectedMuscle={selectedMuscle}
              onMuscleClick={(muscleId) => {
                setSelectedMuscle(prev => prev === muscleId ? 'all' : muscleId);
                setLibraryOpen(true);
              }}
              highlightedMuscles={highlightedMuscles}
            />
          </div>
        </div>

        {/* Lower Portion: Sequencer — takes remaining space and scrolls internally */}
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex items-center justify-between pb-3 shrink-0">
            <h3 className="text-sm font-bold tracking-wider uppercase text-zinc-400 flex items-center gap-2">
              <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Séquenceur Hebdomadaire
            </h3>
          </div>

          <Sequencer
            blueprint={blueprint}
            toggledDays={toggledDays}
            onUpdateExercise={handleUpdateExercise}
            onDeleteExercise={handleDeleteExercise}
            onReorderExercises={handleReorderExercises}
            onClearDay={handleClearDay}
            onUpdateToggledDays={setToggledDays}
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
            onAddExercise={handleAddExercise}
            simulation={simulationResult}
            exercises={exercises}
            onLoadTemplate={handleLoadTemplate}
            onHoverExerciseChange={setHoveredExercise}
            selectedExercise={selectedExercise}
            onSelectExercise={setSelectedExercise}
            viewMode={viewMode}
          />
        </div>
        {viewMode !== 'week' && (
          <button
            onClick={() => setLibraryOpen(!libraryOpen)}
            className={`absolute top-1/2 -translate-y-1/2 z-40 w-7 h-7 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition-all flex items-center justify-center cursor-pointer shadow-md ${
              libraryOpen ? 'right-0 translate-x-1/2' : 'right-3'
            }`}
            title={libraryOpen ? "Masquer la bibliothèque" : "Afficher la bibliothèque"}
          >
            {libraryOpen ? (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            )}
          </button>
        )}
      </section>

      {/* 3. RIGHT PANEL (Library Drawer) */}
      <section className={`${libraryOpen && viewMode !== 'week' ? 'block' : 'hidden'} border-t md:border-t-0 md:border-l border-zinc-900 shrink-0`}>
        <LibraryDrawer
          onAddExercise={handleAddExercise}
          isOpen={true}
          onClose={() => setLibraryOpen(false)}
          selectedMuscle={selectedMuscle}
          onSelectMuscle={setSelectedMuscle}
          simulation={simulationResult}
          exercises={exercises}
          onHoverExerciseChange={setHoveredExercise}
        />
      </section>

      {/* 4. MODALS */}
      <CalibrageModal
        isOpen={isCalibrageOpen}
        onClose={() => setIsCalibrageOpen(false)}
        profile={profile}
        onSave={handleSaveProfile}
      />

      <BlueprintsModal
        isOpen={isBlueprintsModalOpen}
        onClose={() => setIsBlueprintsModalOpen(false)}
        savedBlueprints={savedBlueprints}
        onLoadBlueprint={handleLoadBlueprint}
        onRenameBlueprint={handleRenameBlueprintById}
        onDeleteBlueprint={handleDeleteBlueprintById}
        activeBlueprintId={activeBlueprintId}
      />
    </main>
  );
}
