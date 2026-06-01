import { create } from 'twrnc';

// Bypassing tailwind.config.js to avoid "tailwindcss/resolveConfig" Metro resolution error.
// We configure the theme directly in the twrnc create method.
const tw = create({
  theme: {
    extend: {
      colors: {
        'surgical-white': '#FFFFFF',
        'zinc-400': '#A1A1AA',
        'chirurgical-red': '#EF4444',
        'ghost-border': 'rgba(255, 255, 255, 0.1)',
        'glass-fill': 'rgba(255, 255, 255, 0.03)',
        'glass-border': 'rgba(255, 255, 255, 0.08)',
        'surface': '#131313',
        'surface-container': '#1f1f1f',
        'surface-dim': '#131313',
        'on-primary': '#2f3131',
      },
    },
  },
});

export default tw;
