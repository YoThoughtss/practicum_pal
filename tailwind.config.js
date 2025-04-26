module.exports = {
  content: [
    './index.html',
    './pages/**/*.{html,js}',
    './users/**/*.{html,js}',
    './components/**/*.{html,js}',
  ],
  theme: {
    extend: {
      cursor: {
        'not-allowed': 'not-allowed',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'fade-out': 'fadeOut 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateX(100%)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
         fadeOut: {
          '0%': { opacity: '1', transform: 'translateX(0)' },
          '100%': { opacity: '0', transform: 'translateX(100%)' },
        },
      },
    },
  },
  plugins: [],
};
