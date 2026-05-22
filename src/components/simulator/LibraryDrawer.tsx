import React, { useState } from 'react';
import {
  Exercise,
  EXERCISE_LIBRARY,
  MUSCLE_DETAILS,
  EXERCISE_TENSION_MATRICES,
  MuscleId,
  SimulationResult
} from '@/lib/calculations';
import CapacityBar from './CapacityBar';

interface LibraryDrawerProps {
  onAddExercise: (exerciseId: string, day: string) => void;
  isOpen: boolean;
  onClose?: () => void;
  selectedMuscle: string;
  onSelectMuscle: (muscle: string) => void;
  simulation: SimulationResult;
}

const EQUIPMENT_LABELS: { [key: string]: string } = {
  poids_libre: 'Poids Libres',
  machine: 'Machine',
  pdc: 'Poids du Corps'
};

const MUSCLE_SUBGROUPS: Record<string, string[]> = {
  chest: ['chest', 'upperChest', 'lowerChest', 'serratus'],
  quadriceps: ['quadriceps', 'innerQuad', 'outerQuad'],
  abs: ['abs', 'upperAbs', 'lowerAbs'],
  trapezius: ['trapezius', 'upperTrapezius', 'lowerTrapezius'],
  upperBack: ['upperBack', 'rhomboids', 'rotatorCuff'],
  frontDeltoid: ['frontDeltoid', 'deltoids'],
  rearDeltoid: ['rearDeltoid', 'deltoids']
};

