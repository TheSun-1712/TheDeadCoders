/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary": "#135bec",
        "primary-dark": "#0d43b3",
        "background-light": "#f6f6f8",
        "background-dark": "#101622",
        "surface-dark": "#1a2234",
        "surface-darker": "#151b29",
        "danger": "#ef4444",
        "success": "#10b981",
        "warning": "#f59e0b",
        "alert-red": "#ef4444",
        "alert-orange": "#f97316",
        "success-green": "#22c55e",
      },
      fontFamily: {
        "display": ["Space Grotesk", "sans-serif"],
        "mono": ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        "lg": "0.5rem",
        "xl": "0.75rem",
      },
      boxShadow: {
          'neon': '0 0 10px rgba(19, 91, 236, 0.3), 0 0 20px rgba(19, 91, 236, 0.1)',
          'neon-red': '0 0 10px rgba(239, 68, 68, 0.4), 0 0 20px rgba(239, 68, 68, 0.2)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'dash': 'dash 4s linear infinite',
      },
      keyframes: {
          dash: {
              '0%': { strokeDashoffset: '1000' },
              '100%': { strokeDashoffset: '0' },
          }
      }
    },
  },
  plugins: [],
}
