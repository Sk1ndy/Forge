'use client';

import React, { useState, useEffect } from 'react';
import { loadCurrentWorkPlan, loadExercises, getLatestExerciseLog, saveExerciseLog } from '@/lib/supabase';
import { WeeklyBlueprint, Exercise, PlannedExercise } from '@forge/shared';
import { getProgressiveSuggestion, ProgressiveSuggestion } from '@/lib/progression';

export default function WorkPage() {
  const [blueprint, setBlueprint] = useState<WeeklyBlueprint | null>(null);
  const [exercisesLib, setExercisesLib] = useState<Exercise[]>([]);
  const [selectedDay, setSelectedDay] = useState<string>('lundi');
  const [loading, setLoading] = useState(true);

  // States pour les inputs de log
  const [inputs, setInputs] = useState<Record<string, { weight: number, reps: number, rpe: number }>>({});
  const [suggestions, setSuggestions] = useState<Record<string, ProgressiveSuggestion>>({});

  useEffect(() => {
    async function init() {
      const plan = loadCurrentWorkPlan();
      if (plan && plan.blueprint) {
        setBlueprint(plan.blueprint);
      }
      const lib = await loadExercises();
      setExercisesLib(lib);
      setLoading(false);
    }
    init();
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-emerald-500">Chargement...</div>;
  }

  if (!blueprint) {
    return (
      <div className="min-h-screen bg-black pt-24 px-4 text-center">
        <h1 className="text-3xl font-black text-white">Aucun Programme Actif</h1>
        <p className="text-zinc-500 mt-4">Veuillez d&apos;abord générer un Blueprint dans le mode FORGE et le sauvegarder.</p>
      </div>
    );
  }

  const daysOfWeek = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
  const dayPlan: PlannedExercise[] = blueprint[selectedDay as keyof typeof blueprint] || [];

  const handleSuggest = async (exerciseId: string, idx: number) => {
    const log = await getLatestExerciseLog(exerciseId);
    if (!log) {
      alert("Aucun log précédent trouvé pour cet exercice. Commencez avec une charge légère !");
      return;
    }
    const suggestion = getProgressiveSuggestion(exerciseId, log);
    setSuggestions(prev => ({ ...prev, [`${exerciseId}-${idx}`]: suggestion }));
    setInputs(prev => ({
      ...prev,
      [`${exerciseId}-${idx}`]: { weight: suggestion.suggestedWeight, reps: suggestion.suggestedReps, rpe: 8 }
    }));
  };

  const handleSave = async (exerciseId: string, idx: number) => {
    const currentInput = inputs[`${exerciseId}-${idx}`];
    if (!currentInput) {
      alert("Veuillez saisir un poids et des répétitions.");
      return;
    }

    // Envoi à Supabase
    // Note: session_id est généré par un createWorkoutSession global idéalement, 
    // mais pour simplifier ici on enverra sans session_id si non implémenté.
    const success = await saveExerciseLog({
      exercise_id: exerciseId,
      day: selectedDay as 'Lundi' | 'Mardi' | 'Mercredi' | 'Jeudi' | 'Vendredi' | 'Samedi' | 'Dimanche',
      set_index: 0, // Simplified: needs real set tracking later
      actual_reps: currentInput.reps,
      actual_weight: currentInput.weight,
      actual_rpe: currentInput.rpe,
      is_completed: true
    });

    if (success) {
      alert("Série enregistrée avec succès !");
    } else {
      alert("Erreur lors de l'enregistrement ou connexion Supabase non configurée.");
    }
  };

  const handleInputChange = (exerciseId: string, idx: number, field: string, value: number) => {
    setInputs(prev => ({
      ...prev,
      [`${exerciseId}-${idx}`]: {
        ...(prev[`${exerciseId}-${idx}`] || { weight: 0, reps: 0, rpe: 8 }),
        [field]: value
      }
    }));
  };

  return (
    <div className="min-h-screen bg-black pt-24 pb-20 px-4 text-white">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
          Work Mode
        </h1>
        <p className="text-zinc-400 mt-2">Mode Entraînement : Track tes performances et surcharge progressivement.</p>

        {/* Sélecteur de jour */}
        <div className="flex overflow-x-auto gap-2 py-6 scrollbar-hide">
          {daysOfWeek.map(day => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-4 py-2 rounded-xl text-sm font-bold capitalize whitespace-nowrap transition-all ${
                selectedDay === day ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800'
              }`}
            >
              {day}
            </button>
          ))}
        </div>

        {/* Exercices du jour */}
        <div className="space-y-6">
          {dayPlan.length === 0 ? (
            <div className="text-center p-10 bg-zinc-900/50 rounded-2xl border border-zinc-800">
              <span className="text-zinc-500 font-medium">Jour de repos programmé.</span>
            </div>
          ) : (
            dayPlan.map((plannedEx, idx) => {
              const exDef = exercisesLib.find(e => e.id === plannedEx.exerciseId);
              const inputKey = `${plannedEx.exerciseId}-${idx}`;
              const currentInput = inputs[inputKey] || { weight: plannedEx.sets[0]?.poids || 0, reps: plannedEx.sets[0]?.reps || 0, rpe: plannedEx.sets[0]?.rpe || 8 };
              const suggestion = suggestions[inputKey];

              return (
                <div key={idx} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white">{exDef?.nom || plannedEx.exerciseId}</h3>
                      <p className="text-xs text-zinc-500 uppercase tracking-wider mt-1">
                        Prévu : {plannedEx.sets.length} séries • RPE Cible {plannedEx.sets[0]?.rpe}
                      </p>
                    </div>
                  </div>

                  {suggestion && (
                    <div className="mb-4 p-3 bg-blue-900/20 border border-blue-800/50 rounded-xl text-sm">
                      <strong className="text-blue-400">💡 Suggestion IA :</strong> {suggestion.reasoning}
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Poids (kg)</label>
                      <input 
                        type="number" 
                        value={currentInput.weight} 
                        onChange={(e) => handleInputChange(plannedEx.exerciseId, idx, 'weight', Number(e.target.value))}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-center text-lg font-bold text-white focus:border-blue-500 outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Reps</label>
                      <input 
                        type="number" 
                        value={currentInput.reps} 
                        onChange={(e) => handleInputChange(plannedEx.exerciseId, idx, 'reps', Number(e.target.value))}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-center text-lg font-bold text-white focus:border-blue-500 outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">RPE</label>
                      <input 
                        type="number" 
                        value={currentInput.rpe} 
                        max="10"
                        min="1"
                        onChange={(e) => handleInputChange(plannedEx.exerciseId, idx, 'rpe', Number(e.target.value))}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-center text-lg font-bold text-white focus:border-blue-500 outline-none" 
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleSuggest(plannedEx.exerciseId, idx)}
                      className="flex-1 py-2 rounded-xl text-sm font-bold bg-zinc-800 text-blue-400 hover:bg-zinc-700 transition-colors"
                    >
                      Suggérer Charge
                    </button>
                    <button 
                      onClick={() => handleSave(plannedEx.exerciseId, idx)}
                      className="flex-1 py-2 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-500 transition-colors shadow-[0_0_10px_rgba(37,99,235,0.3)]"
                    >
                      Valider Série
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
