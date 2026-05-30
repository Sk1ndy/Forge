'use client';

import React, { useState, useMemo } from 'react';
import HumanAvatar from '@/components/simulator/HumanAvatar';
import { SimulationResult, MuscleStatus, MuscleId } from '@/lib/calculations';

// Liste complète des muscles gérés par le système
const MUSCLE_LIST: { id: MuscleId; label: string; group: string; defaultContributors: { nom: string; percentage: number }[] }[] = [
  { id: 'chest', label: 'Pectoraux', group: 'Push', defaultContributors: [{ nom: 'Bench Press', percentage: 70 }, { nom: 'Dips', percentage: 30 }] },
  { id: 'upperChest', label: 'Haut Pectoraux', group: 'Push', defaultContributors: [{ nom: 'Incline Bench', percentage: 80 }, { nom: 'Pec Deck', percentage: 20 }] },
  { id: 'lowerChest', label: 'Bas Pectoraux', group: 'Push', defaultContributors: [{ nom: 'Decline Bench', percentage: 75 }, { nom: 'Cable Crossover', percentage: 25 }] },
  
  { id: 'abs', label: 'Abdominaux', group: 'Core', defaultContributors: [{ nom: 'Crunch', percentage: 60 }, { nom: 'Plank', percentage: 40 }] },
  { id: 'upperAbs', label: 'Haut Abdominos', group: 'Core', defaultContributors: [{ nom: 'Cable Crunch', percentage: 85 }, { nom: 'Ab Wheel', percentage: 15 }] },
  { id: 'lowerAbs', label: 'Bas Abdominos', group: 'Core', defaultContributors: [{ nom: 'Hanging Leg Raise', percentage: 90 }, { nom: 'Reverse Crunch', percentage: 10 }] },
  { id: 'obliques', label: 'Obliques', group: 'Core', defaultContributors: [{ nom: 'Russian Twist', percentage: 70 }, { nom: 'Side Plank', percentage: 30 }] },
  
  { id: 'biceps', label: 'Biceps', group: 'Pull', defaultContributors: [{ nom: 'Barbell Curl', percentage: 65 }, { nom: 'Hammer Curl', percentage: 35 }] },
  { id: 'triceps', label: 'Triceps', group: 'Push', defaultContributors: [{ nom: 'Triceps Pushdown', percentage: 60 }, { nom: 'Skull Crusher', percentage: 40 }] },
  
  { id: 'deltoids', label: 'Deltoïdes', group: 'Push', defaultContributors: [{ nom: 'Overhead Press', percentage: 50 }, { nom: 'Lateral Raise', percentage: 50 }] },
  { id: 'frontDeltoid', label: 'Faisceau Antérieur', group: 'Push', defaultContributors: [{ nom: 'Front Raise', percentage: 70 }, { nom: 'Shoulder Press', percentage: 30 }] },
  { id: 'rearDeltoid', label: 'Faisceau Postérieur', group: 'Pull', defaultContributors: [{ nom: 'Face Pull', percentage: 80 }, { nom: 'Reverse Fly', percentage: 20 }] },
  
  { id: 'upperBack', label: 'Grand Dorsal', group: 'Pull', defaultContributors: [{ nom: 'Pull-up', percentage: 60 }, { nom: 'Lat Pulldown', percentage: 40 }] },
  { id: 'lowerBack', label: 'Lombaires', group: 'Core', defaultContributors: [{ nom: 'Deadlift', percentage: 75 }, { nom: 'Hyperextension', percentage: 25 }] },
  { id: 'rhomboids', label: 'Rhomboïdes', group: 'Pull', defaultContributors: [{ nom: 'Barbell Row', percentage: 70 }, { nom: 'Seated Cable Row', percentage: 30 }] },
  
  { id: 'trapezius', label: 'Trapèzes', group: 'Pull', defaultContributors: [{ nom: 'Dumbbell Shrug', percentage: 80 }, { nom: 'Farmer Walk', percentage: 20 }] },
  { id: 'upperTrapezius', label: 'Trapèze Supérieur', group: 'Pull', defaultContributors: [{ nom: 'Barbell Shrug', percentage: 85 }, { nom: 'Facepull', percentage: 15 }] },
  { id: 'lowerTrapezius', label: 'Trapèze Inférieur', group: 'Pull', defaultContributors: [{ nom: 'Prone Y Raise', percentage: 90 }, { nom: 'Scapular Pull-up', percentage: 10 }] },
  
  { id: 'quadriceps', label: 'Quadriceps', group: 'Legs', defaultContributors: [{ nom: 'Squat', percentage: 70 }, { nom: 'Leg Press', percentage: 30 }] },
  { id: 'innerQuad', label: 'Vaste Médial (VMO)', group: 'Legs', defaultContributors: [{ nom: 'Hack Squat', percentage: 80 }, { nom: 'Leg Extension', percentage: 20 }] },
  { id: 'outerQuad', label: 'Vaste Latéral', group: 'Legs', defaultContributors: [{ nom: 'Front Squat', percentage: 75 }, { nom: 'Sissy Squat', percentage: 25 }] },
  
  { id: 'hamstring', label: 'Ischio-Jambiers', group: 'Legs', defaultContributors: [{ nom: 'Romanian Deadlift', percentage: 65 }, { nom: 'Lying Leg Curl', percentage: 35 }] },
  { id: 'gluteal', label: 'Fessiers', group: 'Legs', defaultContributors: [{ nom: 'Hip Thrust', percentage: 70 }, { nom: 'Sumo Squat', percentage: 30 }] },
  
  { id: 'calves', label: 'Mollets', group: 'Legs', defaultContributors: [{ nom: 'Standing Calf Raise', percentage: 60 }, { nom: 'Seated Calf Raise', percentage: 40 }] },
  { id: 'forearm', label: 'Avant-bras', group: 'Pull', defaultContributors: [{ nom: 'Wrist Curl', percentage: 50 }, { nom: 'Plate Pinch', percentage: 50 }] }
];

