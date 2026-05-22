import React, { useState, useRef } from 'react';
import { SimulationResult, MuscleStatus } from '@/lib/calculations';

interface HumanAvatarProps {
  simulation: SimulationResult;
}

export default function HumanAvatar({ simulation }: HumanAvatarProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = (id: string, e: React.MouseEvent) => {
    setHoveredId(id);
    updateTooltipPos(e);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    updateTooltipPos(e);
  };

  const handleMouseLeave = () => {
    setHoveredId(null);
    setTooltipPos(null);
  };

  const updateTooltipPos = (e: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      // Positionner le tooltip au-dessus et à droite de la souris
      setTooltipPos({
        x: e.clientX - rect.left + 15,
        y: e.clientY - rect.top - 15
      });
    }
  };

  const muscles = simulation.muscles;
  const hoveredMuscle = hoveredId ? muscles[hoveredId] : null;

  // Remplissage SVG par couleur
  const getColorClass = (color: MuscleStatus['color'], isHovered: boolean) => {
    if (simulation.cnsFailure) {
      return 'fill-zinc-800 stroke-zinc-900 opacity-60 transition-colors duration-300';
    }
    
    switch (color) {
      case 'green':
        return `${
          isHovered ? 'fill-emerald-400 stroke-emerald-300' : 'fill-emerald-500 stroke-emerald-600'
        } transition-all duration-300 cursor-help filter drop-shadow-[0_0_2px_rgba(16,185,129,0.3)]`;
      case 'orange':
        return `${
          isHovered ? 'fill-amber-400 stroke-amber-300' : 'fill-amber-500 stroke-amber-600'
        } transition-all duration-300 cursor-help filter drop-shadow-[0_0_2px_rgba(245,158,11,0.3)]`;
      case 'red':
        return `${
          isHovered ? 'fill-red-400 stroke-red-300' : 'fill-red-500 stroke-red-600'
        } transition-all duration-300 cursor-help filter drop-shadow-[0_0_3px_rgba(239,68,68,0.5)] animate-pulse`;
      case 'grey':
      default:
        return `${
          isHovered ? 'fill-zinc-600 stroke-zinc-500' : 'fill-zinc-700 stroke-zinc-800'
        } transition-all duration-300 cursor-help`;
    }
  };

  return (
    <div ref={containerRef} className="relative w-full border border-zinc-900 bg-zinc-950/60 backdrop-blur-md rounded-2xl p-4 md:p-6 flex flex-col items-center justify-between min-h-[460px] select-none">
      
      {/* Title */}
      <div className="w-full flex items-center justify-between pb-3 border-b border-zinc-900">
        <h3 className="text-sm font-bold tracking-wider uppercase text-zinc-400 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
          Heatmap Musculaire (INOL)
        </h3>
        
        {simulation.cnsFailure && (
          <div className="animate-bounce bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-extrabold tracking-wide uppercase px-2.5 py-1 rounded-md">
            ⚠️ Échec Systémique (SNC Saturé)
          </div>
        )}
      </div>

      {/* SVG Canvas */}
      <div className="relative flex items-center justify-center w-full max-w-[420px] h-[340px] md:h-[380px] mt-4">
        
        {/* Unified SVG for Front & Back */}
        <svg
          viewBox="0 0 400 380"
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* DEFINITIONS & STYLES */}
          <defs>
            <style>{`
              .silhouette { fill: #0d0d0f; stroke: #18181b; stroke-width: 1.5; }
              .joint { fill: #27272a; }
              .muscle-path { stroke-width: 1.2; stroke-linejoin: round; }
            `}</style>
          </defs>

          {/* ==================== VUE FACE (GAUCHE, center around 100) ==================== */}
          <g id="front-view">
            {/* Background athletic silhouette */}
            {/* Head */}
            <circle cx="100" cy="40" r="18" className="silhouette" />
            {/* Neck */}
            <polygon points="92,58 108,58 105,72 95,72" className="silhouette" />
            {/* Torso & Arms background */}
            <path d="M 60,90 L 140,90 L 145,150 L 125,210 L 100,220 L 75,210 L 55,150 Z" className="silhouette" />
            {/* Legs background */}
            <path d="M 60,215 L 98,220 L 92,300 L 70,300 L 64,360 L 56,360 L 62,300 Z" className="silhouette" />
            {/* Right leg background */}
            <path d="M 140,215 L 102,220 L 108,300 L 130,300 L 136,360 L 144,360 L 138,300 Z" className="silhouette" />
            {/* Arms background */}
            <path d="M 60,90 L 45,160 L 35,210 L 42,212 L 53,160 L 60,110 Z" className="silhouette" />
            <path d="M 140,90 L 155,160 L 165,210 L 158,212 L 147,160 L 140,110 Z" className="silhouette" />

            {/* MUSCLES FACE */}
            {/* Trapez (Front upper collars) */}
            <path
              d="M 92,58 L 78,82 L 84,84 L 95,72 Z"
              className={`muscle-path ${getColorClass(muscles['traps']?.color || 'grey', hoveredId === 'traps')}`}
              onMouseEnter={(e) => handleMouseEnter('traps', e)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />
            <path
              d="M 108,58 L 122,82 L 116,84 L 105,72 Z"
              className={`muscle-path ${getColorClass(muscles['traps']?.color || 'grey', hoveredId === 'traps')}`}
              onMouseEnter={(e) => handleMouseEnter('traps', e)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />

            {/* Deltoids Ant (Shoulders) */}
            <path
              d="M 65,92 Q 50,102 58,122 L 68,95 Z"
              className={`muscle-path ${getColorClass(muscles['deltoids_ant']?.color || 'grey', hoveredId === 'deltoids_ant')}`}
              onMouseEnter={(e) => handleMouseEnter('deltoids_ant', e)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />
            <path
              d="M 135,92 Q 150,102 142,122 L 132,95 Z"
              className={`muscle-path ${getColorClass(muscles['deltoids_ant']?.color || 'grey', hoveredId === 'deltoids_ant')}`}
              onMouseEnter={(e) => handleMouseEnter('deltoids_ant', e)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />

            {/* Chest (Pectorals) */}
            <path
              d="M 100,95 L 68,95 L 63,125 L 100,135 Z"
              className={`muscle-path ${getColorClass(muscles['chest_major']?.color || 'grey', hoveredId === 'chest_major')}`}
              onMouseEnter={(e) => handleMouseEnter('chest_major', e)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />
            <path
              d="M 100,95 L 132,95 L 137,125 L 100,135 Z"
              className={`muscle-path ${getColorClass(muscles['chest_major']?.color || 'grey', hoveredId === 'chest_major')}`}
              onMouseEnter={(e) => handleMouseEnter('chest_major', e)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />

            {/* Biceps */}
            <path
              d="M 56,125 L 48,154 L 57,157 L 64,127 Z"
              className={`muscle-path ${getColorClass(muscles['biceps']?.color || 'grey', hoveredId === 'biceps')}`}
              onMouseEnter={(e) => handleMouseEnter('biceps', e)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />
            <path
              d="M 144,125 L 152,154 L 143,157 L 136,127 Z"
              className={`muscle-path ${getColorClass(muscles['biceps']?.color || 'grey', hoveredId === 'biceps')}`}
              onMouseEnter={(e) => handleMouseEnter('biceps', e)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />

            {/* Forearms (Avant-bras) */}
            <path
              d="M 47,158 L 38,202 L 46,204 L 56,160 Z"
              className={`muscle-path ${getColorClass(muscles['forearms']?.color || 'grey', hoveredId === 'forearms')}`}
              onMouseEnter={(e) => handleMouseEnter('forearms', e)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />
            <path
              d="M 153,158 L 162,202 L 154,204 L 144,160 Z"
              className={`muscle-path ${getColorClass(muscles['forearms']?.color || 'grey', hoveredId === 'forearms')}`}
              onMouseEnter={(e) => handleMouseEnter('forearms', e)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />

            {/* Abs (Abdominaux) */}
            <path
              d="M 88,140 L 112,140 L 110,205 L 90,205 Z"
              className={`muscle-path ${getColorClass(muscles['abs']?.color || 'grey', hoveredId === 'abs')}`}
              onMouseEnter={(e) => handleMouseEnter('abs', e)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />

            {/* Obliques */}
            <path
              d="M 86,140 L 72,142 L 78,205 L 88,205 Z"
              className={`muscle-path ${getColorClass(muscles['obliques']?.color || 'grey', hoveredId === 'obliques')}`}
              onMouseEnter={(e) => handleMouseEnter('obliques', e)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />
            <path
              d="M 114,140 L 128,142 L 122,205 L 112,205 Z"
              className={`muscle-path ${getColorClass(muscles['obliques']?.color || 'grey', hoveredId === 'obliques')}`}
              onMouseEnter={(e) => handleMouseEnter('obliques', e)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />

            {/* Quads (Quadriceps) */}
            <path
              d="M 62,222 L 96,222 L 91,298 L 70,298 Z"
              className={`muscle-path ${getColorClass(muscles['quads']?.color || 'grey', hoveredId === 'quads')}`}
              onMouseEnter={(e) => handleMouseEnter('quads', e)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />
            <path
              d="M 138,222 L 104,222 L 109,298 L 130,298 Z"
              className={`muscle-path ${getColorClass(muscles['quads']?.color || 'grey', hoveredId === 'quads')}`}
              onMouseEnter={(e) => handleMouseEnter('quads', e)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />

            {/* Vue Face Title */}
            <text x="100" y="375" fill="#52525b" fontSize="11" fontWeight="bold" textAnchor="middle">FACE</text>
          </g>

          {/* ==================== VUE DOS (DROITE, center around 300) ==================== */}
          <g id="back-view">
            {/* Background athletic silhouette */}
            {/* Head */}
            <circle cx="300" cy="40" r="18" className="silhouette" />
            {/* Neck */}
            <polygon points="292,58 308,58 305,72 295,72" className="silhouette" />
            {/* Torso & Arms background */}
            <path d="M 260,90 L 340,90 L 345,150 L 325,210 L 300,220 L 275,210 L 255,150 Z" className="silhouette" />
            {/* Legs background */}
            <path d="M 260,215 L 298,220 L 292,300 L 270,300 L 264,360 L 256,360 L 262,300 Z" className="silhouette" />
            {/* Right leg background */}
            <path d="M 340,215 L 302,220 L 308,300 L 330,300 L 336,360 L 344,360 L 338,300 Z" className="silhouette" />
            {/* Arms background */}
            <path d="M 260,90 L 245,160 L 235,210 L 242,212 L 253,160 L 260,110 Z" className="silhouette" />
            <path d="M 340,90 L 355,160 L 365,210 L 358,212 L 347,160 L 340,110 Z" className="silhouette" />

            {/* MUSCLES DOS */}
            {/* Traps (Trapèzes complets) */}
            <path
              d="M 300,68 L 275,88 L 282,118 L 300,136 L 318,118 L 325,88 Z"
              className={`muscle-path ${getColorClass(muscles['traps']?.color || 'grey', hoveredId === 'traps')}`}
              onMouseEnter={(e) => handleMouseEnter('traps', e)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />

            {/* Rear Deltoids */}
            <path
              d="M 264,92 Q 248,102 256,122 L 272,100 Z"
              className={`muscle-path ${getColorClass(muscles['deltoids_post']?.color || 'grey', hoveredId === 'deltoids_post')}`}
              onMouseEnter={(e) => handleMouseEnter('deltoids_post', e)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />
            <path
              d="M 336,92 Q 352,102 344,122 L 328,100 Z"
              className={`muscle-path ${getColorClass(muscles['deltoids_post']?.color || 'grey', hoveredId === 'deltoids_post')}`}
              onMouseEnter={(e) => handleMouseEnter('deltoids_post', e)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />

            {/* Triceps */}
            <path
              d="M 254,122 L 246,152 L 256,155 L 262,125 Z"
              className={`muscle-path ${getColorClass(muscles['triceps']?.color || 'grey', hoveredId === 'triceps')}`}
              onMouseEnter={(e) => handleMouseEnter('triceps', e)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />
            <path
              d="M 346,122 L 354,152 L 344,155 L 338,125 Z"
              className={`muscle-path ${getColorClass(muscles['triceps']?.color || 'grey', hoveredId === 'triceps')}`}
              onMouseEnter={(e) => handleMouseEnter('triceps', e)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />

            {/* Lats (Dorsaux) */}
            <path
              d="M 280,118 L 264,148 L 282,192 L 298,188 Z"
              className={`muscle-path ${getColorClass(muscles['lats']?.color || 'grey', hoveredId === 'lats')}`}
              onMouseEnter={(e) => handleMouseEnter('lats', e)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />
            <path
              d="M 320,118 L 336,148 L 318,192 L 302,188 Z"
              className={`muscle-path ${getColorClass(muscles['lats']?.color || 'grey', hoveredId === 'lats')}`}
              onMouseEnter={(e) => handleMouseEnter('lats', e)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />

            {/* Lower Back (Lombaires) */}
            <path
              d="M 298,190 L 302,190 L 304,218 L 296,218 Z"
              className={`muscle-path ${getColorClass(muscles['lower_back']?.color || 'grey', hoveredId === 'lower_back')}`}
              onMouseEnter={(e) => handleMouseEnter('lower_back', e)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />

            {/* Glutes (Fessiers) */}
            <path
              d="M 264,222 L 299,222 L 298,255 L 270,255 Z"
              className={`muscle-path ${getColorClass(muscles['glutes']?.color || 'grey', hoveredId === 'glutes')}`}
              onMouseEnter={(e) => handleMouseEnter('glutes', e)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />
            <path
              d="M 336,222 L 301,222 L 302,255 L 330,255 Z"
              className={`muscle-path ${getColorClass(muscles['glutes']?.color || 'grey', hoveredId === 'glutes')}`}
              onMouseEnter={(e) => handleMouseEnter('glutes', e)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />

            {/* Hamstrings (Ischios) */}
            <path
              d="M 268,258 L 298,258 L 294,320 L 274,320 Z"
              className={`muscle-path ${getColorClass(muscles['hamstrings']?.color || 'grey', hoveredId === 'hamstrings')}`}
              onMouseEnter={(e) => handleMouseEnter('hamstrings', e)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />
            <path
              d="M 332,258 L 302,258 L 306,320 L 326,320 Z"
              className={`muscle-path ${getColorClass(muscles['hamstrings']?.color || 'grey', hoveredId === 'hamstrings')}`}
              onMouseEnter={(e) => handleMouseEnter('hamstrings', e)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />

            {/* Calves (Mollets) */}
            <path
              d="M 273,324 L 292,324 L 288,370 L 276,370 Z"
              className={`muscle-path ${getColorClass(muscles['calves']?.color || 'grey', hoveredId === 'calves')}`}
              onMouseEnter={(e) => handleMouseEnter('calves', e)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />
            <path
              d="M 327,324 L 308,324 L 312,370 L 324,370 Z"
              className={`muscle-path ${getColorClass(muscles['calves']?.color || 'grey', hoveredId === 'calves')}`}
              onMouseEnter={(e) => handleMouseEnter('calves', e)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />

            {/* Vue Dos Title */}
            <text x="300" y="375" fill="#52525b" fontSize="11" fontWeight="bold" textAnchor="middle">DOS</text>
          </g>
        </svg>

        {/* Floating tactical HUD tooltip */}
        {tooltipPos && hoveredMuscle && (
          <div
            style={{
              position: 'absolute',
              left: `${tooltipPos.x}px`,
              top: `${tooltipPos.y}px`
            }}
            className="pointer-events-none z-45 w-[200px] rounded-xl border border-zinc-800 bg-zinc-950/95 p-3 text-xs shadow-2xl shadow-black/80 animate-fadeIn"
          >
            <div className="flex items-center justify-between pb-1.5 border-b border-zinc-850">
              <span className="font-bold text-white tracking-wide truncate">{hoveredMuscle.name}</span>
              <span
                className={`h-2 w-2 rounded-full ${
                  hoveredMuscle.color === 'green'
                    ? 'bg-emerald-500'
                    : hoveredMuscle.color === 'orange'
                    ? 'bg-amber-500'
                    : hoveredMuscle.color === 'red'
                    ? 'bg-red-500'
                    : 'bg-zinc-600'
                }`}
              />
            </div>
            
            <div className="mt-2 space-y-1 text-zinc-400">
              <div className="flex justify-between">
                <span>Statut :</span>
                <span
                  className={`font-semibold ${
                    hoveredMuscle.color === 'green'
                      ? 'text-emerald-400'
                      : hoveredMuscle.color === 'orange'
                      ? 'text-amber-400'
                      : hoveredMuscle.color === 'red'
                      ? 'text-red-400'
                      : 'text-zinc-400'
                  }`}
                >
                  {hoveredMuscle.statusLabel}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Score INOL :</span>
                <span className="font-bold text-white">{hoveredMuscle.inol}</span>
              </div>
              <div className="flex justify-between">
                <span>Séries Effectives :</span>
                <span className="font-bold text-zinc-200">{hoveredMuscle.sets}</span>
              </div>
            </div>

            {hoveredMuscle.contributors.length > 0 && (
              <div className="mt-2.5 pt-2 border-t border-zinc-850">
                <span className="text-[10px] text-zinc-500 block mb-1 font-semibold uppercase tracking-wider">Top Contributeurs :</span>
                <div className="space-y-1">
                  {hoveredMuscle.contributors.map((c, i) => (
                    <div key={i} className="flex justify-between text-[10px]">
                      <span className="text-zinc-400 truncate max-w-[130px]">{c.nom}</span>
                      <span className="font-medium text-emerald-400">{c.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Colors Legend */}
      <div className="w-full mt-4 flex items-center justify-around border-t border-zinc-900 pt-3 text-[10px] text-zinc-400 font-medium">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-zinc-700" />
          <span>Maintien</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span>Optimal</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          <span>Fatigue +</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          <span>Surentraîné</span>
        </div>
      </div>
    </div>
  );
}
