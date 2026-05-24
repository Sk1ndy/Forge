import React, { useState } from 'react';
import { UserProfile } from '@/lib/calculations';
import { estimate1RM } from '@forge/shared';

interface CalibrageModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSave: (newProfile: UserProfile) => void;
}

export default function CalibrageModal({ isOpen, onClose, profile, onSave }: CalibrageModalProps) {
  const [pdc, setPdc] = useState(profile.pdc);
  const [maxSnc, setMaxSnc] = useState(profile.maxSnc);

  // Recovery states
  const [age, setAge] = useState(profile.age ?? 28);
  const [sleepHours, setSleepHours] = useState(profile.sleepHours ?? 8);
  const [caloricStatus, setCaloricStatus] = useState(profile.caloricStatus ?? 'maintenance');
  const [stressLevel, setStressLevel] = useState(profile.stressLevel ?? 'moderate');

  // Beginner mode
  const [isBeginner, setIsBeginner] = useState(profile.isBeginner ?? false);

  // 1RM states (Advanced)
  const [squat, setSquat] = useState(profile.prs.squat);
  const [bench, setBench] = useState(profile.prs.bench);
  const [deadlift, setDeadlift] = useState(profile.prs.deadlift);
  const [ohp, setOhp] = useState(profile.prs.ohp);

  // Usual Sets states (Beginner)
  const [squatSets, setSquatSets] = useState({ reps: 8, weight: 60 });
  const [benchSets, setBenchSets] = useState({ reps: 8, weight: 50 });
  const [deadliftSets, setDeadliftSets] = useState({ reps: 8, weight: 80 });
  const [ohpSets, setOhpSets] = useState({ reps: 8, weight: 30 });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let finalPrs = {
      squat: Number(squat) || 100,
      bench: Number(bench) || 80,
      deadlift: Number(deadlift) || 120,
      ohp: Number(ohp) || 50
    };

    if (isBeginner) {
      finalPrs = {
        squat: Math.round(estimate1RM(squatSets.weight, squatSets.reps, 8)),
        bench: Math.round(estimate1RM(benchSets.weight, benchSets.reps, 8)),
        deadlift: Math.round(estimate1RM(deadliftSets.weight, deadliftSets.reps, 8)),
        ohp: Math.round(estimate1RM(ohpSets.weight, ohpSets.reps, 8)),
      };
    }

    onSave({
      pdc: Number(pdc) || 75,
      prs: finalPrs,
      maxSnc: Number(maxSnc) || 15.0,
      age: Number(age) || 28,
      sleepHours: Number(sleepHours) || 8,
      caloricStatus: caloricStatus || 'maintenance',
      stressLevel: stressLevel || 'moderate',
      isBeginner: isBeginner
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-opacity overflow-y-auto">
      <div className="relative w-full max-w-xl border border-zinc-800 rounded-2xl bg-zinc-950 p-6 md:p-8 shadow-2xl shadow-emerald-500/5 my-8">
        <div className="absolute -top-10 -left-10 -z-10 h-32 w-32 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -bottom-10 -right-10 -z-10 h-32 w-32 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="flex items-center justify-between border-b border-zinc-850 pb-4">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Calibrage Physiologique
          </h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          
          {/* Biometrics */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-emerald-400">Biométrie Principale</h3>
            <div className="mt-3 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400">Poids de Corps (PDC - kg)</label>
                <input type="number" required min="30" max="250" value={pdc} onChange={(e) => setPdc(Number(e.target.value))} className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400">Seuil Max Fatigue SNC</label>
                <input type="number" required min="5" max="40" step="0.5" value={maxSnc} onChange={(e) => setMaxSnc(Number(e.target.value))} className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none" />
              </div>
            </div>
          </div>

          {/* Mode Débutant Toggle */}
          <div className="border-t border-zinc-850 pt-4">
            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 transition-colors">
              <div className="relative">
                <input type="checkbox" className="sr-only" checked={isBeginner} onChange={(e) => setIsBeginner(e.target.checked)} />
                <div className={`block w-10 h-6 rounded-full transition-colors ${isBeginner ? 'bg-emerald-500' : 'bg-zinc-700'}`}></div>
                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isBeginner ? 'transform translate-x-4' : ''}`}></div>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white">Mode Auto-Calibration (Débutant)</span>
                <span className="text-xs text-zinc-400">Je ne connais pas mes Maxis (1RM). Estimer avec mes séances habituelles.</span>
              </div>
            </label>
          </div>

          {/* Records Personnels */}
          <div className="border-t border-zinc-850 pt-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-emerald-400">
              {isBeginner ? 'Séances Habituelles (Calibration)' : 'Records Personnels (1RM)'}
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              {isBeginner 
                ? "Combien de répétitions fais-tu avec un poids que tu maîtrises confortablement ?" 
                : "Ces données servent de base aux intensités des mouvements axiaux (100% effort)."}
            </p>
            
            {isBeginner ? (
              <div className="mt-4 space-y-4">
                {[{ label: 'Squat', state: squatSets, setter: setSquatSets },
                  { label: 'Développé Couché', state: benchSets, setter: setBenchSets },
                  { label: 'Soulevé de Terre', state: deadliftSets, setter: setDeadliftSets },
                  { label: 'Overhead Press', state: ohpSets, setter: setOhpSets }].map((exo) => (
                  <div key={exo.label} className="grid grid-cols-12 gap-3 items-center">
                    <div className="col-span-4 text-xs font-medium text-zinc-300">{exo.label}</div>
                    <div className="col-span-4">
                      <div className="relative">
                        <input type="number" required min="1" value={exo.state.weight} onChange={(e) => exo.setter({ ...exo.state, weight: Number(e.target.value) })} className="block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none" />
                        <span className="absolute right-3 top-2 text-xs text-zinc-500">kg</span>
                      </div>
                    </div>
                    <div className="col-span-4">
                      <div className="relative">
                        <input type="number" required min="1" max="30" value={exo.state.reps} onChange={(e) => exo.setter({ ...exo.state, reps: Number(e.target.value) })} className="block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none" />
                        <span className="absolute right-3 top-2 text-xs text-zinc-500">reps</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400">Squat (kg)</label>
                  <input type="number" required min="1" max="500" value={squat} onChange={(e) => setSquat(Number(e.target.value))} className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400">Développé Couché (kg)</label>
                  <input type="number" required min="1" max="400" value={bench} onChange={(e) => setBench(Number(e.target.value))} className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400">Soulevé de Terre (kg)</label>
                  <input type="number" required min="1" max="600" value={deadlift} onChange={(e) => setDeadlift(Number(e.target.value))} className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400">Overhead Press (kg)</label>
                  <input type="number" required min="1" max="300" value={ohp} onChange={(e) => setOhp(Number(e.target.value))} className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none" />
                </div>
              </div>
            )}
          </div>

          {/* Recovery */}
          <div className="border-t border-zinc-850 pt-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-emerald-400">Facteurs de Récupération</h3>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400">Âge (années)</label>
                <input type="number" required min="14" max="100" value={age} onChange={(e) => setAge(Number(e.target.value))} className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400">Sommeil (heures / nuit)</label>
                <input type="number" required min="3" max="15" step="0.5" value={sleepHours} onChange={(e) => setSleepHours(Number(e.target.value))} className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400">Balance Calorique</label>
                <select value={caloricStatus} onChange={(e) => setCaloricStatus(e.target.value as "deficit" | "maintenance" | "surplus")} className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none">
                  <option value="deficit">Déficit (Sèche)</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="surplus">Surplus (Prise de masse)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400">Niveau de Stress</label>
                <select value={stressLevel} onChange={(e) => setStressLevel(e.target.value as "low" | "moderate" | "high")} className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none">
                  <option value="low">Faible</option>
                  <option value="moderate">Modéré</option>
                  <option value="high">Élevé (Cortisol)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-850 pt-5 flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-semibold text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors">Annuler</button>
            <button type="submit" className="rounded-lg bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 px-5 py-2 text-sm font-bold text-zinc-950 shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all cursor-pointer">Enregistrer</button>
          </div>
        </form>
      </div>
    </div>
  );
}