export default function LibraryDrawer({
  onAddExercise,
  isOpen,
  onClose,
  selectedMuscle,
  onSelectMuscle,
  simulation
}: LibraryDrawerProps) {
  const [search, setSearch] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState('all');
  const [activeAddMenu, setActiveAddMenu] = useState<string | null>(null);

  if (!isOpen) return null;

  // Déterminer la liste des muscles cibles (gère les sous-groupes physiologiques)
  const targetMuscles = selectedMuscle === 'all'
    ? []
    : (MUSCLE_SUBGROUPS[selectedMuscle] || [selectedMuscle]);

  // Filtrer la bibliothèque avec calcul d'impact
  const mappedExercises = EXERCISE_LIBRARY.map(ex => {
    let maxImpact = 0;
    if (selectedMuscle !== 'all') {
      targetMuscles.forEach(mId => {
        let impact = 0;
        const matrix = EXERCISE_TENSION_MATRICES[ex.id];
        if (matrix && matrix[mId as MuscleId] !== undefined) {
          impact = matrix[mId as MuscleId]!;
        } else if (ex.muscle_primaire === mId) {
          impact = 1.0;
        } else if (ex.muscles_secondaires.includes(mId as MuscleId)) {
          impact = 0.35;
        }
        if (impact > maxImpact) {
          maxImpact = impact;
        }
      });
    } else {
      maxImpact = 1.0; // Par défaut quand aucun filtre actif
    }
    return { ex, impact: maxImpact };
  });

  const filteredExercises = mappedExercises.filter(({ ex, impact }) => {
    const matchesSearch = ex.nom.toLowerCase().includes(search.toLowerCase());
    const matchesMuscle = selectedMuscle === 'all' || impact > 0;
    const matchesEquipment = selectedEquipment === 'all' || ex.equipment === selectedEquipment;
    return matchesSearch && matchesMuscle && matchesEquipment;
  });

  // Si un muscle spécifique est sélectionné, trier par impact décroissant, puis par tier_snc décroissant (exercices lourds d'abord)
  if (selectedMuscle !== 'all') {
    filteredExercises.sort((a, b) => {
      if (b.impact !== a.impact) {
        return b.impact - a.impact;
      }
      return b.ex.tier_snc - a.ex.tier_snc;
    });
  }

  const daysOfWeek = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

  return (
    <div className="flex flex-col h-full bg-zinc-950 border-l border-zinc-850 p-4 w-full md:w-[320px] transition-all">
      <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
        <h3 className="text-md font-bold text-white flex items-center gap-2">
          <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          Bibliothèque d'Exercices
        </h3>
        {onClose && (
          <button onClick={onClose} className="md:hidden text-zinc-400 hover:text-white p-1">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Recherche */}
      <div className="mt-4">
        <input
          type="text"
          placeholder="Rechercher un exercice..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-zinc-850 bg-zinc-900 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
        />
      </div>

      {/* Filtres */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        {/* Muscle */}
        <div>
          <label className="block text-[10px] font-medium text-zinc-400 mb-1">Muscle</label>
          <select
            value={selectedMuscle}
            onChange={(e) => onSelectMuscle(e.target.value)}
            className="w-full rounded border border-zinc-850 bg-zinc-900 px-1 py-1.5 text-[11px] text-white focus:outline-none cursor-pointer"
          >
            <option value="all">Tous les muscles</option>
            {Object.entries(MUSCLE_DETAILS).map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
        </div>

        {/* Équipement */}
        <div>
          <label className="block text-[10px] font-medium text-zinc-400 mb-1">Équipement</label>
          <select
            value={selectedEquipment}
            onChange={(e) => setSelectedEquipment(e.target.value)}
            className="w-full rounded border border-zinc-850 bg-zinc-900 px-1 py-1.5 text-[11px] text-white focus:outline-none cursor-pointer"
          >
            <option value="all">Tous les types</option>
            {Object.entries(EQUIPMENT_LABELS).map(([id, label]) => (
              <option key={id} value={id}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Liste des exercices */}
      <div className="mt-4 flex-1 overflow-y-auto space-y-2 pr-1 select-none">
        {filteredExercises.length === 0 ? (
          <p className="text-xs text-zinc-500 text-center py-8">Aucun exercice trouvé.</p>
        ) : (
          filteredExercises.map(({ ex, impact }) => {
            const capacity = simulation?.muscles?.[ex.muscle_primaire]?.remainingCapacity ?? 1.0;
            const muscleColor = simulation?.muscles?.[ex.muscle_primaire]?.color;
            const isBlocked = muscleColor === 'red';

            return (
              <div
                key={ex.id}
                draggable={!isBlocked}
                onDragStart={(e) => {
                  if (isBlocked) {
                    e.preventDefault();
                    return;
                  }
                  e.dataTransfer.setData('text/plain', ex.id);
                  e.dataTransfer.effectAllowed = 'copy';
                }}
                className={`relative p-2.5 rounded-lg border transition-all flex flex-col gap-1.5 select-none ${
                  isBlocked
                    ? 'border-red-900/40 bg-red-950/5 hover:border-red-800/40 cursor-not-allowed opacity-80'
                    : muscleColor === 'orange'
                    ? 'border-amber-900/30 bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-amber-500/30 cursor-grab active:cursor-grabbing group'
                    : 'border-zinc-900 bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-emerald-500/30 cursor-grab active:cursor-grabbing group'
                }`}
                title={
                  isBlocked
                    ? "Muscle saturé ! Ajout bloqué pour éviter le surentraînement."
                    : muscleColor === 'orange'
                    ? "Muscle en surcharge locale. Vous pouvez planifier avec précaution."
                    : "Glissez cet exercice dans le séquenceur pour l'ajouter"
                }
              >
                <div className="flex items-start justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`text-[11px] select-none transition-colors mr-0.5 ${
                      isBlocked ? 'text-zinc-700' : 'text-zinc-600 group-hover:text-zinc-400 cursor-grab active:cursor-grabbing'
                    }`}>
                      ⋮⋮
                    </span>
                    <span className={`text-xs font-semibold truncate ${
                      isBlocked ? 'text-zinc-400' : 'text-zinc-200'
                    }`}>{ex.nom}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {selectedMuscle !== 'all' && (
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-full font-bold">
                        {Math.round(impact * 100)}%
                      </span>
                    )}
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded-full whitespace-nowrap font-semibold ${
                        ex.tier_snc === 1
                          ? 'bg-red-500/10 text-red-400'
                          : ex.tier_snc === 2
                          ? 'bg-amber-500/10 text-amber-400'
                          : 'bg-zinc-500/10 text-zinc-400'
                      }`}
                    >
                      T{ex.tier_snc}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-[10px] text-zinc-400">
                  <span className={isBlocked ? 'text-zinc-500' : ''}>{MUSCLE_DETAILS[ex.muscle_primaire]}</span>
                  <span className="text-zinc-500">{EQUIPMENT_LABELS[ex.equipment]}</span>
                </div>

                {/* Work Capacity Bar */}
                <div className="py-1">
                  <CapacityBar progress={capacity} color={muscleColor} showLabel={true} />
                </div>

                {/* Orange warning badge if muscle is in surcharge but not blocked */}
                {muscleColor === 'orange' && (
                  <div className="mt-1 flex items-center justify-center gap-1 w-full rounded bg-amber-950/20 text-[9px] py-1 text-amber-400 font-bold border border-amber-500/20 select-none">
                    <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>Surcharge : Fatigue Élevée ⚠️</span>
                  </div>
                )}

                {/* Click to add day list */}
                {isBlocked ? (
                  <div className="mt-1 flex items-center justify-center gap-1 w-full rounded bg-red-950/20 text-[9px] py-1.5 text-red-400 font-extrabold border border-red-500/20 cursor-not-allowed">
                    <svg className="h-3 w-3 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>MRV Dépassé : Bloqué 🔴</span>
                  </div>
                ) : activeAddMenu === ex.id ? (
                  <div className="mt-2 border-t border-zinc-850 pt-2 animate-fadeIn">
                    <span className="text-[10px] text-emerald-400 block mb-1">Ajouter à quel jour ?</span>
                    <div className="grid grid-cols-4 gap-1">
                      {daysOfWeek.map(d => (
                        <button
                          key={d}
                          onClick={() => {
                            onAddExercise(ex.id, d);
                            setActiveAddMenu(null);
                          }}
                          className="rounded bg-zinc-800 hover:bg-emerald-500 hover:text-zinc-950 px-1 py-1 text-[9px] font-bold text-center text-zinc-300 transition-all cursor-pointer"
                        >
                          {d.substring(0, 3)}
                        </button>
                      ))}
                      <button
                        onClick={() => setActiveAddMenu(null)}
                        className="rounded bg-zinc-900 hover:bg-zinc-850 px-1 py-1 text-[9px] font-medium text-center text-zinc-500 col-span-4 mt-1 transition-all cursor-pointer"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setActiveAddMenu(ex.id)}
                    className="mt-1 flex items-center justify-center gap-1 w-full rounded bg-zinc-850 hover:bg-zinc-800 text-[10px] py-1 text-zinc-300 hover:text-emerald-400 transition-all cursor-pointer border border-zinc-800"
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Planifier
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
