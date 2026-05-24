'use client';

import React, { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, ReferenceLine,
  Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { SimulationResult, WeeklyBlueprint, MuscleId } from '@/lib/calculations';

// ─── Props ───────────────────────────────────────────────────────────────────
interface WeekDashboardProps {
  simulation: SimulationResult;
  blueprint: WeeklyBlueprint;
  toggledDays?: { [day: string]: boolean };
}

// ─── Constants ───────────────────────────────────────────────────────────────
const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const TIMELINE_MUSCLES: { id: MuscleId; label: string; color: string }[] = [
  { id: 'chest',        label: 'Pecto',   color: '#10b981' },
  { id: 'upperBack',    label: 'Dos',     color: '#3b82f6' },
  { id: 'quadriceps',   label: 'Quads',   color: '#8b5cf6' },
  { id: 'hamstring',    label: 'Ischios', color: '#f59e0b' },
  { id: 'frontDeltoid', label: 'Épaules', color: '#ec4899' },
];

const GRAND_GROUPS: { id: MuscleId; label: string }[] = [
  { id: 'chest',        label: 'Pectoraux'        },
  { id: 'upperBack',    label: 'Dos'              },
  { id: 'frontDeltoid', label: 'Épaules'          },
  { id: 'biceps',       label: 'Biceps'           },
  { id: 'triceps',      label: 'Triceps'          },
  { id: 'quadriceps',   label: 'Quadriceps'       },
  { id: 'hamstring',    label: 'Ischios/Fessiers' },
];

// ─── Utilities ────────────────────────────────────────────────────────────────
function calculateCycleQualityScore(sim: SimulationResult): { score: number; grade: string; critique: string } {
  let score = 100;
  const penalties: string[] = [];

  const musclesList = Object.entries(sim.muscles)
    .filter(([_, m]) => m !== undefined)
    .map(([id, m]) => ({ id: id as string, ...m! }));

  // 1. Fréquence : Chaque muscle majeur doit avoir un score INOL > 0.5
  const underStimulated = musclesList.filter(m => m.inol < 0.5 && GRAND_GROUPS.some(g => g.id === m.id));
  if (underStimulated.length > 0) {
    score -= underStimulated.length * 10;
    penalties.push(`Fréquence insuffisante (< 0.5 INOL) pour : ${underStimulated.map(m => m.name).join(', ')}.`);
  }

  // 2. Purge de fatigue : La fatigue doit être < 0.2 au Jour 7 pour tous les muscles
  // Dans le modèle, la propriété 'fatigueHistory' contient la fatigue pour chaque jour. Le jour 7 est l'index 6.
  const overFatigued = musclesList.filter(m => (m.fatigueHistory?.[6] || 0) > 0.2);
  if (overFatigued.length > 0) {
    score -= overFatigued.length * 8;
    penalties.push(`Fatigue résiduelle élevée au Jour 7 (pas de purge complète) pour : ${overFatigued.map(m => m.name).join(', ')}.`);
  }

  // 3. Diversité : Ratio PPL équilibré (pas de groupe à 0 sets)
  if (sim.pushPullLegsRatio.pull === 0 && sim.pushPullLegsRatio.push > 0) {
    score -= 25;
    penalties.push("Asymétrie critique : Aucun exercice de Tirage.");
  } else if (sim.pushPullLegsRatio.pull > 0 && sim.pushPullLegsRatio.push > sim.pushPullLegsRatio.pull * 1.5) {
    score -= 15;
    penalties.push("Déséquilibre postural : Poussée dominante.");
  }

  // Hard caps de sécurité physique (SNC / Lésionnel)
  const redMuscles = musclesList.filter(m => m.color === 'red');
  if (redMuscles.length > 0) {
    score = Math.min(score, 40);
    penalties.push(`DANGER : Risque lésionnel détecté sur ${redMuscles.map(m => m.name).join(', ')}.`);
  }

  if (sim.cnsFailure) {
    score = Math.min(score, 20);
    penalties.push("DANGER : Échec du Système Nerveux Central (Burnout).");
  }

  // Normalisation
  score = Math.max(0, Math.min(100, Math.round(score)));

  let grade = 'F';
  if (score >= 90) grade = 'S';
  else if (score >= 80) grade = 'A';
  else if (score >= 70) grade = 'B';
  else if (score >= 50) grade = 'C';
  else if (score >= 40) grade = 'D';

  return { 
    score, 
    grade, 
    critique: penalties.length > 0 ? penalties.join(' ') : "Structure de cycle optimale : fréquence, purge et diversité parfaites." 
  };
}

interface GradeInfo { label: string; color: string; glow: string; description: string }
function getGradeInfo(grade: string): GradeInfo {
  if (grade === 'S') return { label: 'S', color: '#10b981', glow: 'rgba(16,185,129,0.5)',  description: 'Programme Élite'  };
  if (grade === 'A') return { label: 'A', color: '#14b8a6', glow: 'rgba(20,184,166,0.45)', description: 'Excellent'        };
  if (grade === 'B') return { label: 'B', color: '#3b82f6', glow: 'rgba(59,130,246,0.45)', description: 'Très Bon'         };
  if (grade === 'C') return { label: 'C', color: '#f59e0b', glow: 'rgba(245,158,11,0.45)', description: 'Correct'          };
  if (grade === 'D') return { label: 'D', color: '#f97316', glow: 'rgba(249,115,22,0.4)',  description: 'À Améliorer'      };
  return             { label: 'F', color: '#ef4444', glow: 'rgba(239,68,68,0.5)',   description: 'Programme Risqué' };
}

function toReadinessPct(readiness: number): number {
  // readiness = fitness - fatigue. Ranges ~ -3 to +1.5
  return Math.round(Math.max(0, Math.min(100, ((readiness + 2.5) / 4) * 100)));
}

function generatePrescriptions(simulation: SimulationResult): string[] {
  const recs: string[] = [];
  const macro = simulation.weeklyMacro;
  const sets = macro?.weeklyEffectiveSets ?? {};

  const NAMES: Record<string, string> = {
    chest: 'Pectoraux', upperBack: 'Dos', frontDeltoid: 'Épaules',
    biceps: 'Biceps', triceps: 'Triceps', quadriceps: 'Quadriceps', hamstring: 'Ischios/Fessiers',
  };

  // Under-stimulated muscles
  for (const [id, name] of Object.entries(NAMES)) {
    const v = (sets[id] as number | undefined) ?? 0;
    if (v < 4 && recs.length < 2) {
      recs.push(`💪 ${name} sous-stimulé (${v} sér.) — Ajoutez 2–3 séries ciblées pour franchir le seuil d'adaptation hypertrophique.`);
    }
  }

  // Trauma recovery
  const traumas = simulation.weeklyTraumas ?? [];
  if (traumas.length > 0 && recs.length < 3) {
    const t = traumas[0];
    const dayName = DAY_LABELS[t.dayIndex] ?? '';
    recs.push(`🔴 ${t.muscleName} : Pic traumatique ${dayName} (INOL ${t.peakInol}) — Réduisez l'intensité de 20% ou passez sur machine au prochain cycle.`);
  }

  // CNS
  if (simulation.cnsFailure && recs.length < 3) {
    recs.push('🧠 SNC Saturé — Remplacez un exercice Tier 1 (Squat / Soulevé de terre) par son équivalent machine pour réduire la charge nerveuse axiale.');
  } else if (simulation.sncPercentage > 80 && recs.length < 3) {
    recs.push("⚡ Charge nerveuse élevée — Évitez d'ajouter des exercices polyarticulaires lourds. Priorité : 8–9h de sommeil cette semaine.");
  }

  // Push/Pull imbalance
  const push = macro?.pushPullRatio?.push ?? 50;
  if (push > 60 && recs.length < 3) {
    recs.push(`⚖️ Déséquilibre postural (${push}% poussée) — Ajoutez des Rowing ou des Tractions pour protéger la coiffe des rotateurs.`);
  } else if (push < 38 && recs.length < 3) {
    recs.push(`⚖️ Fort volume de tirage (${100 - push}%) — Assurez-vous que pectoraux et triceps reçoivent un volume adéquat.`);
  }

  if (recs.length === 0) {
    recs.push("✅ Programme optimal — Volume équilibré, SNC stable, aucun traumatisme. Maintenez cette structure pour votre prochain cycle de 4 semaines.");
  }

  return recs.slice(0, 3);
}

// ─── Custom Recharts Tooltip ──────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }: { active?: boolean; payload?: { color: string; name: string; value: number }[]; label?: string }) => {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div style={{ background: 'rgba(9,9,11,0.97)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 12px', minWidth: 140, boxShadow: '0 8px 24px rgba(0,0,0,0.7)' }}>
      <p style={{ fontSize: 11, fontWeight: 800, color: '#a1a1aa', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 11, marginBottom: 2 }}>
          <span style={{ color: entry.color, fontWeight: 600 }}>{entry.name}</span>
          <span style={{ color: entry.value > 2.5 ? '#ef4444' : entry.value > 1.5 ? '#f59e0b' : '#a1a1aa', fontFamily: 'monospace', fontWeight: 700 }}>
            {entry.value.toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function WeekDashboard({ simulation, blueprint, toggledDays }: WeekDashboardProps) {
  const { score: programmeScore, grade: gradeLetter, critique } = useMemo(() => calculateCycleQualityScore(simulation), [simulation]);
  const grade = useMemo(() => getGradeInfo(gradeLetter), [gradeLetter]);
  const prescriptions = useMemo(() => generatePrescriptions(simulation), [simulation]);

  // Weekly tonnage (Σ series × reps × poids)
  const weeklyTonnage = useMemo(() => {
    let total = 0;
    Object.entries(blueprint).forEach(([day, dayExercises]) => {
      if (toggledDays && toggledDays[day] === false) return;
      
      dayExercises.forEach(ex => {
        if (!ex.active) return;
        ex.sets.forEach(set => {
          if (!set.active) return;
          total += set.series * set.reps * set.poids;
        });
      });
    });
    return total;
  }, [blueprint, toggledDays]);

  // Timeline data for Recharts
  const timelineData = useMemo(() =>
    DAY_LABELS.map((day, i) => {
      const entry: Record<string, number | string> = { day };
      TIMELINE_MUSCLES.forEach(({ id, label }) => {
        entry[label] = parseFloat((simulation.muscles[id]?.fatigueHistory?.[i] ?? 0).toFixed(3));
      });
      return entry;
    }),
    [simulation]
  );

  const macro = simulation.weeklyMacro;
  const pushPct = macro?.pushPullRatio?.push ?? 50;
  const pullPct = macro?.pushPullRatio?.pull ?? 50;
  const isPushHeavy = pushPct > 50;
  const isBalanced = pushPct >= 40 && pushPct <= 50;
  const sncPct = simulation.sncPercentage;
  const axial = macro?.axialSncLoad ?? 0;



  const axialColor = axial > 80 ? '#ef4444' : axial > 55 ? '#f59e0b' : '#10b981';

  const totalSets = Object.values(macro?.weeklyEffectiveSets ?? {}).reduce((sum, v) => sum + (v as number), 0);
  const mrvSaturation = Math.min(100, Math.round((totalSets / 80) * 100));
  const mrvColor = mrvSaturation >= 90 ? '#ef4444' : mrvSaturation >= 60 ? '#10b981' : '#3b82f6';

  const cardBase = 'rounded-2xl border border-zinc-800/60 bg-zinc-900/40 backdrop-blur-sm p-4';

  return (
    <div className="h-full flex flex-col gap-4 py-1 pr-1">

      {/* ── ROW 1 : Hero KPIs ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4 shrink-0">

        {/* Programme Score */}
        <div className={`${cardBase} flex flex-col justify-center gap-3`} style={{ borderColor: `${grade.color}30`, background: `linear-gradient(135deg, rgba(9,9,11,0.9) 0%, ${grade.color}08 100%)` }}>
          <div className="flex items-center gap-4">
            <div style={{ width: 56, height: 56, borderRadius: 14, border: `2px solid ${grade.color}50`, background: `${grade.color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 20px ${grade.glow}`, flexShrink: 0 }}>
              <span style={{ fontSize: 28, fontWeight: 900, color: grade.color, fontFamily: 'monospace', lineHeight: 1 }}>{grade.label}</span>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-0.5">Score Programme</p>
              <p style={{ color: grade.color }} className="text-2xl font-black font-mono leading-none">{programmeScore}<span className="text-sm text-zinc-600 font-normal">/100</span></p>
              <p style={{ color: grade.color }} className="text-[10px] font-semibold mt-0.5 opacity-80">{grade.description}</p>
            </div>
          </div>
          <div className="pt-2 border-t border-zinc-800/60 mt-auto">
            <p className="text-[9px] leading-relaxed" style={{ color: grade.color }}>
              {critique}
            </p>
          </div>
        </div>

        {/* Saturation du Volume Hebdomadaire */}
        <div className={cardBase}>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-3">📈 Saturation du Volume (MRV)</p>
          <div className="flex items-end justify-between mb-2">
            <span style={{ color: mrvColor }} className="text-3xl font-black font-mono leading-none">{mrvSaturation}<span className="text-base text-zinc-600 font-normal">%</span></span>
            <span className="text-[10px] text-zinc-600 mb-1">
              {mrvSaturation >= 90 ? 'Risqué (MRV)' : mrvSaturation >= 60 ? 'Optimal' : 'Sous-stimulé'}
            </span>
          </div>
          <div className="h-2 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${mrvSaturation}%`, backgroundColor: mrvColor, boxShadow: `0 0 8px ${mrvColor}60` }} />
          </div>
          <p className="text-[10px] text-zinc-600 mt-2 leading-relaxed">
            Progression vers votre Volume Récupérable Maximal (estimé à 80 séries/semaine). {mrvSaturation < 90 ? "Espace disponible pour des exercices." : "Volume plein, risque de surentraînement."}
          </p>
        </div>

        {/* Volume de Travail du Cycle */}
        <div className={cardBase}>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-3">🏋️ Volume de Travail du Cycle</p>
          <p className="text-3xl font-black font-mono text-zinc-100 leading-none mb-1">
            {weeklyTonnage >= 1000 ? (weeklyTonnage / 1000).toFixed(1) : weeklyTonnage}
            <span className="text-base text-zinc-600 font-normal">{weeklyTonnage >= 1000 ? ' t' : ' kg'}</span>
          </p>
          <p className="text-[10px] text-zinc-600 leading-relaxed mt-2 font-medium">
            {weeklyTonnage > 40000 
              ? "Volume exceptionnel pour un cycle de 7 jours, réservé aux athlètes avancés." 
              : weeklyTonnage > 25000 
              ? "Vous êtes dans la moyenne haute pour ce cycle de 7 jours, excellent volume de base." 
              : weeklyTonnage > 15000 
              ? "Volume modéré, parfait pour une reprise ou un maintien."
              : "Volume léger, privilégiez l'augmentation progressive de la charge."}
          </p>
          {weeklyTonnage === 0 && (
            <p className="text-[10px] text-zinc-700 italic mt-1">Ajoutez des exercices avec des poids pour voir cette métrique.</p>
          )}
        </div>
      </div>

      {/* ── ROW 2 : Volume + Timeline ──────────────────────────────────────── */}
      <div className="grid grid-cols-5 gap-4 shrink-0">

        {/* Volume bars — 2/5 */}
        <div className={`col-span-2 ${cardBase}`}>
          <h5 className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-3">📊 Volume Hebdo (Séries)</h5>
          <div className="space-y-2">
            {GRAND_GROUPS.map(({ id, label }) => {
              const value = (macro?.weeklyEffectiveSets?.[id] as number | undefined) ?? 0;
              const pct = Math.min(100, (value / 20) * 100);
              const barColor = value >= 10 && value <= 20 ? '#10b981' : value > 20 ? '#ef4444' : value > 0 ? '#3b82f6' : '#3f3f46';
              const textColor = value >= 10 && value <= 20 ? 'text-emerald-400' : value > 20 ? 'text-red-400' : value > 0 ? 'text-sky-400' : 'text-zinc-600';
              return (
                <div key={id}>
                  <div className="flex justify-between text-[10px] mb-0.5">
                    <span className="text-zinc-400 font-medium">{label}</span>
                    <span className={`font-bold font-mono ${textColor}`}>{value}<span className="text-zinc-700">/20</span></span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: barColor, boxShadow: value >= 10 ? `0 0 4px ${barColor}80` : 'none' }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 pt-2.5 border-t border-zinc-900 flex justify-between text-[9px] text-zinc-600">
            <span>◼ &lt;10 sér. → Maintien</span>
            <span className="text-emerald-700">◼ 10–20 → Croissance</span>
            <span className="text-red-900">◼ &gt;20 → Excessif</span>
          </div>
        </div>

        {/* Timeline 7J — 3/5 */}
        <div className={`col-span-3 ${cardBase}`}>
          <div className="flex items-center justify-between mb-3">
            <h5 className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">📈 Timeline Fatigue sur 7 Jours</h5>
            <div className="flex gap-3">
              {TIMELINE_MUSCLES.map(({ label, color }) => (
                <span key={label} className="text-[9px] font-semibold flex items-center gap-1" style={{ color }}>
                  <span style={{ display: 'inline-block', width: 10, height: 2, backgroundColor: color, borderRadius: 1 }} />
                  {label}
                </span>
              ))}
            </div>
          </div>
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#71717a', fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#52525b' }} axisLine={false} tickLine={false} domain={[0, 'auto']} />
                <ReferenceLine y={2.5} stroke="#ef444460" strokeDasharray="4 3" strokeWidth={1.5} label={{ value: 'Trauma', position: 'insideRight', fill: '#ef4444', fontSize: 9 }} />
                <ReferenceLine y={1.5} stroke="#f59e0b40" strokeDasharray="4 3" strokeWidth={1} />
                <Tooltip content={<ChartTooltip />} />
                {TIMELINE_MUSCLES.map(({ label, color }) => (
                  <Line
                    key={label}
                    type="monotone"
                    dataKey={label}
                    stroke={color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0, fill: color }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[9px] text-zinc-700 mt-1">Ligne pointillée rouge = seuil de traumatisme (INOL 2.5). Ligne orange = seuil de surcharge (1.5).</p>
        </div>
      </div>

      {/* ── ROW 3 : Readiness + Balance + SNC ─────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4 shrink-0">

        {/* Readiness J+1 */}
        <div className={cardBase}>
          <h5 className="text-[10px] font-bold text-violet-400 uppercase tracking-wider mb-3">🟢 Readiness J+1 (Capacité de Performance)</h5>
          <div className="space-y-2">
            {GRAND_GROUPS.slice(0, 5).map(({ id, label }) => {
              const muscle = simulation.muscles[id];
              const pct = muscle ? toReadinessPct(muscle.readiness) : 0;
              const color = pct >= 65 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444';
              return (
                <div key={id}>
                  <div className="flex justify-between text-[9px] mb-0.5">
                    <span className="text-zinc-500">{label}</span>
                    <span className="font-mono font-bold" style={{ color }}>{pct}%</span>
                  </div>
                  <div className="h-1 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-900/60">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[9px] text-zinc-700 mt-2.5 pt-2 border-t border-zinc-900">Modèle de Banister (Fitness - Fatigue). Un muscle non entraîné a un score bas (Désentraînement). Un muscle reposé après stimulus approche les 100% (Surcompensation).</p>
        </div>

        {/* Balance Posturale */}
        <div className={cardBase}>
          <h5 className="text-[10px] font-bold text-sky-400 uppercase tracking-wider mb-3">⚖️ Balance Posturale Haut du Corps</h5>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-400 font-semibold">Poussée (Push)</span>
              <span className="text-sky-400 font-black font-mono">{pushPct}%</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-400 font-semibold">Tirage (Pull)</span>
              <span className="text-amber-400 font-black font-mono">{pullPct}%</span>
            </div>
            <div className="h-3 w-full bg-zinc-950 border border-zinc-900 rounded-full overflow-hidden flex">
              <div className="h-full bg-sky-500 transition-all duration-700" style={{ width: `${pushPct}%` }} />
              <div className="h-full bg-amber-500 transition-all duration-700" style={{ width: `${pullPct}%` }} />
            </div>
            <div className={`text-[10px] rounded-lg border p-2 leading-relaxed`} style={{
              borderColor: isBalanced ? 'rgba(16,185,129,0.25)' : isPushHeavy ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)',
              backgroundColor: isBalanced ? 'rgba(16,185,129,0.05)' : isPushHeavy ? 'rgba(239,68,68,0.05)' : 'rgba(245,158,11,0.05)',
            }}>
              {isBalanced
                ? <span className="text-emerald-400 font-semibold">✅ Équilibre optimal. Coiffe des rotateurs protégée.</span>
                : isPushHeavy
                ? <span className="text-red-400 font-semibold">⚠️ Dominance de poussée. Risque de déséquilibre antérieur.</span>
                : <span className="text-amber-400 font-semibold">💡 Légère dominance de tirage. Optimal pour la posture.</span>
              }
            </div>
            <div className="pt-2 border-t border-zinc-900">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-zinc-600">Part Jambes (total)</span>
                <span className="text-violet-400 font-bold font-mono">{simulation.pushPullLegsRatio.legs}%</span>
              </div>
              <div className="mt-1 h-1 w-full bg-zinc-950 rounded-full overflow-hidden">
                <div className="h-full bg-violet-500 rounded-full transition-all duration-700" style={{ width: `${Math.min(100, simulation.pushPullLegsRatio.legs)}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* SNC + Traumatismes */}
        <div className={cardBase}>
          <h5 className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-3">🧠 SNC & Traumatismes Aigus</h5>
          <div className="space-y-2.5 mb-3">
            <div className="flex justify-between items-center text-xs relative group w-full">
              <div className="flex items-center gap-1.5 cursor-help">
                <span className="text-zinc-400 font-semibold">Charge Axiale (Tier 1)</span>
                <span className="text-zinc-500 flex items-center justify-center w-3.5 h-3.5 rounded-full border border-zinc-700 text-[9px] hover:bg-zinc-800 hover:text-zinc-300 transition-colors">?</span>
              </div>
              <span className="font-black font-mono" style={{ color: axialColor }}>{axial}%</span>
              
              {/* Custom Tooltip */}
              <div className="absolute bottom-full left-0 mb-2 w-56 p-2.5 bg-[#09090b]/95 border border-white/10 rounded-xl text-[10px] text-zinc-300 shadow-[0_12px_32px_rgba(0,0,0,0.8)] backdrop-blur-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-[9999]">
                La Charge Axiale représente le stress imposé sur ta colonne vertébrale par les exercices lourds (ex: Squat, Soulevé de Terre). Trop de charge axiale fatigue ton système nerveux et augmente le risque de blessure au dos.
              </div>
            </div>
            <div className="h-2.5 w-full bg-zinc-950 border border-zinc-900 rounded-full overflow-hidden p-0.5">
              <div className={`h-full rounded-full transition-all duration-700 ${axial > 80 ? 'animate-pulse' : ''}`}
                style={{ width: `${axial}%`, backgroundColor: axialColor, boxShadow: axial > 80 ? `0 0 8px ${axialColor}80` : 'none' }} />
            </div>
            <div className="flex justify-between items-center text-xs relative group w-full">
              <div className="flex items-center gap-1.5 cursor-help">
                <span className="text-zinc-400 font-semibold">Saturation SNC</span>
                <span className="text-zinc-500 flex items-center justify-center w-3.5 h-3.5 rounded-full border border-zinc-700 text-[9px] hover:bg-zinc-800 hover:text-zinc-300 transition-colors">?</span>
              </div>
              <span className={`font-black font-mono ${simulation.cnsFailure ? 'text-red-400 animate-pulse' : 'text-zinc-300'}`}>{sncPct}%</span>
              
              {/* Custom Tooltip */}
              <div className="absolute bottom-full left-0 mb-2 w-56 p-2.5 bg-[#09090b]/95 border border-white/10 rounded-xl text-[10px] text-zinc-300 shadow-[0_12px_32px_rgba(0,0,0,0.8)] backdrop-blur-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-[9999]">
                Le Système Nerveux Central (SNC) est la &apos;batterie&apos; qui envoie le signal à tes muscles. S&apos;il est saturé (au-delà de 80%), tu perdras de la force globale même si tes muscles sont reposés.
              </div>
            </div>
            <div className="h-2 w-full bg-zinc-950 border border-zinc-900 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-700 ${sncPct > 100 ? 'animate-pulse' : ''}`}
                style={{ width: `${Math.min(100, sncPct)}%`, backgroundColor: sncPct > 100 ? '#ef4444' : sncPct > 80 ? '#f59e0b' : '#10b981' }} />
            </div>
          </div>

          <div className="pt-2.5 border-t border-zinc-900">
            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Statut des Traumatismes</p>
            {simulation.weeklyTraumas && simulation.weeklyTraumas.length > 0 ? (
              <ul className="space-y-1">
                {simulation.weeklyTraumas.slice(0, 3).map((t, i) => (
                  <li key={i} className="flex items-start gap-1.5 bg-red-950/20 border border-red-500/20 rounded-lg px-2 py-1">
                    <span className="text-red-400 text-[10px] shrink-0 mt-px">⚡</span>
                    <span className="text-[10px] text-red-300 font-semibold">{t.muscleName}</span>
                    <span className="text-[10px] text-zinc-600 ml-auto font-mono shrink-0">{t.peakInol}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[10px] text-emerald-600">✅ Aucun traumatisme musculaire cette semaine.</p>
            )}
          </div>
        </div>
      </div>

      {/* ── ROW 4 : Heatmap 7J × 7 Muscles ─────────────────────────────────── */}
      <div className={`${cardBase} shrink-0`}>
        <h5 className="text-[10px] font-bold text-orange-400 uppercase tracking-wider mb-3">🔥 Heatmap Temporelle d&apos;Intensité (INOL)</h5>
        <div className="grid grid-cols-[auto_1fr] gap-3">
          {/* Labels muscles */}
          <div className="flex flex-col gap-[2px] pr-3 border-r border-zinc-800">
            {/* Header row spacer */}
            <div className="h-4"></div>
            {GRAND_GROUPS.map(({ id, label }) => (
              <div key={id} className="h-6 flex items-center text-[9px] text-zinc-400 font-medium whitespace-nowrap">
                {label}
              </div>
            ))}
          </div>
          {/* Grid jours */}
          <div className="flex flex-col gap-[2px]">
            {/* Header jours */}
            <div className="grid grid-cols-7 gap-[2px]">
              {DAY_LABELS.map(day => (
                <div key={day} className="h-4 flex items-center justify-center text-[9px] text-zinc-500 font-bold uppercase">
                  {day}
                </div>
              ))}
            </div>
            {/* Cells */}
            {GRAND_GROUPS.map(({ id }) => {
              const history = simulation.muscles[id]?.fatigueHistory ?? [0,0,0,0,0,0,0];
              return (
                <div key={id} className="grid grid-cols-7 gap-[2px]">
                  {history.map((val, i) => {
                    let bg = '#18181b'; // zinc-900
                    let opacity = 0.3;
                    if (val > 2.5) { bg = '#ef4444'; opacity = 0.9; }
                    else if (val > 1.5) { bg = '#f59e0b'; opacity = 0.8; }
                    else if (val > 0.5) { bg = '#10b981'; opacity = 0.7; }
                    else if (val > 0.1) { bg = '#3b82f6'; opacity = 0.5; }
                    return (
                      <div 
                        key={i} 
                        className="h-6 rounded-md flex items-center justify-center transition-opacity hover:opacity-100"
                        style={{ backgroundColor: bg, opacity }}
                        title={`INOL: ${val.toFixed(2)}`}
                      >
                        {val > 0.1 && <span className="text-[8px] font-mono text-white/90" style={{ mixBlendMode: 'overlay' }}>{val.toFixed(1)}</span>}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── ROW 5 : Prescriptions ──────────────────────────────────────────── */}
      <div className={`${cardBase} shrink-0`} style={{ borderColor: 'rgba(139,92,246,0.2)', background: 'linear-gradient(135deg, rgba(9,9,11,0.9) 0%, rgba(139,92,246,0.04) 100%)' }}>
        <h5 className="text-[10px] font-bold text-violet-400 uppercase tracking-wider flex items-center gap-2 mb-3">
          <span>🎯</span> Prescriptions Intelligentes — Semaine Prochaine
        </h5>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {prescriptions.map((p, i) => (
            <div key={i} className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-3 flex items-start gap-2.5">
              <span className="text-violet-500 font-black text-sm shrink-0 mt-px">{i + 1}</span>
              <p className="text-[11px] text-zinc-300 leading-relaxed">{p}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
