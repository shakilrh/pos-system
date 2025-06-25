/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [], // Will be overridden by host/remote apps
  theme: {
    extend: {
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
      },
      fontFamily: {
        /*sans: ['Roboto', 'sans-serif'],*/
        sans: ['Nuntio', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
