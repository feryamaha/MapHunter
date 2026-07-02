import type { Config } from 'tailwindcss'
import defaultTheme from 'tailwindcss/defaultTheme'
import plugin from 'tailwindcss/plugin'

export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          25: '#F0F4FA',
          50: '#E0E9F5',
          100: '#C2D2EB',
          200: '#9DB8DF',
          300: '#6E94CB',
          400: '#3D6BA8',
          500: '#1A3D6E',
          600: '#142E54',
          700: '#0F2140',
          800: '#0A1630',
          900: '#060B1E',
          950: '#03060F'
        },
        secondary: {
          0: "#FFFFFF",
          25: "#FBFBFB",
          50: "#F6F6F6",
          100: "#E7E7E7",
          200: "#D1D1D1",
          300: "#B0B0B0",
          400: "#888888",
          500: "#6D6D6D",
          600: "#5D5D5D",
          700: "#4F4F4F",
          800: "#454545",
          900: "#3D3D3D",
          950: "#191919"
        },

        accent: {
          white: '#FFFFFF',
          light: '#E8EEF5',
          default: '#1A3D6E',
          dark: '#0F2140'
        },
        auxiliary: {
          default: '#F44336',
          success: {
            background: '#EEFFF3',
            border: '#B1E4BF',
            default: '#119551'
          },
          danger: {
            background: '#FFF6F8',
            border: '#FFA7A0',
            default: '#DF554B',
            dark: '#DF554B'
          },
          info: {
            background: '#F1F6FD',
            border: '#A7C5FD',
            default: '#1759D3',
            dark: '#1759D3'
          },
          warning: {
            background: '#FFFBED',
            border: '#FCD28C',
            default: '#E69A1A',
            dark: '#664102'
          }
        },

        complementary: {
          25: '#EAFBEC',
          50: '#D3F6D9',
          100: '#ADF0B8',
          200: '#87E997',
          300: '#61E277',
          400: '#3DDB5B',
          500: '#1EB03E',
          600: '#189032',
          700: '#137026',
          800: '#0E501B',
          900: '#093012',
          950: '#051F0C'
        },
        neutral: {
          900: '#222222',
          800: '#323232',
          700: '#494949',
          600: '#606060',
          500: '#767676',
          400: '#8D8D8D',
          300: '#A4A4A4',
          200: '#BABABA',
          100: '#EBEBEB',
          50: '#F6F6F6',
          25: '#FAFAFA'
        },
        stroke: {
          50: '#ECECEC',
          100: '#E6E6E6',
          200: '#D1D1D1',
          300: '#B0B0B0'
        },
        sidebar: {
          'gradient-end': '#0B1730',
          'text': '#EAF1FB',
          'text-muted': '#8FA6C9',
          'text-label': '#5E7BA6',
          'text-inactive': '#AEC2E0',
          'danger': '#FF6F61',
          'danger-text': '#FF9E93',
          'danger-hover': '#FF8A80',
        },
        surface: {
          'app': '#EFF2F7',
          'table-header': '#F5F8FC',
          'table-hover': '#F6F9FD',
          'table-divider': '#EFEFEF',
          'detail-panel': '#F7FAFD',
          'detail-border': '#E6EDF6',
        }
      },
      backgroundImage: {
        'bg-auth-background': "url('/assets/images/image-bg-login.png')",
        'bg-overlay-light': 'rgba(0, 0, 0, 0.06)',
        'bg-overlay-dark':
          'linear-gradient(180deg, rgba(0, 0, 0, 0.70) 0%, rgba(0, 0, 0, 0.60) 100%);',
        'bg-overlay-medium':
          'linear-gradient(0deg, rgba(0, 0, 0, 0.00) 55.95%, rgba(0, 0, 0, 0.30) 89.66%), linear-gradient(90deg, rgba(0, 0, 0, 0.70) 27.81%, rgba(0, 0, 0, 0.00) 80.31%)',
        'bg-overlay-header':
          'linear-gradient(90deg, rgba(34, 34, 34, 0.50) 0%, rgba(34, 34, 34, 0.08) 100%)',
        'bg-overlay-social':
          'linear-gradient(180deg, #000 0%, rgba(0, 0, 0, 0.00) 50%, #000 100%)',
        'bg-chart-area-evolucao':
          'linear-gradient(180deg, rgba(26, 61, 110, 0.38) 0%, rgba(26, 61, 110, 0.00) 89.02%)'
      },
      fontFamily: {
        lato: ['var(--font-lato)', 'sans-serif'],
        inter: ['var(--font-inter)', 'sans-serif'],
        openSans: ['var(--font-open-sans)', 'sans-serif'],
        IbmPlexMono: ['var(--font-ibmMono-sans)', 'sans-serif']
      },
      boxShadow: {
        '10': '0 1px 4px 0 rgba(0, 0, 0, 0.08), 0 1px 2px 0 rgba(25, 25, 25, 0.08)',
        '60': '0 4px 12px 0 rgba(25, 25, 25, 0.20)',
        '69': '0 4px 16px 0 rgba(66, 69, 77, 0.06), 0 2px 6px 0 rgba(66, 69, 77, 0.10)',
        'negative-footer': '0 -4px 14px 0 rgba(0, 0, 0, 0.08)'
      },
      keyframes: {
        modalSlideIn: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(0)' }
        },
        modalSlideOut: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(0)' }
        },
        overlayFadeIn: {
          from: { opacity: '1' },
          to: { opacity: '1' }
        },
        overlayFadeOut: {
          from: { opacity: '1' },
          to: { opacity: '1' }
        },
        iconTranslateLeft: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-2px)' }
        },
        progress: {
          '0%': { width: '0%' },
          '100%': { width: '100%' }
        }
      },
      animation: {
        'modal-slide-in': 'modalSlideIn 0s linear forwards',
        'modal-slide-out': 'modalSlideOut 0s linear forwards',
        'modal-overlay-fade-in': 'overlayFadeIn 0s linear forwards',
        'modal-overlay-fade-out': 'overlayFadeOut 0s linear forwards',
        'icon-translate-left': 'iconTranslateLeft 0.3s ease-in-out',
        'progress': 'progress var(--slide-duration) linear forwards'
      }
    },
    container: {
      center: true,
      padding: '5%',
      screens: {
        '2xl': '1440px',
        xl: '1440px',
        lg: '1440px',
        md: '100%',
        sm: '100%'
      }
    },
    fontSize: {
      xs: ['0.75rem', '140%'],
      sm: ['0.875rem', '140%'],
      md: ['1rem', '140%'],
      xl: ['1.125rem', '140%'],
      '2xl': ['1.25rem', '140%'],
      '3xl': ['2rem', '120%'],
      '4xl': ['2.5rem', '120%'],
      '5xl': ['3rem', '120%'],
      '6xl': ['4rem', '120%']
    },
    screens: {
      ...defaultTheme.screens,
      '@mobile': { min: '639px' },
      '@tablet': { min: '999px' },
      '@laptop': { min: '1025px' },
      '@Desktop': { min: '1281px' },
      '@Desktop1440': { min: '1438px' },
      '@LargeDesktop': { min: '1537px' },
      '@UltraWide': { min: '1929px' }
    }
  },
  plugins: [
    plugin(({ addUtilities, theme }) => {
      // Pegando as cores do seu tema para manter a consistência
      const neutral100 = theme('colors.neutral.100') as string;
      const neutral200 = theme('colors.neutral.200') as string;
      const neutral300 = theme('colors.neutral.300') as string;
      const neutral500 = theme('colors.neutral.500') as string;

      addUtilities({
        '.scrollbar-custom': {
          /* Largura da barra */
          '&::-webkit-scrollbar': {
            width: '12px',
          },
          /* Pista (Track) */
          '&::-webkit-scrollbar-track': {
            backgroundColor: neutral100,
            borderTopLeftRadius: '0px',
            borderTopRightRadius: '0px',
            borderBottomLeftRadius: '0px',
            borderBottomRightRadius: '0px',
          },
          /* Botão (Thumb) */
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: neutral300,
            borderRadius: '9999px',
            border: `2px solid ${neutral100}`, // O segredo do afastamento
          },
          /* Hover no Thumb */
          '&::-webkit-scrollbar-thumb:hover': {
            backgroundColor: neutral500,
          },
          /* Dark Mode nativo via seletor de classe .dark */
          '.dark &::-webkit-scrollbar-track': {
            backgroundColor: neutral200,
          },
          '.dark &::-webkit-scrollbar-thumb': {
            backgroundColor: neutral500,
            border: `2px solid ${neutral200}`,
          },
        },
        '.scrollbar-none': {
          'scrollbar-width': 'none',
          '-ms-overflow-style': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
        '.letter-spacing': {
          '&-0048': {
            letterSpacing: '-0.048px',
          },
          '&-04': {
            letterSpacing: '-0.4px',
          },
          '&-304': {
            letterSpacing: '-0.304px',
          },
          '&-01': {
            letterSpacing: '-0.1px',
          },
        },
        '.line-height': {
          '&-110': {
            lineHeight: '110%',
          },
          '&-120': {
            lineHeight: '120%',
          },
          '&-130': {
            lineHeight: '130%',
          },
          '&-140': {
            lineHeight: '140%',
          },
          '&-150': {
            lineHeight: '150%',
          },
        },
      });
    }),
    function ({ addUtilities }: { addUtilities: any }) {
      addUtilities({
        '.animate-play-running': {
          'animation-play-state': 'running',
        },
        '.animate-play-paused': {
          'animation-play-state': 'paused',
        },
      })
    },
  ],

} satisfies Config
