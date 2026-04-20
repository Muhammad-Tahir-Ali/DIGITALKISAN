/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './hooks/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2E7D32',
          50: '#E8F5E9',
          100: '#C8E6C9',
          200: '#A5D6A7',
          300: '#81C784',
          400: '#66BB6A',
          500: '#4CAF50',
          600: '#43A047',
          700: '#388E3C',
          800: '#2E7D32',
          900: '#1B5E20',
        },
        secondary: {
          DEFAULT: '#F9A825',
          50: '#FFF9C4',
          100: '#FFF59D',
          200: '#FFF176',
          300: '#FFEE58',
          400: '#FFEB3B',
          500: '#FDD835',
          600: '#FBC02D',
          700: '#F9A825',
          800: '#F57F17',
          900: '#E65100',
        },
        background: '#FAFAF8',
        surface: '#FFFFFF',
        textPrimary: '#1A1A1A',
        textSecondary: '#6B7280',
        error: '#D32F2F',
        success: '#388E3C',
      },
      fontFamily: {
        sans: ['System'],
      },
    },
  },
  plugins: [],
};
