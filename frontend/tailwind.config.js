/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // CinePass Color Palette
                primary: {
                    DEFAULT: 'hsl(var(--primary))',
                    foreground: 'hsl(var(--primary-foreground))',
                    400: '#7E2553',
                    500: '#7E2553',
                    600: '#6B1F46',
                },
                secondary: {
                    DEFAULT: 'hsl(var(--secondary))',
                    foreground: 'hsl(var(--secondary-foreground))',
                    400: '#FF5C80',
                    500: '#FF5C80',
                    700: '#E64D6F',
                },
                tertiary: {
                    400: '#85A3B2',
                    500: '#85A3B2',
                    700: '#6D8A97',
                },
                success: {
                    400: '#22c55e',
                    500: '#16a34a',
                },
                warning: {
                    400: '#DEAA23',
                    500: '#d97706',
                },
                danger: {
                    400: '#ef4444',
                    500: '#dc2626',
                },
                info: {
                    400: '#3b82f6',
                    500: '#2563eb',
                },
                surface: {
                    dark: {
                        950: '#1E3442',
                        900: '#1E3442',
                    },
                    light: {
                        100: '#E9D8C8',
                        50: '#E9D8C8',
                    },
                },
                // Shadcn defaults
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                destructive: {
                    DEFAULT: 'hsl(var(--destructive))',
                    foreground: 'hsl(var(--destructive-foreground))',
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))',
                },
                accent: {
                    DEFAULT: 'hsl(var(--accent))',
                    foreground: 'hsl(var(--accent-foreground))',
                },
                popover: {
                    DEFAULT: 'hsl(var(--popover))',
                    foreground: 'hsl(var(--popover-foreground))',
                },
                card: {
                    DEFAULT: 'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))',
                },
            },
            borderRadius: {
                lg: '0px', // Brutalist: no border radius
                md: '0px',
                sm: '0px',
            },
            borderWidth: {
                DEFAULT: '2px',
                '0': '0px',
                '2': '2px',
                '4': '4px',
                '8': '8px',
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                display: ['Inter', 'sans-serif'],
            },
            fontWeight: {
                regular: '400',
                medium: '500',
                bold: '700',
                black: '900',
            },
            fontSize: {
                xs: '12px',
                sm: '14px',
                base: '16px',
                lg: '18px',
                xl: '20px',
                '2xl': '24px',
                '3xl': '32px',
                '4xl': '40px',
                '5xl': '48px',
                '6xl': '56px',
            },
            spacing: {
                '0': '0px',
                '1': '8px',
                '2': '16px',
                '3': '24px',
                '4': '32px',
                '5': '40px',
                '6': '48px',
                '8': '64px',
                '10': '80px',
                '12': '96px',
                '16': '128px',
            },
        },
    },
    plugins: [],
}
