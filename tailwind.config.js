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
        }
      }
    }
  },
  plugins: []
};
