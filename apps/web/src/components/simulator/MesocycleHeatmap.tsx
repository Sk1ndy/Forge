import React from 'react';
import { SimulationResult } from '@forge/shared';
import { m as motion } from 'framer-motion';

interface MesocycleHeatmapProps {
  simulation: SimulationResult;
}

const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export default function MesocycleHeatmap({ simulation }: MesocycleHeatmapProps) {
  const { weeklySystemicInol } = simulation;
  if (!weeklySystemicInol) return null;

  const weeks = Object.keys(weeklySystemicInol).map(Number).sort((a, b) => a - b);
  if (weeks.length === 0) return null;

  const getHeatmapColor = (load: number) => {
    if (load === 0) return 'bg-zinc-900/50 border-zinc-800/50';
    if (load < 1.0) return 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400';
    if (load < 2.5) return 'bg-amber-500/20 border-amber-500/30 text-amber-400';
    return 'bg-red-500/20 border-red-500/30 text-red-400';
  };

  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 backdrop-blur-sm p-4 w-full">
      <h5 className="text-[10px] font-bold text-sky-400 uppercase tracking-wider mb-3">📅 Calendrier Mésocycle (Charge Systémique)</h5>
      
      <div className="w-full overflow-x-auto">
        <div className="min-w-[400px]">
          {/* Header jours */}
          <div className="grid grid-cols-8 gap-2 mb-2">
            <div className="text-[9px] font-bold text-zinc-500 flex items-center">SEMAINE</div>
            {DAY_LABELS.map(day => (
              <div key={day} className="text-[9px] font-bold text-zinc-500 text-center uppercase">{day}</div>
            ))}
          </div>

          {/* Grille des semaines */}
          <div className="space-y-2">
            {weeks.map((week, idx) => {
              const daysLoad = weeklySystemicInol[week] || [0,0,0,0,0,0,0];
              return (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1, duration: 0.3 }}
                  key={week} 
                  className="grid grid-cols-8 gap-2"
                >
                  <div className="text-[10px] text-zinc-400 font-bold flex items-center">
                    S{week}
                  </div>
                  {daysLoad.map((load, dayIdx) => (
                    <div 
                      key={dayIdx} 
                      className={`h-8 rounded-lg border flex items-center justify-center transition-colors ${getHeatmapColor(load)}`}
                      title={`Charge Systémique (INOL cumulé) : ${load.toFixed(2)}`}
                    >
                      {load > 0 ? (
                        <span className="text-[9px] font-mono font-bold">{load.toFixed(1)}</span>
                      ) : (
                        <span className="text-[10px] text-zinc-700/50">-</span>
                      )}
                    </div>
                  ))}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
      
      <div className="mt-4 pt-3 border-t border-zinc-900 flex justify-between text-[9px] text-zinc-600">
        <span>Gris : Repos</span>
        <span className="text-emerald-700">Vert : Maintien / Léger</span>
        <span className="text-amber-700">Orange : Optimal / Lourd</span>
        <span className="text-red-900">Rouge : Surcharge Extreme</span>
      </div>
    </div>
  );
}
