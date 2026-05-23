import React from 'react';
import { WeeklyBlueprint } from '@/lib/calculations';

interface BlueprintsModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedBlueprints: { id: string; name: string; blueprint: WeeklyBlueprint }[];
  onLoadBlueprint: (id: string) => void;
  onRenameBlueprint: (id: string, name: string) => void;
  onDeleteBlueprint: (id: string) => void;
  activeBlueprintId: string | null;
}

export default function BlueprintsModal({
  isOpen,
  onClose,
  savedBlueprints,
  onLoadBlueprint,
  onRenameBlueprint,
  onDeleteBlueprint,
  activeBlueprintId,
}: BlueprintsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-opacity">
      <div className="relative w-full max-w-lg border border-zinc-800 rounded-2xl bg-zinc-950 p-6 md:p-8 shadow-2xl shadow-emerald-500/5 flex flex-col max-h-[85vh]">
        {/* Glow effect */}
        <div className="absolute -top-10 -left-10 -z-10 h-32 w-32 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -bottom-10 -right-10 -z-10 h-32 w-32 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="flex items-center justify-between border-b border-zinc-850 pb-4 shrink-0">
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Gestion des Blueprints
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin py-4 space-y-3 min-h-0 pr-1 mt-2">
          {savedBlueprints.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-zinc-900 rounded-xl">
              <span className="text-2xl">📋</span>
              <h3 className="text-sm font-bold text-zinc-400 mt-3">Aucun blueprint sauvegardé</h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
                Créez et configurez un programme dans le séquenceur, puis cliquez sur &quot;Sauvegarder&quot; dans la barre latérale pour l&apos;ajouter.
              </p>
            </div>
          ) : (
            savedBlueprints.map((sb) => {
              const isActive = activeBlueprintId === sb.id;
              
              // Calculate day summaries/count of exercises to show helpful metadata
              const daysCount = Object.keys(sb.blueprint).filter(day => sb.blueprint[day].length > 0).length;
              const totalExCount = Object.values(sb.blueprint).reduce((sum, exs) => sum + exs.length, 0);

              return (
                <div
                  key={sb.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border transition-all duration-200 gap-3 ${
                    isActive
                      ? 'border-emerald-500 bg-emerald-950/10 shadow-[0_0_15px_rgba(16,185,129,0.08)]'
                      : 'border-zinc-900 bg-zinc-900/30 hover:border-zinc-800'
                  }`}
                >
                  {/* Metadata */}
                  <div className="flex flex-col min-w-0">
                    <span className={`text-sm font-bold truncate ${isActive ? 'text-emerald-400' : 'text-zinc-200'}`}>
                      {sb.name}
                    </span>
                    <span className="text-[10px] text-zinc-500 mt-0.5">
                      {daysCount} {daysCount > 1 ? 'jours configurés' : 'jour configuré'} · {totalExCount} {totalExCount > 1 ? 'exercices au total' : 'exercice au total'}
                    </span>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        onLoadBlueprint(sb.id);
                        onClose();
                      }}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-emerald-500 text-zinc-950 hover:bg-emerald-600'
                          : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300'
                      }`}
                      title={isActive ? "Blueprint actif" : "Charger ce blueprint"}
                    >
                      {isActive ? 'Actif' : 'Sélectionner'}
                    </button>
                    
                    <button
                      onClick={() => onRenameBlueprint(sb.id, sb.name)}
                      className="p-1.5 rounded-lg bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-850 hover:border-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                      title="Renommer"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>

                    <button
                      onClick={() => onDeleteBlueprint(sb.id)}
                      className="p-1.5 rounded-lg bg-zinc-900/50 hover:bg-red-500/10 border border-zinc-850 hover:border-red-500/20 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                      title="Supprimer"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="border-t border-zinc-850 pt-4 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="rounded-lg bg-zinc-900 hover:bg-zinc-850 px-5 py-2 text-xs font-bold text-zinc-300 transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
