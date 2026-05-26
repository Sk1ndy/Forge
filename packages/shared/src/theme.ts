/**
 * FORGE — Shared Design Tokens
 * Import from both apps/web (Tailwind/React) and apps/mobile (React Native / Expo)
 */

export const FATIGUE_COLORS = {
  /** Muscle at rest / no data */
  grey: {
    fill: '#1c1c22',
    stroke: '#27272a',
    text: '#71717a',
    label: 'Au repos',
  },
  /** Optimal training zone — MV to MEV */
  green: {
    fill: '#0d9488',
    stroke: '#14b8a6',
    text: '#10b981',
    label: 'Optimal',
  },
  /** Approaching MRV — reduce volume */
  orange: {
    fill: '#d97706',
    stroke: '#f59e0b',
    text: '#f59e0b',
    label: 'Surcharge',
  },
  /** MRV exceeded — stop / deload */
  red: {
    fill: '#dc2626',
    stroke: '#ef4444',
    text: '#ef4444',
    label: 'Danger',
  },
} as const;

export type FatigueColor = keyof typeof FATIGUE_COLORS;

export const GRADE_COLORS: Record<string, { color: string; glow: string; label: string }> = {
  S: { color: '#10b981', glow: 'rgba(16,185,129,0.5)',  label: 'Élite'          },
  A: { color: '#14b8a6', glow: 'rgba(20,184,166,0.45)', label: 'Excellent'       },
  B: { color: '#3b82f6', glow: 'rgba(59,130,246,0.45)', label: 'Très Bon'        },
  C: { color: '#f59e0b', glow: 'rgba(245,158,11,0.45)', label: 'Correct'         },
  D: { color: '#f97316', glow: 'rgba(249,115,22,0.4)',  label: 'À Améliorer'     },
  F: { color: '#ef4444', glow: 'rgba(239,68,68,0.5)',   label: 'Programme Risqué'},
};

export const SNC_COLORS = {
  safe:    { color: '#10b981', label: 'SNC OK'         },
  warning: { color: '#f59e0b', label: 'Charge Élevée'  },
  danger:  { color: '#ef4444', label: 'BURNOUT'        },
} as const;

export function getSncLevel(pct: number): keyof typeof SNC_COLORS {
  if (pct > 100) return 'danger';
  if (pct > 80)  return 'warning';
  return 'safe';
}

export function getReadinessColor(score: number): string {
  if (score >= 90) return '#10b981';
  if (score >= 60) return '#f59e0b';
  return '#ef4444';
}

export function getFatigueColor(color: FatigueColor | string | undefined): string {
  if (!color || !(color in FATIGUE_COLORS)) return FATIGUE_COLORS.grey.text;
  return FATIGUE_COLORS[color as FatigueColor].text;
}
