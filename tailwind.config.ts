// ============================================================================
// RATIO.RUN - TAILWIND CONFIG
// Premium dark mode with glassmorphism and distinctive design system
// ============================================================================

import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Premium Gray Scale (darker, more sophisticated)
        gray: {
          950: '#0A0A0B',
          900: '#111113',
          850: '#181819',
          800: '#1F2023',
          750: '#28292E',
          700: '#35373D',
          600: '#4B4D55',
          500: '#6B6D75',
          400: '#92949C',
        },
        // Distinctive accent colors (avoiding generic purple)
        electric: {
          blue: '#00E5FF',
          cyan: '#00FFFF',
          mint: '#00FFB8',
        },
        neon: {
          green: '#39FF14',
          pink: '#FF006E',
          orange: '#FF3D00',
        },
      },
      fontFamily: {
        // Distinctive font choices (avoiding Inter/Roboto)
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-cabinet-grotesk)', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.75rem' }],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        glow: {
          '0%': {
            boxShadow: '0 0 20px rgba(0, 229, 255, 0.3)',
          },
          '100%': {
            boxShadow: '0 0 40px rgba(0, 229, 255, 0.6)',
          },
        },
        float: {
          '0%, 100%': {
            transform: 'translateY(0px)',
          },
          '50%': {
            transform: 'translateY(-20px)',
          },
        },
        shimmer: {
          '0%': {
            backgroundPosition: '-1000px 0',
          },
          '100%': {
            backgroundPosition: '1000px 0',
          },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-lg': '0 24px 48px 0 rgba(0, 0, 0, 0.5)',
        'neon-blue': '0 0 20px rgba(0, 229, 255, 0.5)',
        'neon-green': '0 0 20px rgba(57, 255, 20, 0.5)',
        'neon-pink': '0 0 20px rgba(255, 0, 110, 0.5)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
        'shimmer-gradient': 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '100': '25rem',
        '112': '28rem',
        '128': '32rem',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
    require('@tailwindcss/aspect-ratio'),
    // Custom plugin for glassmorphism utilities
    function({ addUtilities }: any) {
      const glassUtilities = {
        '.glass': {
          background: 'rgba(17, 17, 19, 0.4)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
        },
        '.glass-strong': {
          background: 'rgba(17, 17, 19, 0.6)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
        '.glass-subtle': {
          background: 'rgba(17, 17, 19, 0.2)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.02)',
        },
      };
      
      addUtilities(glassUtilities);
    },
  ],
};

export default config;
