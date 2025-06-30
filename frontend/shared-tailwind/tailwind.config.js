/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [], // Will be overridden by host/remote apps
  theme: {
    extend: {
      colors: {
        // Define theme-specific colors for buttons
        'theme-default': {
          primary: '#f97316', // Orange-500
          600: '#ea580c', // Orange-600
          700: '#c2410c', // Orange-700
        },
        'theme-blue': {
          primary: '#3b82f6', // Blue-500
          600: '#2563eb', // Blue-600
          700: '#1d4ed8', // Blue-700
        },
        'theme-green': {
          primary: '#059669', // Emerald-600
          600: '#047857', // Emerald-700
          700: '#065f46', // Emerald-800
        },
        secondary: {
          DEFAULT: '#64748b', // Slate-500
          400: '#9ca3af', // Slate-400
          600: '#374151', // Slate-700
        },
        background: {
          DEFAULT: '#f8fafc', // Slate-50
          secondary: '#ffffff', // White
          surface: '#f1f5f9', // Slate-100
        },
        text: {
          DEFAULT: '#0f172a', // Slate-900
          secondary: '#64748b', // Slate-500
        },
        sidebar: {
          bg: '#1e293b', // Slate-800 for default
          hover: '#334155', // Slate-700
        },
        success: '#10b981', // Emerald-500
        warning: '#f59e0b', // Amber-500
        error: '#ef4444', // Red-500
      },
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
        'theme': 'background-color, color, border-color',
      },
      fontFamily: {
        sans: ['Nuntio', 'sans-serif'],
      },
    },
  },
  plugins: [],
};