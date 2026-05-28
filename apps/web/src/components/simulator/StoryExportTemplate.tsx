import React, { forwardRef } from 'react';
import { SimulationResult } from '@forge/shared';

interface StoryExportTemplateProps {
  simulation: SimulationResult;
  username?: string;
}

const StoryExportTemplate = forwardRef<HTMLDivElement, StoryExportTemplateProps>(
  ({ simulation, username = 'AstroLifter' }, ref) => {
    
    // Calculs rapides
    const totalSets = Object.values(simulation.weeklyMacro?.weeklyEffectiveSets ?? {}).reduce((sum, v) => sum + (v as number), 0);
    // Tonnage total approximatif basé sur systemicInol par exemple, ou récupéré du blueprint
    const tonnage = Math.round(totalSets * 12 * 60); // Fake tonnage pour la demo
    
    return (
      <div 
        ref={ref}
        className="w-[1080px] h-[1920px] bg-zinc-950 flex flex-col relative overflow-hidden font-sans text-white"
        style={{
          background: 'radial-gradient(circle at 50% 30%, rgba(16, 185, 129, 0.15) 0%, rgba(9, 9, 11, 1) 70%)',
        }}
      >
        {/* Background Noise effect */}
        <div className="absolute inset-0 opacity-20 mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>

        {/* Content Wrapper */}
        <div className="relative z-10 flex flex-col h-full p-16">
          
          {/* Header */}
          <div className="flex items-center gap-6 mt-12 mb-24">
            <div className="w-32 h-32 rounded-full bg-emerald-500/20 border-4 border-emerald-500/50 flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.3)]">
              <span className="text-6xl">🏋️‍♂️</span>
            </div>
            <div>
              <h1 className="text-7xl font-black tracking-tight text-white uppercase">{username}</h1>
              <p className="text-3xl text-emerald-400 font-bold uppercase tracking-widest mt-2">Mésocycle Achevé 🧬</p>
            </div>
          </div>

          {/* Big Numbers */}
          <div className="grid grid-cols-2 gap-8 mb-20">
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-[40px] p-12 backdrop-blur-md">
              <p className="text-3xl text-zinc-400 font-bold uppercase tracking-wider mb-4">Tonnage Total</p>
              <p className="text-8xl font-black text-emerald-400 font-mono" style={{ textShadow: '0 0 40px rgba(16,185,129,0.4)' }}>
                {(tonnage / 1000).toFixed(1)}k <span className="text-5xl text-zinc-500 font-bold">kg</span>
              </p>
            </div>
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-[40px] p-12 backdrop-blur-md">
              <p className="text-3xl text-zinc-400 font-bold uppercase tracking-wider mb-4">Séries Effectives</p>
              <p className="text-8xl font-black text-white font-mono" style={{ textShadow: '0 0 40px rgba(255,255,255,0.2)' }}>
                {totalSets}
              </p>
            </div>
          </div>

          {/* Visual Showcase (Heatmap / Muscles) */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-[40px] p-12 backdrop-blur-md flex-1 mb-24 flex flex-col">
            <h2 className="text-4xl font-bold text-zinc-300 uppercase tracking-widest mb-10 text-center">Répartition de la Fatigue</h2>
            <div className="flex-1 flex flex-col justify-center gap-6">
              {['Pectoraux', 'Dos', 'Quadriceps', 'Ischio-jambiers', 'Épaules'].map((muscle, i) => (
                <div key={muscle} className="flex items-center gap-6">
                  <span className="text-3xl font-bold text-zinc-400 w-64">{muscle}</span>
                  <div className="flex-1 h-12 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                    <div 
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ 
                        width: `${Math.max(20, Math.random() * 80 + 20)}%`,
                        boxShadow: '0 0 20px rgba(16,185,129,0.5)'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer (Acquisition) */}
          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-zinc-800 rounded-2xl flex items-center justify-center p-3">
                <svg className="w-full h-full text-zinc-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-zinc-400">Scannez pour rejoindre</span>
                <span className="text-4xl font-black text-white tracking-widest mt-1">FORGE.APP</span>
              </div>
            </div>
            
            {/* Fake QR Code */}
            <div className="w-32 h-32 bg-white rounded-xl p-3 flex items-center justify-center">
              <div className="w-full h-full bg-zinc-950" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000), repeating-linear-gradient(45deg, #000 25%, #fff 25%, #fff 75%, #000 75%, #000)', backgroundPosition: '0 0, 8px 8px', backgroundSize: '16px 16px' }}></div>
            </div>
          </div>
          
        </div>
      </div>
    );
  }
);

StoryExportTemplate.displayName = 'StoryExportTemplate';
export default StoryExportTemplate;
