/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      // ===== COLORS =====
      colors: {
        // CSS variable-based colors for theme switching
        background: 'var(--background)',
        'background-secondary': 'var(--background-secondary)',
        'background-muted': 'var(--background-muted)',

        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        'text-inverse': 'var(--text-inverse)',

        'border-primary': 'var(--border-primary)',
        'border-secondary': 'var(--border-secondary)',
        'border-muted': 'var(--border-muted)',

        'interactive-primary': 'var(--interactive-primary)',
        'interactive-primary-hover': 'var(--interactive-primary-hover)',
        'interactive-primary-active': 'var(--interactive-primary-active)',
        'interactive-secondary': 'var(--interactive-secondary)',
        'interactive-secondary-hover': 'var(--interactive-secondary-hover)',
        'interactive-secondary-active': 'var(--interactive-secondary-active)',

        // Brand colors
        brand: {
          50: 'var(--color-brand-50)',
          100: 'var(--color-brand-100)',
          200: 'var(--color-brand-200)',
          300: 'var(--color-brand-300)',
          400: 'var(--color-brand-400)',
          500: 'var(--color-brand-500)',
          600: 'var(--color-brand-600)',
          700: 'var(--color-brand-700)',
          800: 'var(--color-brand-800)',
          900: 'var(--color-brand-900)',
          950: 'var(--color-brand-950)',
        },

        // Neutral colors
        neutral: {
          50: 'var(--color-neutral-50)',
          100: 'var(--color-neutral-100)',
          200: 'var(--color-neutral-200)',
          300: 'var(--color-neutral-300)',
          400: 'var(--color-neutral-400)',
          500: 'var(--color-neutral-500)',
          600: 'var(--color-neutral-600)',
          700: 'var(--color-neutral-700)',
          800: 'var(--color-neutral-800)',
          900: 'var(--color-neutral-900)',
          950: 'var(--color-neutral-950)',
        },

        // ADHD-specific energy level colors
        energy: {
          high: 'var(--color-energy-high)',
          medium: 'var(--color-energy-medium)',
          low: 'var(--color-energy-low)',
        },

        // Semantic colors
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)',
        info: 'var(--color-info)',

        // Focus colors
        focus: 'var(--color-focus)',
        'focus-ring': 'var(--color-focus-ring)',
      },

      // ===== TYPOGRAPHY =====
      fontFamily: {
        heading: 'var(--font-heading)',
        body: 'var(--font-body)',
        mono: 'var(--font-mono)',
      },

      fontSize: {
        xs: 'var(--font-size-xs)',
        sm: 'var(--font-size-sm)',
        base: 'var(--font-size-base)',
        lg: 'var(--font-size-lg)',
        xl: 'var(--font-size-xl)',
        '2xl': 'var(--font-size-2xl)',
        '3xl': 'var(--font-size-3xl)',
        '4xl': 'var(--font-size-4xl)',
        '5xl': 'var(--font-size-5xl)',
        '6xl': 'var(--font-size-6xl)',
      },

      lineHeight: {
        tight: 'var(--line-height-tight)',
        normal: 'var(--line-height-normal)',
        relaxed: 'var(--line-height-relaxed)',
      },

      fontWeight: {
        light: 'var(--font-weight-light)',
        normal: 'var(--font-weight-normal)',
        medium: 'var(--font-weight-medium)',
        semibold: 'var(--font-weight-semibold)',
        bold: 'var(--font-weight-bold)',
      },

      // ===== SPACING =====
      spacing: {
        0.5: 'var(--spacing-0_5)',
        1.5: 'var(--spacing-1_5)',
        2.5: 'var(--spacing-2_5)',
        3.5: 'var(--spacing-3_5)',
      },

      // ===== BORDER RADIUS =====
      borderRadius: {
        sm: 'var(--radius-sm)',
        base: 'var(--radius-base)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        full: 'var(--radius-full)',
      },

      // ===== SHADOWS =====
      boxShadow: {
        sm: 'var(--shadow-sm)',
        base: 'var(--shadow-base)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
        '2xl': 'var(--shadow-2xl)',
        focus: 'var(--shadow-focus)',
      },

      // ===== TRANSITIONS =====
      transitionDuration: {
        fast: 'var(--transition-fast)',
        base: 'var(--transition-base)',
        slow: 'var(--transition-slow)',
      },

      // ===== Z-INDEX =====
      zIndex: {
        dropdown: 'var(--z-dropdown)',
        sticky: 'var(--z-sticky)',
        fixed: 'var(--z-fixed)',
        modal: 'var(--z-modal)',
        popover: 'var(--z-popover)',
        tooltip: 'var(--z-tooltip)',
      },

      // ===== ACCESSIBILITY =====
      // Minimum target sizes for touch/click interactions
      minWidth: {
        target: '44px',
      },
      minHeight: {
        target: '44px',
      },

      // ===== BACKGROUND IMAGES =====
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [
    // Add custom utilities for ADHD-friendly design
    function ({ addUtilities, theme }) {
      const newUtilities = {
        // Energy level utilities
        '.energy-high': {
          color: 'var(--color-energy-high)',
        },
        '.energy-medium': {
          color: 'var(--color-energy-medium)',
        },
        '.energy-low': {
          color: 'var(--color-energy-low)',
        },

        // ADHD-friendly spacing utilities
        '.space-generous > * + *': {
          marginTop: 'var(--spacing-6)',
        },
        '.space-comfortable > * + *': {
          marginTop: 'var(--spacing-4)',
        },
        '.space-compact > * + *': {
          marginTop: 'var(--spacing-2)',
        },

        // Accessibility utilities
        '.sr-only': {
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: '0',
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: '0',
        },
        '.sr-only-focusable:focus': {
          position: 'static',
          width: 'auto',
          height: 'auto',
          padding: 'inherit',
          margin: 'inherit',
          overflow: 'visible',
          clip: 'auto',
          whiteSpace: 'normal',
        },

        // Focus utilities for better accessibility
        '.focus-ring': {
          '&:focus-visible': {
            outline: '2px solid var(--color-focus)',
            outlineOffset: '2px',
            boxShadow: 'var(--shadow-focus)',
          },
        },

        // Reduced motion utilities
        '.motion-safe': {
          '@media (prefers-reduced-motion: no-preference)': {
            transitionProperty: 'all',
            transitionDuration: 'var(--transition-base)',
          },
        },
        '.motion-reduce': {
          '@media (prefers-reduced-motion: reduce)': {
            animationDuration: '0.01ms !important',
            animationIterationCount: '1 !important',
            transitionDuration: '0.01ms !important',
            scrollBehavior: 'auto !important',
          },
        },
      };

      addUtilities(newUtilities);
    },
  ],
};
