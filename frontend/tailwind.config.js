/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            /* ── Colors ── */
            colors: {
                /* Background / Foreground via CSS vars */
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',

                /* Brand */
                primary: {
                    DEFAULT: 'hsl(var(--primary))',
                    foreground: 'hsl(var(--primary-foreground))',
                    // Direct-access shades
                    400: '#9A2E65',
                    500: '#7E2553',
                    600: '#6B1F46',
                },
                secondary: {
                    DEFAULT: 'hsl(var(--secondary))',
                    foreground: 'hsl(var(--secondary-foreground))',
                    400: '#FF7A96',
                    500: '#FF5C80',
                    600: '#E64D6F',
                },
                tertiary: {
                    DEFAULT: 'hsl(var(--tertiary))',
                    400: '#9AB4C1',
                    500: '#85A3B2',
                    600: '#6D8A97',
                },

                /* Semantic */
                success: {
                    DEFAULT: 'hsl(var(--success))',
                    400: '#22C55E',
                    500: '#16A34A',
                },
                info: {
                    DEFAULT: 'hsl(var(--info))',
                    400: '#60A5FA',
                    500: '#3B82F6',
                },
                warning: {
                    DEFAULT: 'hsl(var(--warning))',
                    400: '#E6B830',
                    500: '#DBA212',
                },
                destructive: {
                    DEFAULT: 'hsl(var(--destructive))',
                    foreground: 'hsl(var(--destructive-foreground))',
                    400: '#EF4444',
                    500: '#DC2626',
                },

                /* Surfaces */
                card: {
                    DEFAULT: 'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))',
                },
                popover: {
                    DEFAULT: 'hsl(var(--popover))',
                    foreground: 'hsl(var(--popover-foreground))',
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))',
                },
                accent: {
                    DEFAULT: 'hsl(var(--accent))',
                    foreground: 'hsl(var(--accent-foreground))',
                },

                /* Borders & inputs */
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',

                /* Direct access to theme raw colors */
                'screek-bg-light': '#E9D8C8',
                'screek-bg-dark': '#190207',
                'screek-text-light': '#190207',
                'screek-text-dark': '#E9D8C8',

                /* Legacy aliases — backward compat with existing components */
                surface: {
                    dark: {
                        800: '#2A0C14',
                        900: '#1F0610',
                        950: '#190207',
                    },
                    light: {
                        50: '#E9D8C8',
                        100: '#E9D8C8',
                    },
                },
            },

            /* ── Typography ── */
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                display: ['Outfit', 'system-ui', 'sans-serif'],
            },
            fontWeight: {
                regular: '400',
                medium: '500',
                semibold: '600',
                bold: '700',
                extrabold: '800',
                black: '900',
            },
            fontSize: {
                xs: ['12px', { lineHeight: '16px' }],
                sm: ['14px', { lineHeight: '20px' }],
                base: ['16px', { lineHeight: '24px' }],
                lg: ['18px', { lineHeight: '28px' }],
                xl: ['20px', { lineHeight: '28px' }],
                '2xl': ['24px', { lineHeight: '32px' }],
                '3xl': ['32px', { lineHeight: '40px' }],
                '4xl': ['40px', { lineHeight: '48px' }],
                '5xl': ['48px', { lineHeight: '56px' }],
                '6xl': ['56px', { lineHeight: '64px' }],
            },

            /* ── Spacing (8px grid) ── */
            spacing: {
                '0': '0px',
                '1': '8px',
                '2': '16px',
                '3': '24px',
                '4': '32px',
                '5': '40px',
                '6': '48px',
                '7': '56px',
                '8': '64px',
                '9': '72px',
                '10': '80px',
                '12': '96px',
                '16': '128px',
            },

            /* ── Border Radius — Brutalist ── */
            borderRadius: {
                lg: 'var(--radius)',
                md: 'var(--radius)',
                sm: 'var(--radius)',
            },

            /* ── Border Width ── */
            borderWidth: {
                DEFAULT: '2px',
                '0': '0px',
                '2': '2px',
                '4': '4px',
                '8': '8px',
            },
        },
    },
    plugins: [],
}
