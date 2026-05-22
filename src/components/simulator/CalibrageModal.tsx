import React, { useState } from 'react';
import { UserProfile } from '@/lib/calculations';

interface CalibrageModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSave: (newProfile: UserProfile) => void;
}

export default function CalibrageModal({ isOpen, onClose, profile, onSave }: CalibrageModalProps) {
  const [pdc, setPdc] = useState(profile.pdc);
  const [squat, setSquat] = useState(profile.prs.squat);
  const [bench, setBench] = useState(profile.prs.bench);
  const [deadlift, setDeadlift] = useState(profile.prs.deadlift);
  const [ohp, setOhp] = useState(profile.prs.ohp);
  const [maxSnc, setMaxSnc] = useState(profile.maxSnc);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      pdc: Number(pdc) || 75,
      prs: {
        squat: Number(squat) || 100,
        bench: Number(bench) || 80,
        deadlift: Number(deadlift) || 120,
        ohp: Number(ohp) || 50
      },
      maxSnc: Number(maxSnc) || 15.0
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-opacity">
      <div className="relative w-full max-w-lg border border-zinc-800 rounded-2xl bg-zinc-950 p-6 md:p-8 shadow-2xl shadow-emerald-500/5">
        {/* Glow effect */}
        <div className="absolute -top-10 -left-10 -z-10 h-32 w-32 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -bottom-10 -right-10 -z-10 h-32 w-32 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="flex items-center justify-between border-b border-zinc-850 pb-4">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Calibrage Physiologique
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

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Biometrics */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-emerald-400">Biométrie</h3>
            <div className="mt-3 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400">Poids de Corps (PDC - kg)</label>
                <input
                  type="number"
                  required
                  min="30"
                  max="250"
                  value={pdc}
                  onChange={(e) => setPdc(Number(e.target.value))}
                  className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400">Seuil Max Fatigue SNC</label>
                <input
                  type="number"
                  required
                  min="5"
                  max="40"
                  step="0.5"
                  value={maxSnc}
                  onChange={(e) => setMaxSnc(Number(e.target.value))}
                  className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
                <span className="text-[10px] text-zinc-500">Par défaut : 15.0</span>
              </div>
            </div>
          </div>

          {/* Records (1RM) */}
          <div className="border-t border-zinc-850 pt-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-emerald-400">Records Personnels (1RM)</h3>
            <p className="text-xs text-zinc-500 mt-1">Servent de base aux intensités des mouvements axiaux.</p>
            
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400">Squat (kg)</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="500"
                  value={squat}
                  onChange={(e) => setSquat(Number(e.target.value))}
                  className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400">Développé Couché (kg)</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="400"
                  value={bench}
                  onChange={(e) => setBench(Number(e.target.value))}
                  className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400">Soulevé de Terre (kg)</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="600"
                  value={deadlift}
                  onChange={(e) => setDeadlift(Number(e.target.value))}
                  className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400">Overhead Press (kg)</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="300"
                  value={ohp}
                  onChange={(e) => setOhp(Number(e.target.value))}
                  className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="border-t border-zinc-850 pt-5 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="rounded-lg bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 px-5 py-2 text-sm font-bold text-zinc-950 shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all cursor-pointer"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
