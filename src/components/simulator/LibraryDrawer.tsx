import React, { useState } from 'react';
import { Exercise, EXERCISE_LIBRARY, MUSCLE_DETAILS } from '@/lib/calculations';

interface LibraryDrawerProps {
  onAddExercise: (exerciseId: string, day: string) => void;
  isOpen: boolean;
  onClose?: () => void;
}

const EQUIPMENT_LABELS: { [key: string]: string } = {
  poids_libre: 'Poids Libres',
  machine: 'Machine',
  pdc: 'Poids du Corps'
};

export default function LibraryDrawer({ onAddExercise, isOpen, onClose }: LibraryDrawerProps) {
  const [search, setSearch] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState('all');
  const [selectedEquipment, setSelectedEquipment] = useState('all');
  const [activeAddMenu, setActiveAddMenu] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filtrer la bibliothèque
  const filteredExercises = EXERCISE_LIBRARY.filter(ex => {
    const matchesSearch = ex.nom.toLowerCase().includes(search.toLowerCase());
    const matchesMuscle = selectedMuscle === 'all' || ex.muscle_primaire === selectedMuscle || (ex.muscles_secondaires as string[]).includes(selectedMuscle);
    const matchesEquipment = selectedEquipment === 'all' || ex.equipment === selectedEquipment;
    return matchesSearch && matchesMuscle && matchesEquipment;
  });

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
            onChange={(e) => setSelectedMuscle(e.target.value)}
            className="w-full rounded border border-zinc-850 bg-zinc-900 px-1 py-1.5 text-[11px] text-white focus:outline-none"
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
            className="w-full rounded border border-zinc-850 bg-zinc-900 px-1 py-1.5 text-[11px] text-white focus:outline-none"
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
          filteredExercises.map(ex => (
            <div
              key={ex.id}
              className="relative p-2.5 rounded-lg border border-zinc-900 bg-zinc-900/40 hover:bg-zinc-900/80 transition-all flex flex-col gap-1.5"
            >
              <div className="flex items-start justify-between gap-1.5">
                <span className="text-xs font-semibold text-zinc-200">{ex.nom}</span>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded-full whitespace-nowrap ${
                    ex.tier_snc === 1
                      ? 'bg-red-500/10 text-red-400'
                      : ex.tier_snc === 2
                      ? 'bg-amber-500/10 text-amber-400'
                      : 'bg-zinc-500/10 text-zinc-400'
                  }`}
                >
                  Tier {ex.tier_snc}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-[10px] text-zinc-400">
                <span>{MUSCLE_DETAILS[ex.muscle_primaire]}</span>
                <span className="text-zinc-500">{EQUIPMENT_LABELS[ex.equipment]}</span>
              </div>

              {/* Click to add day list */}
              {activeAddMenu === ex.id ? (
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
          ))
        )}
      </div>
    </div>
  );
}
