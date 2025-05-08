/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
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
