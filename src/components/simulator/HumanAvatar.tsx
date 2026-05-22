'use client';
import React, { useState } from 'react';
import { SimulationResult, MuscleStatus } from '@/lib/calculations';

interface HumanAvatarProps {
  simulation: SimulationResult;
}

export default function HumanAvatar({ simulation }: HumanAvatarProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const handleMouseEnter = (id: string, e: React.MouseEvent) => {
    setHoveredId(id);
    updateTooltipPos(e);
  };
  const handleMouseMove = (e: React.MouseEvent) => updateTooltipPos(e);
  const handleMouseLeave = () => { setHoveredId(null); setTooltipPos(null); };

  const updateTooltipPos = (e: React.MouseEvent) => {
    // Tooltip suit le curseur exactement — position fixe fenêtre
    setTooltipPos({ x: e.clientX + 14, y: e.clientY + 14 });
  };

  const muscles = simulation.muscles;
  const hoveredMuscle = hoveredId ? muscles[hoveredId] : null;

  const getColor = (id: string): string => {
    if (simulation.cnsFailure) return '#27272a';
    const c = muscles[id]?.color || 'grey';
    const hov = hoveredId === id;
    if (c === 'green')  return hov ? '#2dd4bf' : '#0d9488';
    if (c === 'orange') return hov ? '#fbbf24' : '#d97706';
    if (c === 'red')    return hov ? '#f87171' : '#dc2626';
    return hov ? '#3f3f46' : '#1c1c22';
  };

  const getStroke = (id: string): string => {
    if (simulation.cnsFailure) return '#3f3f46';
    const c = muscles[id]?.color || 'grey';
    const hov = hoveredId === id;
    if (c === 'green')  return hov ? '#99f6e4' : '#14b8a6';
    if (c === 'orange') return hov ? '#fde68a' : '#f59e0b';
    if (c === 'red')    return hov ? '#fecaca' : '#ef4444';
    return hov ? '#52525b' : '#27272a';
  };

  const getFilter = (id: string): string => {
    if (simulation.cnsFailure) return 'none';
    const c = muscles[id]?.color || 'grey';
    const hov = hoveredId === id;
    if (!hov) return 'none';
    if (c === 'green')  return 'drop-shadow(0 0 6px rgba(20,184,166,0.8))';
    if (c === 'orange') return 'drop-shadow(0 0 6px rgba(245,158,11,0.8))';
    if (c === 'red')    return 'drop-shadow(0 0 8px rgba(239,68,68,0.9))';
    return 'drop-shadow(0 0 4px rgba(113,113,122,0.5))';
  };

  const mp = (id: string) => ({
    fill: getColor(id),
    stroke: getStroke(id),
    strokeWidth: 0.8,
    style: { filter: getFilter(id), transition: 'all 0.2s ease', cursor: 'help' },
    onMouseEnter: (e: React.MouseEvent) => handleMouseEnter(id, e),
    onMouseMove: handleMouseMove,
    onMouseLeave: handleMouseLeave,
  });

  return (
    <div className="relative w-full border border-zinc-900 bg-zinc-950/60 backdrop-blur-md rounded-2xl p-3 flex flex-col select-none shadow-2xl">

      {/* Title & Status */}
      <div className="w-full flex items-center justify-between pb-2 border-b border-zinc-900 mb-2">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
          <h3 className="text-xs font-bold tracking-wider uppercase text-zinc-400">Scanner Anatomique</h3>
        </div>
        {simulation.cnsFailure ? (
          <div className="animate-bounce bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-black tracking-widest uppercase px-2 py-0.5 rounded-md">
            ⚠️ SURCHARGE SNC
          </div>
        ) : (
          <div className="text-[9px] bg-emerald-500/5 text-emerald-400 border border-emerald-500/10 font-bold px-2 py-0.5 rounded uppercase tracking-wider">
            Nominal
          </div>
        )}
      </div>

      {/* SVG — face + dos côte à côte */}
      <div className="w-full flex-1 overflow-hidden rounded-xl border border-zinc-900/40 bg-zinc-950/20">
        <svg
          viewBox="0 0 440 340"
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
          style={{ minHeight: 220 }}
        >
          <defs>
            {/* Grid scan lines */}
            <pattern id="scan-grid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#10b981" strokeWidth="0.2" opacity="0.15" />
            </pattern>
          </defs>

          {/* Background grid */}
          <rect width="440" height="340" fill="url(#scan-grid)" />

          {/* ── HUD decorations ── */}
          <g opacity="0.25" pointerEvents="none">
            {/* Centre divider */}
            <line x1="220" y1="10" x2="220" y2="330" stroke="#10b981" strokeWidth="0.5" strokeDasharray="4,8" />
            {/* Labels */}
            <text x="110" y="16" fill="#10b981" fontSize="8" fontWeight="bold" letterSpacing="0.15em" textAnchor="middle" opacity="0.8">ANTERIOR</text>
            <text x="330" y="16" fill="#10b981" fontSize="8" fontWeight="bold" letterSpacing="0.15em" textAnchor="middle" opacity="0.8">POSTERIOR</text>
            {/* Corner reticles front */}
            <path d="M 20,20 L 20,30 M 20,20 L 30,20" stroke="#10b981" strokeWidth="0.8" />
            <path d="M 200,20 L 200,30 M 200,20 L 190,20" stroke="#10b981" strokeWidth="0.8" />
            <path d="M 20,320 L 20,310 M 20,320 L 30,320" stroke="#10b981" strokeWidth="0.8" />
            <path d="M 200,320 L 200,310 M 200,320 L 190,320" stroke="#10b981" strokeWidth="0.8" />
            {/* Corner reticles back */}
            <path d="M 240,20 L 240,30 M 240,20 L 250,20" stroke="#10b981" strokeWidth="0.8" />
            <path d="M 420,20 L 420,30 M 420,20 L 410,20" stroke="#10b981" strokeWidth="0.8" />
            <path d="M 240,320 L 240,310 M 240,320 L 250,320" stroke="#10b981" strokeWidth="0.8" />
            <path d="M 420,320 L 420,310 M 420,320 L 410,320" stroke="#10b981" strokeWidth="0.8" />
          </g>

          {/* ═══════════════════════════════════════════════════
              VUE FACE  (viewbox 0→215, centré à x=110)
          ═══════════════════════════════════════════════════ */}
          <g id="front">

            {/* ─── Silhouette de base ─── */}
            {/* Tête */}
            <ellipse cx="110" cy="34" rx="15" ry="19" fill="#070709" stroke="#1b1b22" strokeWidth="1" />
            {/* Cou */}
            <rect x="103" y="51" width="14" height="14" rx="4" fill="#070709" stroke="#1b1b22" strokeWidth="0.8" />
            {/* Torse */}
            <path d="M 77,65 C 68,70 64,100 66,130 C 68,155 74,168 82,175 L 82,210 L 138,210 L 138,175 C 146,168 152,155 154,130 C 156,100 152,70 143,65 Z"
              fill="#070709" stroke="#1b1b22" strokeWidth="1" />
            {/* Bassin */}
            <path d="M 82,210 C 78,215 76,220 79,228 L 141,228 C 144,220 142,215 138,210 Z"
              fill="#070709" stroke="#1b1b22" strokeWidth="0.8" />
            {/* Bras gauche */}
            <path d="M 77,65 C 64,68 54,80 52,105 C 50,125 54,148 50,165 L 62,165 C 64,148 64,126 66,106 C 68,88 76,72 81,68 Z"
              fill="#070709" stroke="#1b1b22" strokeWidth="0.8" />
            {/* Avant-bras gauche */}
            <path d="M 50,165 C 46,175 44,195 46,215 L 58,215 C 58,195 60,175 62,165 Z"
              fill="#070709" stroke="#1b1b22" strokeWidth="0.8" />
            {/* Bras droit */}
            <path d="M 143,65 C 156,68 166,80 168,105 C 170,125 166,148 170,165 L 158,165 C 156,148 156,126 154,106 C 152,88 144,72 139,68 Z"
              fill="#070709" stroke="#1b1b22" strokeWidth="0.8" />
            {/* Avant-bras droit */}
            <path d="M 170,165 C 174,175 176,195 174,215 L 162,215 C 162,195 160,175 158,165 Z"
              fill="#070709" stroke="#1b1b22" strokeWidth="0.8" />
            {/* Cuisse gauche */}
            <path d="M 82,228 C 76,235 72,260 74,285 C 76,300 80,310 84,318 L 100,318 C 102,308 104,295 104,280 C 104,260 106,238 110,228 Z"
              fill="#070709" stroke="#1b1b22" strokeWidth="0.8" />
            {/* Mollet gauche */}
            <path d="M 84,318 C 82,325 82,332 84,340 L 100,340 C 100,332 100,325 100,318 Z"
              fill="#070709" stroke="#1b1b22" strokeWidth="0.8" />
            {/* Cuisse droite */}
            <path d="M 138,228 C 144,235 148,260 146,285 C 144,300 140,310 136,318 L 120,318 C 118,308 116,295 116,280 C 116,260 114,238 110,228 Z"
              fill="#070709" stroke="#1b1b22" strokeWidth="0.8" />
            {/* Mollet droit */}
            <path d="M 120,318 C 120,325 120,332 120,340 L 136,340 C 138,332 138,325 136,318 Z"
              fill="#070709" stroke="#1b1b22" strokeWidth="0.8" />

            {/* ─── Muscles interactifs FACE ─── */}

            {/* TRAPÈZES (visible de face) */}
            <path d="M 103,52 C 92,56 83,60 79,65 L 88,70 C 92,65 98,60 105,56 Z" {...mp('traps')} />
            <path d="M 117,52 C 128,56 137,60 141,65 L 132,70 C 128,65 122,60 115,56 Z" {...mp('traps')} />

            {/* DELTOÏDES ANTÉRIEURS */}
            <path d="M 79,65 C 68,70 58,80 60,98 C 63,94 66,84 70,75 C 73,70 76,67 79,65 Z" {...mp('deltoids_ant')} />
            <path d="M 141,65 C 152,70 162,80 160,98 C 157,94 154,84 150,75 C 147,70 144,67 141,65 Z" {...mp('deltoids_ant')} />

            {/* PECTORAUX */}
            <path d="M 88,70 C 82,73 76,80 77,100 C 79,112 88,118 110,119 Z" {...mp('chest')} />
            <path d="M 132,70 C 138,73 144,80 143,100 C 141,112 132,118 110,119 Z" {...mp('chest')} />

            {/* BICEPS */}
            <path d="M 60,98 C 56,110 54,130 54,148 C 56,144 60,134 62,122 C 64,112 63,103 60,98 Z" {...mp('biceps')} />
            <path d="M 160,98 C 164,110 166,130 166,148 C 164,144 160,134 158,122 C 156,112 157,103 160,98 Z" {...mp('biceps')} />

            {/* TRICEPS (visible de face côté) */}
            <path d="M 66,100 C 66,120 66,140 66,155 L 62,155 C 62,140 60,120 60,100 Z" {...mp('triceps')} />
            <path d="M 154,100 C 154,120 154,140 154,155 L 158,155 C 158,140 160,120 160,100 Z" {...mp('triceps')} />

            {/* AVANT-BRAS */}
            <path d="M 54,148 C 50,160 48,180 48,200 C 50,198 54,185 56,170 C 58,160 57,152 54,148 Z" {...mp('forearms')} />
            <path d="M 166,148 C 170,160 172,180 172,200 C 170,198 166,185 164,170 C 162,160 163,152 166,148 Z" {...mp('forearms')} />

            {/* ABDOMINAUX (grands droits — 6 pavés) */}
            {[0,1,2].map(row => (
              <React.Fragment key={row}>
                <rect x="99" y={122 + row * 19} width="9" height="16" rx="3" {...mp('abs')} />
                <rect x="112" y={122 + row * 19} width="9" height="16" rx="3" {...mp('abs')} />
              </React.Fragment>
            ))}

            {/* OBLIQUES */}
            <path d="M 82,120 C 78,130 77,148 79,170 C 82,164 85,148 85,132 C 85,126 84,122 82,120 Z" {...mp('obliques')} />
            <path d="M 138,120 C 142,130 143,148 141,170 C 138,164 135,148 135,132 C 135,126 136,122 138,120 Z" {...mp('obliques')} />

            {/* QUADRICEPS */}
            {/* Vaste médial G */}
            <path d="M 95,235 C 90,248 86,268 86,290 C 88,300 92,308 96,316 L 100,316 C 99,302 97,278 96,258 C 95,248 95,240 95,235 Z" {...mp('quads')} />
            {/* Droit fémoral G */}
            <path d="M 100,228 C 99,240 99,258 100,278 C 101,295 102,308 102,318 L 108,318 C 108,308 107,292 106,275 C 104,255 103,238 100,228 Z" {...mp('quads')} />
            {/* Vaste latéral G */}
            <path d="M 108,230 C 106,242 106,260 108,280 C 110,296 112,308 112,318 L 116,318 C 115,308 113,295 112,278 C 111,260 110,244 108,230 Z" {...mp('quads')} />
            {/* Vaste médial D */}
            <path d="M 125,235 C 130,248 134,268 134,290 C 132,300 128,308 124,316 L 120,316 C 121,302 123,278 124,258 C 125,248 125,240 125,235 Z" {...mp('quads')} />
            {/* Droit fémoral D */}
            <path d="M 120,228 C 121,240 121,258 120,278 C 119,295 118,308 118,318 L 112,318 C 112,308 113,292 114,275 C 116,255 117,238 120,228 Z" {...mp('quads')} />
            {/* Vaste latéral D */}
            <path d="M 112,230 C 114,242 114,260 112,280 C 110,296 108,308 108,318 L 104,318 Z" {...mp('quads')} />

            {/* MOLLETS FACE (tibial antérieur) */}
            <path d="M 86,318 C 85,324 84,330 84,338 C 86,337 88,333 89,326 C 90,322 88,319 86,318 Z" {...mp('calves')} />
            <path d="M 134,318 C 135,324 136,330 136,338 C 134,337 132,333 131,326 C 130,322 132,319 134,318 Z" {...mp('calves')} />

          </g>

          {/* ═══════════════════════════════════════════════════
              VUE DOS  (viewbox 225→440, centré à x=330)
          ═══════════════════════════════════════════════════ */}
          <g id="back">

            {/* ─── Silhouette de base dos ─── */}
            <ellipse cx="330" cy="34" rx="15" ry="19" fill="#070709" stroke="#1b1b22" strokeWidth="1" />
            <rect x="323" y="51" width="14" height="14" rx="4" fill="#070709" stroke="#1b1b22" strokeWidth="0.8" />
            <path d="M 297,65 C 288,70 284,100 286,130 C 288,155 294,168 302,175 L 302,210 L 358,210 L 358,175 C 366,168 372,155 374,130 C 376,100 372,70 363,65 Z"
              fill="#070709" stroke="#1b1b22" strokeWidth="1" />
            <path d="M 302,210 C 298,215 296,220 299,228 L 361,228 C 364,220 362,215 358,210 Z"
              fill="#070709" stroke="#1b1b22" strokeWidth="0.8" />
            {/* Bras gauche dos */}
            <path d="M 297,65 C 284,68 274,80 272,105 C 270,125 274,148 270,165 L 282,165 C 284,148 284,126 286,106 C 288,88 296,72 301,68 Z"
              fill="#070709" stroke="#1b1b22" strokeWidth="0.8" />
            <path d="M 270,165 C 266,175 264,195 266,215 L 278,215 C 278,195 280,175 282,165 Z"
              fill="#070709" stroke="#1b1b22" strokeWidth="0.8" />
            {/* Bras droit dos */}
            <path d="M 363,65 C 376,68 386,80 388,105 C 390,125 386,148 390,165 L 378,165 C 376,148 376,126 374,106 C 372,88 364,72 359,68 Z"
              fill="#070709" stroke="#1b1b22" strokeWidth="0.8" />
            <path d="M 390,165 C 394,175 396,195 394,215 L 382,215 C 382,195 380,175 378,165 Z"
              fill="#070709" stroke="#1b1b22" strokeWidth="0.8" />
            {/* Cuisses dos */}
            <path d="M 302,228 C 296,235 292,260 294,285 C 296,300 300,310 304,318 L 320,318 C 322,308 324,295 324,280 C 324,260 326,238 330,228 Z"
              fill="#070709" stroke="#1b1b22" strokeWidth="0.8" />
            <path d="M 304,318 C 302,325 302,332 304,340 L 320,340 C 320,332 320,325 320,318 Z"
              fill="#070709" stroke="#1b1b22" strokeWidth="0.8" />
            <path d="M 358,228 C 364,235 368,260 366,285 C 364,300 360,310 356,318 L 340,318 C 338,308 336,295 336,280 C 336,260 334,238 330,228 Z"
              fill="#070709" stroke="#1b1b22" strokeWidth="0.8" />
            <path d="M 340,318 C 340,325 340,332 340,340 L 356,340 C 358,332 358,325 356,318 Z"
              fill="#070709" stroke="#1b1b22" strokeWidth="0.8" />

            {/* ─── Muscles interactifs DOS ─── */}

            {/* TRAPÈZES (grand trapèze dos) */}
            <path d="M 323,52 C 313,55 302,60 299,65 L 308,74 C 314,67 320,60 326,56 Z" {...mp('traps')} />
            <path d="M 337,52 C 347,55 358,60 361,65 L 352,74 C 346,67 340,60 334,56 Z" {...mp('traps')} />
            {/* Centre trapèze losange */}
            <path d="M 326,56 L 330,90 L 334,56 L 330,52 Z" {...mp('traps')} />

            {/* DELTOÏDES POSTÉRIEURS */}
            <path d="M 299,65 C 288,70 278,82 280,98 C 283,92 287,82 291,74 C 294,70 297,67 299,65 Z" {...mp('deltoids_post')} />
            <path d="M 361,65 C 372,70 382,82 380,98 C 377,92 373,82 369,74 C 366,70 363,67 361,65 Z" {...mp('deltoids_post')} />

            {/* DELTOÏDES LATÉRAUX */}
            <path d="M 291,74 C 283,82 278,95 280,110 C 282,106 284,96 286,88 C 288,82 289,78 291,74 Z" {...mp('deltoids_lat')} />
            <path d="M 369,74 C 377,82 382,95 380,110 C 378,106 376,96 374,88 C 372,82 371,78 369,74 Z" {...mp('deltoids_lat')} />

            {/* GRAND DORSAL */}
            <path d="M 308,74 C 302,82 296,100 296,125 C 298,140 302,155 308,168 C 312,155 314,140 312,125 C 310,108 310,90 308,74 Z" {...mp('lats')} />
            <path d="M 352,74 C 358,82 364,100 364,125 C 362,140 358,155 352,168 C 348,155 346,140 348,125 C 350,108 350,90 352,74 Z" {...mp('lats')} />

            {/* RHOMBOÏDES */}
            <path d="M 313,78 C 313,95 312,110 313,128 L 330,118 L 347,128 C 348,110 347,95 347,78 L 330,90 Z" {...mp('lats')} />

            {/* ÉRECTEURS (colonne vertébrale) */}
            <path d="M 324,95 C 322,115 322,140 324,165 C 326,175 328,182 330,185 C 332,182 334,175 336,165 C 338,140 338,115 336,95 C 334,90 332,90 330,90 C 328,90 326,90 324,95 Z" {...mp('lower_back')} />

            {/* TRICEPS DOS */}
            <path d="M 280,98 C 276,112 274,130 274,148 C 276,144 278,132 280,120 C 282,110 281,103 280,98 Z" {...mp('triceps')} />
            <path d="M 380,98 C 384,112 386,130 386,148 C 384,144 382,132 380,120 C 378,110 379,103 380,98 Z" {...mp('triceps')} />

            {/* AVANT-BRAS DOS */}
            <path d="M 274,148 C 270,160 268,180 270,200 C 272,198 275,186 277,170 C 278,160 277,153 274,148 Z" {...mp('forearms')} />
            <path d="M 386,148 C 390,160 392,180 390,200 C 388,198 385,186 383,170 C 382,160 383,153 386,148 Z" {...mp('forearms')} />

            {/* FESSIERS */}
            <path d="M 302,210 C 296,215 294,222 297,232 C 300,240 308,246 318,246 C 324,246 328,244 330,242 C 332,244 336,246 342,246 C 352,246 360,240 363,232 C 366,222 364,215 358,210 Z" {...mp('glutes')} />

            {/* ISCHIO-JAMBIERS */}
            {/* G */}
            <path d="M 302,232 C 298,244 296,264 298,285 C 300,300 304,310 306,318 L 318,318 C 318,308 316,292 314,272 C 312,254 308,240 302,232 Z" {...mp('hamstrings')} />
            {/* D */}
            <path d="M 358,232 C 362,244 364,264 362,285 C 360,300 356,310 354,318 L 342,318 C 342,308 344,292 346,272 C 348,254 352,240 358,232 Z" {...mp('hamstrings')} />

            {/* MOLLETS DOS (gastrocnémiens) */}
            <path d="M 306,318 C 304,325 304,334 306,342 C 308,338 311,330 313,322 L 313,318 Z" {...mp('calves')} />
            <path d="M 316,318 C 316,328 315,336 316,342 C 318,338 319,330 318,322 L 318,318 Z" {...mp('calves')} />
            <path d="M 344,318 C 344,328 345,336 344,342 C 342,338 341,330 342,322 L 342,318 Z" {...mp('calves')} />
            <path d="M 354,318 C 356,325 356,334 354,342 C 352,338 349,330 347,322 L 347,318 Z" {...mp('calves')} />

          </g>

        </svg>
      </div>

      {/* Légende */}
      <div className="w-full mt-2 flex items-center justify-around border-t border-zinc-900 pt-2 text-[9px] text-zinc-500 font-bold uppercase tracking-wider">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full border border-zinc-700 bg-zinc-800" />
          <span>Repos</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-teal-600 shadow-[0_0_5px_rgba(20,184,166,0.4)]" />
          <span className="text-teal-400">Optimum</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-600 shadow-[0_0_5px_rgba(245,158,11,0.4)]" />
          <span className="text-amber-400">Fatigue</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-red-600 shadow-[0_0_6px_rgba(239,68,68,0.5)] animate-pulse" />
          <span className="text-red-400">Surcharge</span>
        </div>
      </div>

      {/* Tooltip fixe au curseur */}
      {tooltipPos && hoveredMuscle && (
        <div
          style={{
            position: 'fixed',
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y}px`,
            zIndex: 9999,
            pointerEvents: 'none',
          }}
          className="w-[200px] rounded-xl border border-zinc-800/80 bg-zinc-950/95 backdrop-blur-md p-3 text-xs shadow-2xl shadow-black/90"
        >
          <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800">
            <span className="font-bold text-white tracking-wide truncate">{hoveredMuscle.name}</span>
            <span className={`h-2 w-2 rounded-full shrink-0 ml-1 ${
              hoveredMuscle.color === 'green'  ? 'bg-emerald-400 shadow-[0_0_6px_#10b981]'
            : hoveredMuscle.color === 'orange' ? 'bg-amber-400 shadow-[0_0_6px_#f59e0b]'
            : hoveredMuscle.color === 'red'    ? 'bg-red-400 shadow-[0_0_6px_#ef4444] animate-ping'
            : 'bg-zinc-600'}`}
            />
          </div>
          <div className="mt-2 space-y-1 text-zinc-400">
            <div className="flex justify-between items-center">
              <span>Statut :</span>
              <span className={`font-bold text-[10px] uppercase tracking-wider ${
                hoveredMuscle.color === 'green'  ? 'text-emerald-400'
              : hoveredMuscle.color === 'orange' ? 'text-amber-400'
              : hoveredMuscle.color === 'red'    ? 'text-red-400'
              : 'text-zinc-500'}`}>
                {hoveredMuscle.color === 'green' && 'OPTIMAL'}
                {hoveredMuscle.color === 'orange' && 'FATIGUE'}
                {hoveredMuscle.color === 'red' && 'SURCHARGE'}
                {hoveredMuscle.color === 'grey' && 'REPOS'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>INOL :</span>
              <span className="font-bold text-white">{hoveredMuscle.inol} / 1.20</span>
            </div>
            <div className="flex justify-between">
              <span>Séries :</span>
              <span className="font-bold text-zinc-300">{hoveredMuscle.sets}</span>
            </div>
          </div>
          {hoveredMuscle.contributors.length > 0 && (
            <div className="mt-2 pt-1.5 border-t border-zinc-800">
              <span className="text-[9px] text-zinc-600 block mb-1 font-bold uppercase tracking-widest">Exercices :</span>
              <div className="space-y-1">
                {hoveredMuscle.contributors.map((c, i) => (
                  <div key={i} className="flex justify-between text-[10px]">
                    <span className="text-zinc-400 truncate max-w-[120px]">{c.nom}</span>
                    <span className="font-bold text-emerald-400 text-[9px]">{c.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
