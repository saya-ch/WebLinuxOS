/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./apps/**/*.{js,ts,jsx,tsx}",
    "./packages/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#1e1e1e',
          secondary: '#252526',
          tertiary: '#2d2d2d'
        },
        accent: {
          primary: '#007acc',
          secondary: '#3794ff'
        },
        text: {
          primary: '#cccccc',
          secondary: '#858585'
        },
        border: {
          DEFAULT: '#3c3c3c'
        },
        success: '#4ec9b0',
        warning: '#dcdcaa',
        error: '#f14c4c'
      }
    }
  },
  plugins: []
}
