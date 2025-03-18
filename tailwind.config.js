/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{html,ts}"   // Asegura que revise todo tu código Angular
    ],
    theme: {
      extend: { colors: {
        green: {
          500: '#4CAF50',
          600: '#43A047'
        }
      }
        },
    },
    plugins: [],
  }
  