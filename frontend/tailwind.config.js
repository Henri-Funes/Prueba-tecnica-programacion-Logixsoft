/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ocean: {
          50: '#eef6ff',
          100: '#d9ebff',
          500: '#2f79c6',
          600: '#2868aa',
          700: '#1f4f81'
        }
      }
    }
  },
  plugins: []
};
