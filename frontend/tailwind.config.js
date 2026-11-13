/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#F8FAFC',
        card: '#FFFFFF',
        // Distinctive modern dark palette (Obsidian Slate & Cobalt Steel - avoiding generic neon violet AI look)
        slateDark: {
          bg: '#0C0F17',
          surface: '#131824',
          elevated: '#1A2234',
          border: '#232D42',
          borderSubtle: '#1C2436',
          text: '#F1F5F9',
          muted: '#94A3B8',
        },
        brand: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB', // Sleek Technical Cobalt
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
      },
      boxShadow: {
        'soft': '0 2px 14px rgba(0, 0, 0, 0.035)',
        'soft-hover': '0 8px 24px rgba(37, 99, 235, 0.08)',
        'dark-soft': '0 4px 20px rgba(0, 0, 0, 0.35)',
        'glow-cobalt': '0 0 25px rgba(59, 130, 246, 0.18)',
      },
      borderRadius: {
        'xl': '0.875rem',
        '2xl': '1.125rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
}
