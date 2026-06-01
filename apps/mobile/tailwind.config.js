/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
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
  plugins: [],
};
