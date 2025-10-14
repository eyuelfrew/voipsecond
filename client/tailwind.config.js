
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Original colors (keeping for compatibility)
        primary: "#6750A4",
        onPrimary: "#FFFFFF",
        primaryContainer: "#EADDFF",
        onPrimaryContainer: "#21005D",
        surface: "#FFFBFE",
        onSurface: "#1C1B1F",
        surfaceVariant: "#E7E0EC",
        onSurfaceVariant: "#49454F",
        outlineVariant: "#CAC4D0",
        error: "#B3261E",
        onError: "#FFFFFF",
        
        // Call Center Theme Colors
        'cc-yellow': {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
        'cc-black': {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
          950: '#000000',
        }
      },
      animation: {
        'fade-in': 'fade-in 0.6s ease-out',
        'fade-in-delay': 'fade-in 0.6s ease-out 0.3s both',
        'fade-in-delay-300': 'fade-in 0.8s ease-out 0.3s both',
        'fade-in-delay-600': 'fade-in 1s ease-out 0.6s both',
        'shake': 'shake 0.5s ease-in-out',
        'bounce-slow': 'bounce 2s infinite',
        'pulse-slow': 'pulse 3s infinite',
        'pulse-slower': 'pulse 4s infinite',
        'pulse-slowest': 'pulse 6s infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'ping-slower': 'ping 4s cubic-bezier(0, 0, 0.2, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'glow': {
          '0%': { boxShadow: '0 0 20px rgba(251, 191, 36, 0.3)' },
          '100%': { boxShadow: '0 0 40px rgba(251, 191, 36, 0.6)' },
        }
      },
      animationDelay: {
        '300': '300ms',
        '500': '500ms',
        '600': '600ms',
        '900': '900ms',
        '1000': '1000ms',
        '2000': '2000ms',
      }
    },
  },

  plugins: [],
}