/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          500: '#4f46e5',
          600: '#4338ca'
        },
        accent: {
          cyan: '#06b6d4',
          purple: '#a855f7'
        }
      },
      borderRadius: {
        '2xl': '1rem'
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(129,140,248,0.20), 0 18px 40px rgba(79,70,229,0.25)',
        soft: '0 12px 28px rgba(15,23,42,0.14)'
      }
    }
  },
  plugins: []
};
