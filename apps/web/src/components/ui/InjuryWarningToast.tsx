import React, { useState, useEffect } from 'react';
import { m as motion, AnimatePresence } from 'framer-motion';
import { SimulationResult } from '@forge/shared';

export default function InjuryWarningToast({ simulation }: { simulation: SimulationResult }) {
  const [isVisible, setIsVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (simulation?.injuryPredictions && simulation.injuryPredictions.length > 0) {
      if (!dismissed) setIsVisible(true);
    } else {
      setIsVisible(false);
      setDismissed(false); // Reset if predictions go away
    }
  }, [simulation, dismissed]);

  const predictions = simulation?.injuryPredictions || [];

  return (
    <AnimatePresence>
      {isVisible && predictions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed bottom-6 right-6 z-[9999] w-80 bg-zinc-950 border border-red-500/50 shadow-[0_8px_32px_rgba(239,68,68,0.2)] rounded-xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-red-500 animate-pulse">⚠️</span>
              <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Alerte Biomécanique</span>
            </div>
            <button 
              onClick={() => { setIsVisible(false); setDismissed(true); }}
              className="text-zinc-500 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <div className="p-4 space-y-2">
            <p className="text-[11px] text-zinc-300">
              Le moteur a détecté un risque élevé de blessure basé sur le Ratio de Charge Aiguë/Chronique (ACWR).
            </p>
            <ul className="space-y-1.5 mt-2">
              {predictions.map((p, i) => (
                <li key={i} className="text-[10px] text-red-300 bg-red-950/30 p-2 rounded border border-red-500/10">
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
