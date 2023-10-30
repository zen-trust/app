import colors from "tailwindcss/colors.js";

/**
 * @type {import('tailwindcss').Config}
 */
// eslint-disable-next-line import/no-default-export -- required for Tailwind
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        black: '#100F0F',
        white: '#FFFFFA',
        paper: '#FFFCF0',
        gray: {
          50: '#F2F0E5',
          100: '#E6E4D9',
          200: '#DAD8CE',
          300: '#CECDC3',
          400: '#B7B5AC',
          500: '#878580',
          600: '#6F6E69',
          700: '#575653',
          800: '#403E3C',
          900: '#282726',
          950: '#1C1B1A',
        },
        red: {
          ...colors.red,
          500: '#D14D41',
          600: '#AF3029',
        },
        orange: {
          ...colors.orange,
          500: '#DA702C',
          600: '#BC5215',
        },
        yellow: {
          ...colors.yellow,
          500: '#D0A215',
          600: '#AD8301',
        },
        green: {
          ...colors.green,
          50: '#F3F5E1',
          100: '#E1E6A6',
          200: '#CEDB6D',
          300: '#BBC232',
          400: '#A9B800',
          500: '#879A39',
          600: '#66800B',
          700: '#5C740B',
          800: '#52680A',
          900: '#3F4F09',
        },
        cyan: {
          ...colors.cyan,
          500: '#3AA99F',
          600: '#24837B',
        },
        blue: {
          ...colors.blue,
          500: '#4385BE',
          600: '#205EA6',
        },
        purple: {
          ...colors.purple,
          500: '#8B7EC8',
          600: '#5E409D',
        },
        violet: {
          ...colors.violet,
          500: '#CE5D97',
          600: '#A02F6F',
        },
      },
    },
  },
  plugins: [],
}
