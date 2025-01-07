/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'gunmetal': '#272D2D',
        'rose-quartz': '#A39BA8',
        'powder-blue': '#B8C5D6',
        'alice-blue': '#EDF5FC',
        'emerald': '#23CE6B',
        dark: {
          'bg-primary': '#1A1D1D',
          'bg-secondary': '#222626',
          'text-primary': '#EDF5FC',
          'text-secondary': '#B8C5D6',
          'border': '#374151'
        }
      },
      animation: {
        'fadeIn': 'fadeIn 0.5s ease-in-out',
        'slideUp': 'slideUp 0.5s ease-in-out',
        'scale': 'scale 0.3s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scale: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

