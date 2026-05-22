'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  UserProfile,
  WeeklyBlueprint,
  runWeeklySimulation,
  PlannedExercise,
  EXERCISE_LIBRARY
} from '@/lib/calculations';
import {
  loadUserProfile,
  saveUserProfile,
  loadSavedBlueprints,
  saveBlueprint,
  deleteBlueprint,
  loadCurrentWorkPlan,
  saveCurrentWorkPlan
} from '@/lib/supabase';
import HumanAvatar from '@/components/simulator/HumanAvatar';
import Sequencer from '@/components/simulator/Sequencer';
import LibraryDrawer from '@/components/simulator/LibraryDrawer';
import CalibrageModal from '@/components/simulator/CalibrageModal';

export default function Home() {
  const [profile, setProfile] = useState<UserProfile>({
    pdc: 75,
    prs: { squat: 100, bench: 80, deadlift: 120, ohp: 50 },
    maxSnc: 15.0
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
  const [libraryOpen, setLibraryOpen] = useState(true);
  const [supabaseUser, setSupabaseUser] = useState<any>(null);
  const [activeBlueprintId, setActiveBlueprintId] = useState<string | null>(null);
  const [currentBlueprintName, setCurrentBlueprintName] = useState<string>('Blueprint de travail');
  const [selectedDay, setSelectedDay] = useState<string>('Dimanche');

  const supabase = createClient();

  // 1. Initialisation : Chargement des données locales/Supabase
  useEffect(() => {
    async function initData() {
      // Vérifier si l'utilisateur est connecté
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setSupabaseUser(user);
      } catch (e) {
        console.warn("Supabase auth check failed, operating in local mode.");
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
    }
    initData();
  }, []);

  // 2. Sauvegarde automatique de la session de travail actuelle
  useEffect(() => {
    saveCurrentWorkPlan(blueprint, toggledDays);
  }, [blueprint, toggledDays]);

  // 3. Calcul de la simulation en temps réel réactive à chaque modification
  const simulationResult = useMemo(() => {
    return runWeeklySimulation(blueprint, profile, toggledDays, selectedDay);
  }, [blueprint, profile, toggledDays, selectedDay]);

  // 4. Ajouter un exercice au séquenceur
  const handleAddExercise = (exerciseId: string, day: string) => {
    const exercise = EXERCISE_LIBRARY.find(e => e.id === exerciseId);
    if (!exercise) return;

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
  };

  // Mises à jour d'état robustes (évite les stale closures de blueprint)
  const handleUpdateExercise = (day: string, index: number, updatedEx: PlannedExercise) => {
    setBlueprint(prev => {
      const updatedDayExercises = [...(prev[day] || [])];
      updatedDayExercises[index] = updatedEx;
      return {
        ...prev,
        [day]: updatedDayExercises
      };
    });
  };

  const handleDeleteExercise = (day: string, index: number) => {
    setBlueprint(prev => {
      const updatedDayExercises = (prev[day] || []).filter((_, i) => i !== index);
      return {
        ...prev,
        [day]: updatedDayExercises
      };
    });
  };

  const handleClearDay = (day: string) => {
    setBlueprint(prev => ({
      ...prev,
      [day]: []
    }));
  };

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

  // 9. Supprimer un Blueprint
  const handleDeleteBlueprint = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
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

          {/* Blueprints History / Presets */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Mes Blueprints</span>
              <div className="flex gap-1.5">
                <button
                  onClick={handleNewBlueprint}
                  className="text-[10px] bg-zinc-900 hover:bg-zinc-800 hover:text-white text-zinc-400 font-bold px-2 py-1 rounded cursor-pointer transition-colors border border-zinc-800"
                >
                  Nouveau
                </button>
                <button
                  onClick={handleSaveBlueprint}
                  className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 font-bold px-2 py-1 rounded cursor-pointer transition-colors"
                >
                  Sauvegarder
                </button>
              </div>
            </div>

            <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
              {savedBlueprints.length === 0 ? (
                <p className="text-[10px] text-zinc-500 text-center py-6 border border-dashed border-zinc-900 rounded-lg">
                  Aucun programme enregistré.
                </p>
              ) : (
                savedBlueprints.map(sb => (
                  <div
                    key={sb.id}
                    onClick={() => handleLoadBlueprint(sb.id)}
                    className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                      activeBlueprintId === sb.id
                        ? 'border-emerald-500 bg-emerald-950/10 text-white font-bold'
                        : 'border-zinc-900 bg-zinc-900/10 text-zinc-400 hover:bg-zinc-900/40 hover:text-white'
                    }`}
                  >
                    <span className="truncate max-w-[170px]">{sb.name}</span>
                    <button
                      onClick={(e) => handleDeleteBlueprint(sb.id, e)}
                      className="text-zinc-600 hover:text-red-400 p-0.5 rounded transition-colors"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))
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
      <section className="flex-1 flex flex-col h-full overflow-hidden p-4 md:p-6 gap-4">
        
        {/* Upper Portion: SVG Anatomical Avatar — fixed height, no scroll */}
        <div className="w-full flex justify-center shrink-0 h-[280px] sm:h-[320px] md:h-[35vh] min-h-[220px]">
          <div className="w-full h-full max-w-5xl bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden flex flex-col">
            <HumanAvatar simulation={simulationResult} selectedDay={selectedDay} />
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
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLibraryOpen(!libraryOpen)}
                className="rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 font-bold px-3 py-1.5 text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                {libraryOpen ? 'Masquer Bibliothèque' : 'Afficher Bibliothèque'}
              </button>
            </div>
          </div>

          <Sequencer
            blueprint={blueprint}
            toggledDays={toggledDays}
            onUpdateExercise={handleUpdateExercise}
            onDeleteExercise={handleDeleteExercise}
            onClearDay={handleClearDay}
            onUpdateToggledDays={setToggledDays}
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
          />
        </div>
      </section>

      {/* 3. RIGHT PANEL (Library Drawer) */}
      <section className={`${libraryOpen ? 'block' : 'hidden'} border-t md:border-t-0 md:border-l border-zinc-900 shrink-0`}>
        <LibraryDrawer
          onAddExercise={handleAddExercise}
          isOpen={true}
          onClose={() => setLibraryOpen(false)}
        />
      </section>

      {/* 4. MODALS */}
      <CalibrageModal
        isOpen={isCalibrageOpen}
        onClose={() => setIsCalibrageOpen(false)}
        profile={profile}
        onSave={handleSaveProfile}
      />
    </main>
  );
}
