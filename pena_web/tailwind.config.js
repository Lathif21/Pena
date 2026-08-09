/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6C5DD3',
          'hover': '#5A4CC0'
        },
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444'
      }
    }
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')]
}
