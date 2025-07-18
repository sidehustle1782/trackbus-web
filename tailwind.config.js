/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ['Inter', 'sans-serif'], // Keep Inter, it's clean and widely available
      },
      colors: { // Apple.com Dark Mode inspired palette
        'app-bg': '#1C1C1E', // Very dark background (like iOS dark mode)
        'app-card': '#2C2C2E', // Slightly lighter for cards/elements
        'app-border': '#48484A', // Subtle borders
        'app-text-primary': '#F2F2F7', // Light text for main content
        'app-text-secondary': '#AEAEB2', // Medium gray for labels/secondary info
        'app-blue': '#0A84FF', // Apple's system blue
        'app-blue-dark': '#007AFF', // A slightly darker blue for hover
        'app-green': '#30D158', // Apple's system green (for success/profit)
        'app-red': '#FF453A', // Apple's system red (for error/loss)
        'app-button-bg': '#404042', // Darker silver for buttons
        'app-button-hover': '#505052', // Even darker on hover for distinct feedback
      },
      boxShadow: {
        'soft-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(255, 255, 255, 0.05)', // Subtle shadow for depth
        'soft-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(255, 255, 255, 0.05)',
      },
      borderRadius: {
        'xl': '0.75rem', // Default Tailwind xl
        '2xl': '1rem', // Slightly more rounded for cards
        '3xl': '1.5rem', // Even more rounded for main containers
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        popIn: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'fade-in-down': 'fadeInDown 0.7s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.7s ease-out forwards',
        'pop-in': 'popIn 0.3s ease-out forwards',
      },
    },
  },
  plugins: [],
};
