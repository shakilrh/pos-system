/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [], // Will be overridden by host/remote apps
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--primary-color)',
          50: 'var(--primary-50, #fff7ed)',
          100: 'var(--primary-100, #ffedd5)',
          500: 'var(--primary-color)',
          600: 'var(--primary-600, #ea580c)',
          700: 'var(--primary-700, #c2410c)',
        },
        // Override existing Tailwind colors to use CSS variables
        orange: {
          500: 'var(--primary-color)',
          600: 'var(--secondary-color)',
        },
        blue: {
          500: 'var(--primary-color)',
          600: 'var(--secondary-color)',
        },
        green: {
          500: 'var(--primary-color)',
          600: 'var(--secondary-color)',
        },
        gray: {
          100: 'var(--background-color)',
          800: 'var(--sidebar-bg)',
          900: 'var(--text-color)',
        },
        secondary: {
          DEFAULT: 'var(--secondary-color)',
          400: 'var(--secondary-400, #9ca3af)',
          500: 'var(--secondary-color)',
          600: 'var(--secondary-600, #374151)',
        },
        background: {
          DEFAULT: 'var(--background-color)',
          primary: 'var(--background-color)',
          secondary: 'var(--background-secondary, #ffffff)',
        },
        text: {
          DEFAULT: 'var(--text-color)',
          primary: 'var(--text-color)',
          secondary: 'var(--text-secondary, #6b7280)',
        },
        sidebar: {
          bg: 'var(--sidebar-bg)',
          hover: 'var(--sidebar-bg-hover)',
        }
      },
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
        'theme': 'background-color, color, border-color',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};