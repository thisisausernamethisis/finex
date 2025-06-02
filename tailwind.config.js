/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',   // for ConfidenceBadge.tsx
  ],
  future: {
    // Enable v4 features in v3.x for easier migration
    unstable_flexGapPolyfill: true,
    disableColorOpacityUtilitiesByDefault: true,
    respectDefaultRingColorOpacity: true,
    hoverWhenAccessible: true,
  },
  theme: {
    extend: {
      /**
       * Palette migrated from "Core Simplicity" prototype
       * Use these semantic tokens instead of hard‑coded hex values.
       */
      colors: {
        primary: {
          DEFAULT: '#2563eb',
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a'
        },
        success: {
          DEFAULT: '#059669',
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b'
        },
        danger: {
          DEFAULT: '#dc2626'
        },
        neutral: {
          DEFAULT: '#e5e7eb'
        }
      },

      /**
       * Radii & shadows (cards, tiles)
       */
      borderRadius: {
        '2xl': '1rem'
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.1)'
      },
      
      // Ensure color opacity utilities work consistently with v4
      opacity: {
        '0': '0',
        '5': '0.05',
        '10': '0.1', 
        '20': '0.2',
        '25': '0.25',
        '30': '0.3',
        '40': '0.4',
        '50': '0.5',
        '60': '0.6',
        '70': '0.7',
        '75': '0.75',
        '80': '0.8',
        '90': '0.9',
        '95': '0.95',
        '100': '1',
      },
    },
  },
  plugins: [],
}
