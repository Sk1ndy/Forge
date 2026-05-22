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

  // Remplissage SVG par couleur (Gradients cyberpunk premiums)
  const getColorClass = (color: MuscleStatus['color'], isHovered: boolean) => {
    if (simulation.cnsFailure) {
      return 'muscle-grey opacity-40 transition-all duration-300';
    }
    
    switch (color) {
      case 'green':
        return isHovered ? 'muscle-green-hover cursor-help' : 'muscle-green cursor-help';
      case 'orange':
        return isHovered ? 'muscle-orange-hover cursor-help' : 'muscle-orange cursor-help';
      case 'red':
        return isHovered ? 'muscle-red-hover cursor-help animate-pulse' : 'muscle-red cursor-help animate-pulse';
      case 'grey':
      default:
        return isHovered ? 'muscle-grey-hover cursor-help' : 'muscle-grey cursor-help';
    }
  };

  return (
    <div ref={containerRef} className="relative w-full border border-zinc-900 bg-zinc-950/60 backdrop-blur-md rounded-2xl p-4 md:p-6 flex flex-col items-center justify-between min-h-[480px] select-none shadow-2xl">
      
      {/* Title & Status */}
      <div className="w-full flex items-center justify-between pb-3 border-b border-zinc-900">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
          <h3 className="text-sm font-bold tracking-wider uppercase text-zinc-400">
            Scanner Anatomique Électronique
          </h3>
        </div>
        
        {simulation.cnsFailure ? (
          <div className="animate-bounce bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-black tracking-widest uppercase px-2.5 py-1 rounded-md">
            ⚠️ ALERTE : SURCHARGE SYSTÉMIQUE (SNC)
          </div>
        ) : (
          <div className="text-[9px] bg-emerald-500/5 text-emerald-400 border border-emerald-500/10 font-bold px-2 py-0.5 rounded uppercase tracking-wider">
            Système Nominal
          </div>
        )}
      </div>

      {/* SVG Canvas with Tactical Grids */}
      <div className="relative flex items-center justify-center w-full max-w-[440px] h-[340px] md:h-[390px] mt-4 overflow-hidden rounded-xl border border-zinc-900/40 bg-zinc-950/30 p-2">
        
        {/* Holographic background scanner effects */}
        <div className="absolute inset-0 bg-radial-gradient from-emerald-500/5 to-transparent pointer-events-none" />

        <svg
          viewBox="0 0 400 380"
          className="w-full h-full z-10"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* DEFINITIONS OF GRADIENTS & CUSTOM CYBER STYLES */}
          <defs>
            <linearGradient id="grad-grey" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e1e24" />
              <stop offset="100%" stopColor="#0e0e11" />
            </linearGradient>
            <linearGradient id="grad-green" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0d9488" />
              <stop offset="100%" stopColor="#115e59" />
            </linearGradient>
            <linearGradient id="grad-orange" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#92400e" />
            </linearGradient>
            <linearGradient id="grad-red" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#dc2626" />
              <stop offset="100%" stopColor="#991b1b" />
            </linearGradient>

            <style>{`
              .silhouette { fill: #070709; stroke: #1b1b22; stroke-width: 1.2; }
              .muscle-path { stroke-width: 0.9; stroke-linejoin: round; transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); }
              .muscle-grey { fill: url(#grad-grey); stroke: #232329; }
              .muscle-grey-hover { fill: #373740; stroke: #4b4b55; filter: drop-shadow(0 0 3px rgba(113,113,122,0.4)); }
              .muscle-green { fill: url(#grad-green); stroke: #14b8a6; }
              .muscle-green-hover { fill: #2dd4bf; stroke: #ccfbf1; filter: drop-shadow(0 0 5px rgba(20,184,166,0.7)); }
              .muscle-orange { fill: url(#grad-orange); stroke: #f59e0b; }
              .muscle-orange-hover { fill: #fbbf24; stroke: #fef9c3; filter: drop-shadow(0 0 5px rgba(245,158,11,0.7)); }
              .muscle-red { fill: url(#grad-red); stroke: #ef4444; }
              .muscle-red-hover { fill: #f87171; stroke: #fee2e2; filter: drop-shadow(0 0 8px rgba(239,68,68,0.9)); }
            `}</style>
          </defs>

          {/* ==================== TECH HUD DETAILS (GRID & RETICULES) ==================== */}
          <g opacity="0.12" pointerEvents="none">
            {/* Horizontal scan lines */}
            <line x1="0" y1="50" x2="400" y2="50" stroke="#10b981" strokeWidth="0.5" strokeDasharray="3,6" />
            <line x1="0" y1="120" x2="400" y2="120" stroke="#10b981" strokeWidth="0.5" strokeDasharray="3,6" />
            <line x1="0" y1="210" x2="400" y2="210" stroke="#10b981" strokeWidth="0.5" strokeDasharray="3,6" />
            <line x1="0" y1="300" x2="400" y2="300" stroke="#10b981" strokeWidth="0.5" strokeDasharray="3,6" />
            
            {/* Axis align coordinates */}
            <line x1="100" y1="0" x2="100" y2="380" stroke="#10b981" strokeWidth="0.5" strokeDasharray="3,6" />
            <line x1="300" y1="0" x2="300" y2="380" stroke="#10b981" strokeWidth="0.5" strokeDasharray="3,6" />
            <line x1="200" y1="0" x2="200" y2="380" stroke="#10b981" strokeWidth="0.5" />
          </g>

          <g opacity="0.15" pointerEvents="none">
            {/* Target circular HUD overlays */}
            <circle cx="100" cy="130" r="48" fill="none" stroke="#10b981" strokeWidth="0.5" strokeDasharray="2,8" />
            <circle cx="300" cy="130" r="48" fill="none" stroke="#10b981" strokeWidth="0.5" strokeDasharray="2,8" />
            
            {/* Precision crosshairs */}
            <path d="M 85,130 L 115,130 M 100,115 L 100,145" stroke="#10b981" strokeWidth="0.5" />
            <path d="M 285,130 L 315,130 M 300,115 L 300,145" stroke="#10b981" strokeWidth="0.5" />
          </g>

          {/* ==================== VUE FACE (CENTRE x = 100) ==================== */}
          <g id="front-view">
            {/* Background beautiful curved athletic outlines */}
            <ellipse cx="100" cy="38" rx="14" ry="18" className="silhouette" />
            <path d="M 91,54 Q 100,62 109,54 L 105,74 Q 100,75 95,74 Z" className="silhouette" />
            
            {/* Torso & Limbs curved backgrounds to match overlaying muscles */}
            <path d="M 72,88 C 55,100 55,140 70,165 C 74,185 78,212 94,212 C 100,214 100,214 106,212 C 122,212 126,185 130,165 C 145,140 145,100 128,88 Z" className="silhouette" />
            <path d="M 64,222 C 58,245 62,280 72,300 C 64,316 66,335 72,362 L 80,362 C 86,320 96,275 96,222 Z" className="silhouette" />
            <path d="M 136,222 C 142,245 138,280 128,300 C 136,316 134,335 128,362 L 120,362 C 114,320 104,275 104,222 Z" className="silhouette" />
            
            <path d="M 72,88 C 58,95 48,115 56,160 C 48,174 38,194 40,210 L 46,210 C 58,185 64,155 72,96 Z" className="silhouette" />
            <path d="M 128,88 C 142,95 152,115 144,160 C 152,174 162,194 160,210 L 154,210 C 142,185 136,155 128,96 Z" className="silhouette" />

            {/* INTERACTIVE MUSCLES - FRONT */}
            {/* Front Traps */}
            <path
              d="M 94,62 C 86,72 78,80 72,88 L 82,92 C 86,84 92,72 96,62 Z"
              className={`muscle-path ${getColorClass(muscles['traps']?.color || 'grey', hoveredId === 'traps')}`}
              onMouseEnter={(e) => handleMouseEnter('traps', e)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />
            <path
              d="M 106,62 C 114,72 122,80 128,88 L 118,92 C 114,84 108,72 104,62 Z"
              className={`muscle-path ${getColorClass(muscles['traps']?.color || 'grey', hoveredId === 'traps')}`}
              onMouseEnter={(e) => handleMouseEnter('traps', e)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />

            {/* Deltoids Ant (épaule face) */}
            <path
              d="M 72,88 C 58,95 52,112 60,126 C 63,122 66,108 72,96 Z"
              className={`muscle-path ${getColorClass(muscles['deltoids_ant']?.color || 'grey', hoveredId === 'deltoids_ant')}`}
              onMouseEnter={(e) => handleMouseEnter('deltoids_ant', e)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />
            <path
              d="M 128,88 C 142,95 148,112 140,126 C 137,122 134,108 128,96 Z"
              className={`muscle-path ${getColorClass(muscles['deltoids_ant']?.color || 'grey', hoveredId === 'deltoids_ant')}`}
              onMouseEnter={(e) => handleMouseEnter('deltoids_ant', e)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />

            {/* Chest (Grand Pectoral) */}
            <path
              d="M 100,94 C 85,94 72,96 70,118 C 72,132 94,136 100,136 Z"
              className={`muscle-path ${getColorClass(muscles['chest_major']?.color || 'grey', hoveredId === 'chest_major')}`}
              onMouseEnter={(e) => handleMouseEnter('chest_major', e)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />
            <path
              d="M 100,94 C 115,94 128,96 130,118 C 128,132 106,136 100,136 Z"
              className={`muscle-path ${getColorClass(muscles['chest_major']?.color || 'grey', hoveredId === 'chest_major')}`}
              onMouseEnter={(e) => handleMouseEnter('chest_major', e)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />

            {/* Biceps */}
            <path
              d="M 59,127 C 50,135 48,152 56,160 C 60,154 62,142 67,128 Z"
              className={`muscle-path ${getColorClass(muscles['biceps']?.color || 'grey', hoveredId === 'biceps')}`}
              onMouseEnter={(e) => handleMouseEnter('biceps', e)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />
            <path
              d="M 141,127 C 150,135 152,152 144,160 C 140,154 138,142 133,128 Z"
              className={`muscle-path ${getColorClass(muscles['biceps']?.color || 'grey', hoveredId === 'biceps')}`}
              onMouseEnter={(e) => handleMouseEnter('biceps', e)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />

            {/* Forearms (Avant-bras) */}
            <path
              d="M 56,161 C 48,174 38,194 40,210 C 44,210 49,198 59,173 Z"
              className={`muscle-path ${getColorClass(muscles['forearms']?.color || 'grey', hoveredId === 'forearms')}`}
              onMouseEnter={(e) => handleMouseEnter('forearms', e)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />
            <path
              d="M 144,161 C 152,174 162,194 160,210 C 156,210 151,198 141,173 Z"
              className={`muscle-path ${getColorClass(muscles['forearms']?.color || 'grey', hoveredId === 'forearms')}`}
              onMouseEnter={(e) => handleMouseEnter('forearms', e)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />

            {/* Abdominaux (Abs - Tablettes) */}
            <path
              d="M 88,138 C 94,137 106,137 112,138 C 110,160 108,185 106,212 C 100,214 100,214 94,212 C 92,185 90,160 88,138 Z"
              className={`muscle-path ${getColorClass(muscles['abs']?.color || 'grey', hoveredId === 'abs')}`}
              onMouseEnter={(e) => handleMouseEnter('abs', e)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />

            {/* Obliques */}
            <path
              d="M 87,138 C 76,145 74,180 78,212 C 84,213 88,212 93,212 C 90,185 88,160 87,138 Z"
              className={`muscle-path ${getColorClass(muscles['obliques']?.color || 'grey', hoveredId === 'obliques')}`}
              onMouseEnter={(e) => handleMouseEnter('obliques', e)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />
            <path
              d="M 113,138 C 124,145 126,180 122,212 C 116,213 112,212 107,212 C 110,185 112,160 113,138 Z"
              className={`muscle-path ${getColorClass(muscles['obliques']?.color || 'grey', hoveredId === 'obliques')}`}
              onMouseEnter={(e) => handleMouseEnter('obliques', e)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />

            {/* Quadriceps (Athletic sweep curves) */}
            <path
              d="M 64,222 C 58,245 62,280 72,300 C 80,300 86,290 92,298 C 96,275 98,245 96,222 Z"
              className={`muscle-path ${getColorClass(muscles['quads']?.color || 'grey', hoveredId === 'quads')}`}
              onMouseEnter={(e) => handleMouseEnter('quads', e)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />
            <path
              d="M 136,222 C 142,245 138,280 128,300 C 120,300 114,290 108,298 C 104,275 102,245 104,222 Z"
              className={`muscle-path ${getColorClass(muscles['quads']?.color || 'grey', hoveredId === 'quads')}`}
              onMouseEnter={(e) => handleMouseEnter('quads', e)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />

            {/* Calves (Mollets face) */}
            <path
              d="M 70,304 C 64,316 66,335 72,362 L 78,362 C 82,342 85,322 86,304 Z"
              className={`muscle-path ${getColorClass(muscles['calves']?.color || 'grey', hoveredId === 'calves')}`}
              onMouseEnter={(e) => handleMouseEnter('calves', e)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />
            <path
              d="M 130,304 C 136,316 134,335 128,362 L 122,362 C 118,342 115,322 114,304 Z"
              className={`muscle-path ${getColorClass(muscles['calves']?.color || 'grey', hoveredId === 'calves')}`}
              onMouseEnter={(e) => handleMouseEnter('calves', e)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />

            {/* Grid coordinate Front */}
            <text x="100" y="375" fill="#52525b" fontSize="10" fontWeight="extrabold" tracking="wider" textAnchor="middle" opacity="0.6">ANTERIOR</text>
          </g>

          {/* ==================== VUE DOS (CENTRE x = 300) ==================== */}
          <g id="back-view">
            {/* Background beautiful curved athletic outlines */}
            <ellipse cx="300" cy="38" rx="14" ry="18" className="silhouette" />
            <path d="M 291,54 Q 300,62 309,54 L 305,74 Q 300,75 295,74 Z" className="silhouette" />
            
            {/* Torso & Limbs curved backgrounds */}
            <path d="M 272,88 C 255,100 255,140 270,165 C 274,185 278,212 294,212 C 300,214 300,214 306,212 C 322,212 326,185 330,165 C 345,140 345,100 328,88 Z" className="silhouette" />
            <path d="M 264,222 C 258,245 262,280 272,300 C 264,316 265,335 272,362 L 280,362 C 286,320 296,275 296,222 Z" className="silhouette" />
            <path d="M 336,222 C 342,245 338,280 328,300 C 336,316 334,335 328,362 L 320,362 C 314,320 304,275 304,222 Z" className="silhouette" />
            
            <path d="M 272,88 C 258,95 48,115 256,160 C 248,174 238,194 240,210 L 246,210 C 258,185 264,155 272,96 Z" className="silhouette" />
            <path d="M 328,88 C 342,95 352,115 344,160 C 352,174 362,194 360,210 L 354,210 C 342,185 336,155 328,96 Z" className="silhouette" />

            {/* INTERACTIVE MUSCLES - BACK */}
            {/* Traps complete (Trapèzes en V) */}
            <path
              d="M 300,74 C 290,74 278,82 272,92 C 280,105 290,118 300,138 C 310,118 320,105 328,92 C 322,82 310,74 300,74 Z"
              className={`muscle-path ${getColorClass(muscles['traps']?.color || 'grey', hoveredId === 'traps')}`}
              onMouseEnter={(e) => handleMouseEnter('traps', e)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />

            {/* Rear Deltoids (épaule arrière) */}
            <path
              d="M 272,92 C 258,97 252,112 258,124 C 263,120 268,110 274,96 Z"
              className={`muscle-path ${getColorClass(muscles['deltoids_post']?.color || 'grey', hoveredId === 'deltoids_post')}`}
              onMouseEnter={(e) => handleMouseEnter('deltoids_post', e)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />
            <path
              d="M 328,92 C 342,97 348,112 342,124 C 337,120 332,110 326,96 Z"
              className={`muscle-path ${getColorClass(muscles['deltoids_post']?.color || 'grey', hoveredId === 'deltoids_post')}`}
              onMouseEnter={(e) => handleMouseEnter('deltoids_post', e)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />

            {/* Triceps (arrière bras) */}
            <path
              d="M 257,125 C 248,135 244,152 253,160 C 257,154 259,142 263,127 Z"
              className={`muscle-path ${getColorClass(muscles['triceps']?.color || 'grey', hoveredId === 'triceps')}`}
              onMouseEnter={(e) => handleMouseEnter('triceps', e)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />
            <path
              d="M 343,125 C 352,135 356,152 347,160 C 343,154 341,142 337,127 Z"
              className={`muscle-path ${getColorClass(muscles['triceps']?.color || 'grey', hoveredId === 'triceps')}`}
              onMouseEnter={(e) => handleMouseEnter('triceps', e)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />

            {/* Lats (Grand Dorsal) */}
            <path
              d="M 273,98 C 262,115 258,140 270,165 C 280,185 290,192 296,192 C 290,165 282,135 273,98 Z"
              className={`muscle-path ${getColorClass(muscles['lats']?.color || 'grey', hoveredId === 'lats')}`}
              onMouseEnter={(e) => handleMouseEnter('lats', e)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />
            <path
              d="M 327,98 C 338,115 342,140 330,165 C 320,185 310,192 304,192 C 310,165 318,135 327,98 Z"
              className={`muscle-path ${getColorClass(muscles['lats']?.color || 'grey', hoveredId === 'lats')}`}
              onMouseEnter={(e) => handleMouseEnter('lats', e)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />

            {/* Lombaires (Lower Back) */}
            <path
              d="M 297,192 C 292,192 292,205 294,218 C 300,220 300,220 306,218 C 308,205 308,192 303,192 Z"
              className={`muscle-path ${getColorClass(muscles['lower_back']?.color || 'grey', hoveredId === 'lower_back')}`}
              onMouseEnter={(e) => handleMouseEnter('lower_back', e)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />

            {/* Glutes (Fessiers galbés) */}
            <path
              d="M 264,222 C 258,235 264,256 280,256 C 294,256 298,245 298,222 Z"
              className={`muscle-path ${getColorClass(muscles['glutes']?.color || 'grey', hoveredId === 'glutes')}`}
              onMouseEnter={(e) => handleMouseEnter('glutes', e)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />
            <path
              d="M 336,222 C 342,235 336,256 320,256 C 306,256 302,245 302,222 Z"
              className={`muscle-path ${getColorClass(muscles['glutes']?.color || 'grey', hoveredId === 'glutes')}`}
              onMouseEnter={(e) => handleMouseEnter('glutes', e)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />

            {/* Hamstrings (Ischios) */}
            <path
              d="M 268,258 C 262,275 266,305 274,320 C 284,320 290,305 294,258 Z"
              className={`muscle-path ${getColorClass(muscles['hamstrings']?.color || 'grey', hoveredId === 'hamstrings')}`}
              onMouseEnter={(e) => handleMouseEnter('hamstrings', e)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />
            <path
              d="M 332,258 C 338,275 334,305 326,320 C 316,320 310,305 306,258 Z"
              className={`muscle-path ${getColorClass(muscles['hamstrings']?.color || 'grey', hoveredId === 'hamstrings')}`}
              onMouseEnter={(e) => handleMouseEnter('hamstrings', e)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />

            {/* Calves (Mollets arrière) */}
            <path
              d="M 273,322 C 263,332 265,348 274,370 C 279,370 282,360 286,322 Z"
              className={`muscle-path ${getColorClass(muscles['calves']?.color || 'grey', hoveredId === 'calves')}`}
              onMouseEnter={(e) => handleMouseEnter('calves', e)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />
            <path
              d="M 327,322 C 337,332 335,348 326,370 C 321,370 318,360 314,322 Z"
              className={`muscle-path ${getColorClass(muscles['calves']?.color || 'grey', hoveredId === 'calves')}`}
              onMouseEnter={(e) => handleMouseEnter('calves', e)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />

            {/* Grid coordinate Back */}
            <text x="300" y="375" fill="#52525b" fontSize="10" fontWeight="extrabold" tracking="wider" textAnchor="middle" opacity="0.6">POSTERIOR</text>
          </g>
        </svg>

        {/* Floating holographic HUD tactical tooltip */}
        {tooltipPos && hoveredMuscle && (
          <div
            style={{
              position: 'absolute',
              left: `${tooltipPos.x}px`,
              top: `${tooltipPos.y}px`
            }}
            className="pointer-events-none z-50 w-[210px] rounded-xl border border-zinc-800/80 bg-zinc-950/95 backdrop-blur-md p-3.5 text-xs shadow-2xl shadow-black/90 animate-fadeIn"
          >
            {/* Tooltip Header */}
            <div className="flex items-center justify-between pb-2 border-b border-zinc-850">
              <span className="font-bold text-white tracking-wide truncate">{hoveredMuscle.name}</span>
              <span
                className={`h-2 w-2 rounded-full ${
                  hoveredMuscle.color === 'green'
                    ? 'bg-emerald-400 shadow-[0_0_6px_#10b981]'
                    : hoveredMuscle.color === 'orange'
                    ? 'bg-amber-400 shadow-[0_0_6px_#f59e0b]'
                    : hoveredMuscle.color === 'red'
                    ? 'bg-red-400 shadow-[0_0_6px_#ef4444] animate-ping'
                    : 'bg-zinc-600'
                }`}
              />
            </div>
            
            {/* Tooltip Stats */}
            <div className="mt-2.5 space-y-1.5 text-zinc-400 font-medium">
              <div className="flex justify-between items-center">
                <span>Physiologie :</span>
                <span
                  className={`font-bold uppercase text-[10px] tracking-wider ${
                    hoveredMuscle.color === 'green'
                      ? 'text-emerald-400'
                      : hoveredMuscle.color === 'orange'
                      ? 'text-amber-400'
                      : hoveredMuscle.color === 'red'
                      ? 'text-red-400 font-black'
                      : 'text-zinc-500'
                  }`}
                >
                  {hoveredMuscle.color === 'green' && 'OPTIMAL'}
                  {hoveredMuscle.color === 'orange' && 'FATIGUE +'}
                  {hoveredMuscle.color === 'red' && 'SURCHARGE'}
                  {hoveredMuscle.color === 'grey' && 'MAINTIEN'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Fatigue INOL :</span>
                <span className="font-bold text-white tracking-wide">{hoveredMuscle.inol} / 1.20</span>
              </div>
              <div className="flex justify-between">
                <span>Séries Cumulées :</span>
                <span className="font-bold text-zinc-300">{hoveredMuscle.sets} séries</span>
              </div>
            </div>

            {/* Contributors Section */}
            {hoveredMuscle.contributors.length > 0 && (
              <div className="mt-3 pt-2.5 border-t border-zinc-850">
                <span className="text-[9px] text-zinc-500 block mb-1.5 font-bold uppercase tracking-widest">
                  Facteurs de Tension :
                </span>
                <div className="space-y-1.5">
                  {hoveredMuscle.contributors.map((c, i) => (
                    <div key={i} className="flex justify-between text-[10px] items-center">
                      <span className="text-zinc-400 truncate max-w-[130px] font-semibold">{c.nom}</span>
                      <span className="font-bold text-emerald-400 bg-emerald-950/20 px-1.5 py-0.5 rounded border border-emerald-500/10 text-[9px]">{c.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Premium HUD Calibration Colors Legend */}
      <div className="w-full mt-4 flex items-center justify-around border-t border-zinc-900 pt-3.5 text-[9px] text-zinc-500 font-bold uppercase tracking-wider">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full border border-zinc-700 bg-zinc-800" />
          <span>Repos / Maintien</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full border border-teal-500/30 bg-teal-600/80 shadow-[0_0_6px_rgba(20,184,166,0.3)]" />
          <span className="text-teal-400">Optimum</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full border border-amber-500/30 bg-amber-600/80 shadow-[0_0_6px_rgba(245,158,11,0.3)]" />
          <span className="text-amber-400">Fatigue</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full border border-red-500/30 bg-red-600/80 shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse" />
          <span className="text-red-400">Surcharge</span>
        </div>
      </div>
    </div>
  );
}
