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
        canvas: '#F5F5F7',
        card: '#FFFFFF',
        // Apple-style dark midnight obsidian with cosmic lilac lighting
        appleDark: {
          bg: '#07080D',
          card: '#0F1018',
          surface: '#141522',
          surfaceHover: '#1B1C2E',
          border: 'rgba(255, 255, 255, 0.07)',
          borderHover: 'rgba(255, 255, 255, 0.14)',
          text: '#F5F5F7',
          muted: '#8E95A5',
          accent: '#A78BFA',
          accentLight: '#C4B5FD',
        },
        // Apple-style clean light palette
        appleLight: {
          bg: '#F5F5F7',
          card: '#FFFFFF',
          surface: '#EAEAEF',
          border: '#E5E5EA',
          text: '#1D1D1F',
          muted: '#86868B',
        },
        slateDark: {
          bg: '#07080D',
          surface: '#0F1018',
          elevated: '#141522',
          border: 'rgba(255, 255, 255, 0.07)',
          borderSubtle: 'rgba(255, 255, 255, 0.04)',
          text: '#F5F5F7',
          muted: '#8E95A5',
        },
        brand: {
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9',
          800: '#5B21B6',
          900: '#4C1D95',
        },
      },
      fontFamily: {
        sans: ['Nunito', 'Poppins', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
      },
      boxShadow: {
        'soft': '0 2px 14px rgba(0, 0, 0, 0.035)',
        'apple-card': '0 8px 30px rgba(0, 0, 0, 0.45)',
        'apple-card-light': '0 4px 20px rgba(0, 0, 0, 0.04)',
        'apple-glow': '0 0 35px rgba(167, 139, 250, 0.16)',
        'dock': '0 10px 40px rgba(0, 0, 0, 0.5)',
      },
      borderRadius: {
        'xl': '0.875rem',
        '2xl': '1.125rem',
        '3xl': '1.5rem',
        'squircle': '1.375rem',
      },
    },
  },
  plugins: [],
}
