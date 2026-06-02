import { create } from 'twrnc';

// Bypassing tailwind.config.js to avoid "tailwindcss/resolveConfig" Metro resolution error.
// We configure the theme directly in the twrnc create method.
const tw = create({
  theme: {
    extend: {
      colors: {
        'surgical-white': '#FFFFFF',
        'zinc-950': '#09090b',
        'zinc-900': '#18181b',
        'zinc-800': '#27272a',
        'zinc-50': '#fafafa',
        'zinc-400': '#a1a1aa',
        'ghost-border': 'rgba(255, 255, 255, 0.08)',
        'glass-fill': 'rgba(255, 255, 255, 0.03)',
        'glass-border': 'rgba(255, 255, 255, 0.08)',
        'surface': '#09090b',
        'surface-container': '#18181b',
        'surface-dim': '#09090b',
        'on-primary': '#fafafa',
      },
    },
  },
});

export default tw;