export default function HomeHub() {
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleId>('chest');
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  
  // Simulation des scores de fatigue / volumes pour chaque muscle
  const [muscleValues, setMuscleValues] = useState<Record<MuscleId, { inol: number; sets: number; history: number[] }>>(() => {
    const initial: any = {};
    MUSCLE_LIST.forEach((m) => {
      initial[m.id] = {
        inol: 0.2, // Valeur initiale modérée (Gris)
        sets: 4,
        history: [0.1, 0.2, 0.15, 0.3, 0.22, 0.18, 0.2]
      };
    });
    // Forcer quelques valeurs intéressantes pour la démo visuelle initiale
    initial['chest'] = { inol: 1.4, sets: 14, history: [0.3, 0.6, 0.9, 1.2, 1.4, 1.3, 1.4] }; // Orange
    initial['quadriceps'] = { inol: 2.2, sets: 24, history: [0.5, 1.0, 1.5, 1.8, 2.0, 2.2, 2.1] }; // Rouge
    initial['upperBack'] = { inol: 0.8, sets: 11, history: [0.2, 0.4, 0.5, 0.7, 0.8, 0.75, 0.8] }; // Vert
    return initial;
  });

  // Paramètres SNC
  const [sncScore, setSncScore] = useState<number>(6.5);
  const [maxSnc, setMaxSnc] = useState<number>(15.0);
  const [chronicSnc, setChronicSnc] = useState<number>(1.8);

  // Construction dynamique du SimulationResult pour le composant HumanAvatar
  const simulationResult = useMemo<SimulationResult>(() => {
    const muscles: Partial<Record<MuscleId, MuscleStatus>> = {};
    
    MUSCLE_LIST.forEach((m) => {
      const state = muscleValues[m.id] || { inol: 0, sets: 0, history: [] };
      
      // Calcul des paliers de couleur de fatigue
      let color: 'grey' | 'green' | 'orange' | 'red' = 'grey';
      let statusLabel: 'REST' | 'OPTIMAL' | 'OVERLOAD' | 'DANGER' = 'REST';
      
      if (state.inol < 0.5) {
        color = 'grey';
        statusLabel = 'REST';
      } else if (state.inol >= 0.5 && state.inol < 1.2) {
        color = 'green';
        statusLabel = 'OPTIMAL';
      } else if (state.inol >= 1.2 && state.inol < 2.0) {
        color = 'orange';
        statusLabel = 'OVERLOAD';
      } else {
        color = 'red';
        statusLabel = 'DANGER';
      }

      muscles[m.id] = {
        name: m.label,
        inol: parseFloat(state.inol.toFixed(2)),
        sets: state.sets,
        color,
        statusLabel,
        contributors: m.defaultContributors,
        remainingCapacity: parseFloat(Math.max(0, (2.5 - state.inol) / 2.5 * 100).toFixed(1)),
        jointStress: parseFloat((state.inol * 0.45).toFixed(2)),
        readiness: parseFloat(Math.max(0, 100 - state.inol * 40).toFixed(1)),
        fatigueHistory: state.history
      };
    });

    const sncPercentage = Math.round((sncScore / maxSnc) * 100);
    const cnsFailure = sncScore > maxSnc;

    return {
      muscles,
      sncScore,
      sncPercentage,
      cnsFailure,
      chronicSncStress: chronicSnc,
      junkVolumeAlerts: [],
      globalWorkCapacity: Math.round(Math.max(0, 100 - sncPercentage * 0.7)),
      systemicReadiness: Math.round(Math.max(0, 100 - sncPercentage)),
      topSurcharged: Object.values(muscles).filter(m => m.color === 'red' || m.color === 'orange').slice(0, 3),
      topNeglected: Object.values(muscles).filter(m => m.color === 'grey').slice(0, 3),
      pushPullLegsRatio: { push: 40, pull: 35, legs: 25 },
      weeklyMacro: {
        peakFatigue: {},
        weeklyEffectiveSets: {},
        pushPullRatio: { push: 55, pull: 45 },
        axialSncLoad: 2.5,
        traumaAlerts: []
      },
      weeklyTraumas: [],
      progressiveOverload: {},
      injuryPredictions: [],
      monotonyAlerts: []
    };
  }, [muscleValues, sncScore, maxSnc, chronicSnc]);

  // Handler de mise à jour pour le muscle actuellement sélectionné
  const handleInolChange = (val: number) => {
    setMuscleValues((prev) => {
      const current = prev[selectedMuscle];
      // Ajuste automatiquement les séries correspondantes pour garder une cohérence
      const inferredSets = Math.round(val * 10);
      
      // Met à jour l'historique avec la nouvelle valeur finale
      const newHistory = [...(current.history || [0, 0, 0, 0, 0, 0, 0])];
      newHistory[newHistory.length - 1] = val;

      return {
        ...prev,
        [selectedMuscle]: {
          ...current,
          inol: val,
          sets: inferredSets,
          history: newHistory
        }
      };
    });
  };

  const handleSetsChange = (val: number) => {
    setMuscleValues((prev) => {
      const current = prev[selectedMuscle];
      // Ajuste l'INOL théorique
      const inferredInol = val / 10;
      
      const newHistory = [...(current.history || [0, 0, 0, 0, 0, 0, 0])];
      newHistory[newHistory.length - 1] = inferredInol;

      return {
        ...prev,
        [selectedMuscle]: {
          ...current,
          sets: val,
          inol: inferredInol,
          history: newHistory
        }
      };
    });
  };

  const activeMuscleData = simulationResult.muscles[selectedMuscle];
  const activeConfig = MUSCLE_LIST.find(m => m.id === selectedMuscle);

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans p-6 overflow-x-hidden flex flex-col relative select-none">
      {/* Glow ambient de fond cyberpunk */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-red-500/10 blur-[150px] rounded-full pointer-events-none" />

      {/* Header HUD */}
      <header className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-4 z-10">
        <div>
          <h1 className="text-2xl font-black tracking-widest text-emerald-400">FORGE <span className="text-white text-lg font-bold">// CAD AVATAR LAB</span></h1>
          <p className="text-xs text-zinc-500 font-mono mt-1">ISOLATION DES COMPOSANTS & HEATMAP PHYSIOLOGIQUE INTERACTIVE</p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 font-mono text-xs">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 rounded-md transition-all ${viewMode === 'day' ? 'bg-emerald-500 text-black font-black' : 'text-zinc-400 hover:text-white'}`}
            >
              VUE DIRECTE (INOL)
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-md transition-all ${viewMode === 'week' ? 'bg-emerald-500 text-black font-black' : 'text-zinc-400 hover:text-white'}`}
            >
              VUE HEBDO (SÉRIES)
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid Cockpit Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch flex-1 z-10">
        
        {/* Panneau de Contrôle Gauche (Biométrie / SNC) */}
        <div className="lg:col-span-3 flex flex-col gap-6 bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
          <h2 className="text-sm font-black tracking-wider text-zinc-400 flex items-center gap-2 border-b border-zinc-800 pb-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
            CONTRÔLE SYSTÉMIQUE (SNC)
          </h2>

          {/* CNS Score Slider */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-zinc-400">Taxation SNC Actuelle</span>
              <span className={`font-bold ${simulationResult.cnsFailure ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
                {sncScore.toFixed(1)} / {maxSnc.toFixed(1)}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              step="0.1"
              value={sncScore}
              onChange={(e) => setSncScore(parseFloat(e.target.value))}
              className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            {simulationResult.cnsFailure && (
              <div className="bg-red-950/40 border border-red-500/50 rounded-lg p-2.5 text-[10px] text-red-300 font-mono leading-relaxed mt-1 animate-pulse">
                ⚠️ FAILLE SYSTÉMIQUE : Charge du SNC critique. L&apos;athlète est en surentraînement aigu (avatar grisé/fatigué).
              </div>
            )}
          </div>

          {/* Chronic SNC Stress */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-zinc-400">Stress Chronique (Cortisol)</span>
              <span className={`font-bold ${chronicSnc > 3.0 ? 'text-red-500' : 'text-zinc-300'}`}>
                {chronicSnc.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="5"
              step="0.05"
              value={chronicSnc}
              onChange={(e) => setChronicSnc(parseFloat(e.target.value))}
              className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
            {chronicSnc > 3.0 && (
              <div className="bg-orange-950/30 border border-red-500/40 rounded-lg p-2.5 text-[10px] text-orange-300 font-mono leading-relaxed">
                🚨 CATABOLISME EN COURS : Stress chronique &gt; 3.0. Fonte musculaire simulée. Deload de rigueur.
              </div>
            )}
          </div>

          {/* Status Globaux */}
          <div className="flex flex-col gap-3 mt-auto border-t border-zinc-800 pt-4 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-zinc-500">Readiness Globale</span>
              <span className="text-zinc-200 font-bold">{simulationResult.systemicReadiness}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Capacité de Travail (GWC)</span>
              <span className="text-zinc-200 font-bold">{simulationResult.globalWorkCapacity}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Muscles surchargés</span>
              <span className="text-red-400 font-bold">{simulationResult.topSurcharged.length}</span>
            </div>
          </div>
        </div>

        {/* Zone Centrale : L'Avatar Anatomique Interactif */}
        <div className="lg:col-span-6 flex flex-col bg-zinc-900/20 border border-zinc-900 rounded-2xl shadow-xl relative overflow-hidden min-h-[500px]">
          <div className="absolute top-4 left-4 z-20 bg-black/60 border border-zinc-800 rounded-lg px-3 py-1 text-[10px] font-mono text-zinc-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            RENDU PHYSIOLOGIQUE LIVE (INTERACTIF)
          </div>

          <div className="flex-1 flex items-center justify-center p-4">
            <HumanAvatar
              simulation={simulationResult}
              selectedMuscle={selectedMuscle}
              onMuscleClick={(id) => setSelectedMuscle(id)}
              viewMode={viewMode}
            />
          </div>
        </div>

        {/* Panneau de Contrôle Droit (Ajustements de Stress sur le Muscle Sélectionné) */}
        <div className="lg:col-span-3 flex flex-col gap-6 bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-5 shadow-2xl">
          <div className="border-b border-zinc-800 pb-3">
            <div className="text-[10px] font-mono text-emerald-400 font-bold tracking-widest uppercase">MUSCLE CIBLÉ</div>
            <h2 className="text-2xl font-black text-white">{activeConfig?.label || selectedMuscle}</h2>
            <div className="text-xs text-zinc-500 font-mono mt-1">Catégorie : {activeConfig?.group || 'N/A'}</div>
          </div>

          {activeMuscleData ? (
            <div className="flex flex-col gap-6">
              
              {/* Slider INOL */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-zinc-400">Score INOL (Intensité)</span>
                  <span className={`font-bold px-2 py-0.5 rounded ${
                    activeMuscleData.color === 'red' ? 'bg-red-500/20 text-red-400' :
                    activeMuscleData.color === 'orange' ? 'bg-orange-500/20 text-orange-400' :
                    activeMuscleData.color === 'green' ? 'bg-emerald-500/20 text-emerald-400' :
                    'bg-zinc-800 text-zinc-400'
                  }`}>
                    {activeMuscleData.inol.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="3"
                  step="0.05"
                  value={activeMuscleData.inol}
                  onChange={(e) => handleInolChange(parseFloat(e.target.value))}
                  className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="text-[10px] text-zinc-500 font-mono flex justify-between">
                  <span>Maintien (0.0)</span>
                  <span>Surexploité (3.0)</span>
                </div>
              </div>

              {/* Slider Séries */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-zinc-400">Séries Planifiées / Semaine</span>
                  <span className="text-zinc-200 font-bold">{activeMuscleData.sets} séries</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="1"
                  value={activeMuscleData.sets}
                  onChange={(e) => handleSetsChange(parseInt(e.target.value))}
                  className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              {/* Métriques Musculaires Intelligentes */}
              <div className="bg-zinc-950/50 border border-zinc-850 rounded-xl p-3 flex flex-col gap-2 font-mono text-[11px] text-zinc-400">
                <div className="flex justify-between">
                  <span>Capacité Restante :</span>
                  <span className="text-zinc-200 font-bold">{activeMuscleData.remainingCapacity}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Indice Tendineux :</span>
                  <span className="text-orange-400 font-bold">{activeMuscleData.jointStress} / 1.0</span>
                </div>
                <div className="flex justify-between">
                  <span>Readiness Locale :</span>
                  <span className="text-emerald-400 font-bold">{activeMuscleData.readiness}%</span>
                </div>
              </div>

              {/* Top Exercices Cibles */}
              <div>
                <div className="text-[10px] font-mono text-zinc-500 tracking-wider mb-2 uppercase">Principaux Mouvements</div>
                <div className="flex flex-col gap-1.5">
                  {activeConfig?.defaultContributors.map((c, i) => (
                    <div key={i} className="flex justify-between text-xs font-mono bg-zinc-950/20 border border-zinc-850/50 rounded-lg p-2">
                      <span className="text-zinc-300">{c.nom}</span>
                      <span className="text-emerald-400 font-bold">{c.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            <div className="text-xs text-zinc-500 font-mono text-center py-10">Sélectionnez un muscle sur la heatmap pour ajuster ses paramètres physiologiques.</div>
          )}

          {/* Quick List des muscles majeurs pour navigation rapide alternative */}
          <div className="mt-auto border-t border-zinc-800 pt-4">
            <div className="text-[10px] font-mono text-zinc-500 tracking-wider mb-2 uppercase">Index des muscles</div>
            <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto pr-1 select-none font-mono text-[10px]">
              {MUSCLE_LIST.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMuscle(m.id)}
                  className={`px-2 py-1 rounded transition-all ${
                    selectedMuscle === m.id 
                      ? 'bg-emerald-500 text-black font-black' 
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Footer Info / Expo Ready */}
      <footer className="mt-6 border-t border-zinc-800 pt-4 flex justify-between items-center text-[10px] font-mono text-zinc-600">
        <div>PROJET &quot;FORGE&quot; — NEXT.JS FRONT-END CLEANED SLATE</div>
        <div className="flex gap-2 items-center text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          PRÊT POUR EXPO GO (MOBILE DIRECTIVES ACTIVES)
        </div>
      </footer>
    </div>
  );
}
