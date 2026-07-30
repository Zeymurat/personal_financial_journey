/** @type {import('tailwindcss').Config} */
/**
 * Elite palette: deep navy + cream + champagne gold accent
 * charcoal (yedek): #2A2622 / #3D3732
 */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar))',
          foreground: 'hsl(var(--sidebar-foreground))',
          muted: 'hsl(var(--sidebar-muted))',
        },
        gold: {
          DEFAULT: '#C4A574',
          soft: '#D4BC94',
          deep: '#A68955',
          muted: '#E8D9C0',
        },
        brand: {
          ink: '#0F2744',
          'ink-light': '#163A5F',
          'ink-muted': '#1A3352',
          'ink-deep': '#0A1B2E',
          champagne: '#EAE0C8',
          'champagne-dark': '#D9CDB0',
          'champagne-muted': '#F0E8D4',
          /** Cool pearl page (cream değil) */
          page: '#F2F4F7',
          surface: '#FFFFFF',
          'surface-muted': '#F7F8FA',
          'page-dark': '#0B1520',
          'surface-dark': '#132232',
          'surface-dark-muted': '#1A2C40',
        },
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #0F2744 0%, #163A5F 100%)',
        'brand-gradient-soft':
          'linear-gradient(135deg, #0A1B2E 0%, #0F2744 55%, #163A5F 100%)',
        'gold-sheen':
          'linear-gradient(135deg, #A68955 0%, #C4A574 45%, #D4BC94 100%)',
      },
      boxShadow: {
        brand: '0 1px 3px hsl(213 40% 12% / 0.06), 0 4px 16px hsl(213 40% 12% / 0.05)',
        'brand-lg': '0 4px 24px hsl(213 40% 12% / 0.1)',
        warm: '0 1px 3px hsl(213 40% 12% / 0.05), 0 8px 28px hsl(213 40% 12% / 0.07)',
        'warm-lg': '0 8px 32px hsl(213 40% 12% / 0.12)',
        gold: '0 4px 20px hsl(38 35% 45% / 0.22)',
        elite: '0 1px 0 hsl(42 40% 96% / 0.06) inset, 0 8px 32px hsl(213 50% 8% / 0.18)',
      },
    },
  },
  plugins: [],
};
