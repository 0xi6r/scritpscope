/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./sidepanel.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        risk: {
          high: '#ef4444',
          medium: '#f97316',
          low: '#eab308',
          none: '#22c55e'
        },
        // Dark mode palette
        dark: {
          950: '#000000',
          900: '#0a0a0a',
          850: '#141414',
          800: '#1a1a1a',
          750: '#262626',
          700: '#333333',
          600: '#4a4a4a',
          500: '#666666'
        }
      }
    }
  },
  plugins: []
};
