/**
 * Design Tokens - TypeScript definitions for ADHD-friendly design system
 * 
 * These tokens provide type-safe access to design values and enable
 * consistent theming across the application with accessibility in mind.
 */

// ===== COLOR SYSTEM =====

export const colors = {
  // Primary Brand Colors
  brand: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554',
  },

  // Neutral Colors (Gray scale)
  neutral: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
    950: '#030712',
  },

  // ADHD-Specific Energy Level Colors
  energy: {
    high: '#ef4444',    // Red - High energy/urgency
    medium: '#f59e0b',  // Yellow - Medium energy
    low: '#10b981',     // Green - Low energy/calm
  },

  // Semantic Colors
  semantic: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },

  // Focus and Interaction
  focus: {
    primary: '#2563eb',
    ring: '#93c5fd',
  },
} as const;

// ===== TYPOGRAPHY SYSTEM =====

export const typography = {
  fontFamily: {
    heading: "'Inter', ui-sans-serif, system-ui, sans-serif",
    body: "'Inter', ui-sans-serif, system-ui, sans-serif",
    mono: "ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },

  // Font sizes based on 1.25 modular scale
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',    // 48px
    '6xl': '3.75rem', // 60px
  },

  // ADHD-friendly line heights (1.5x for better readability)
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  },

  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;

// ===== SPACING SYSTEM =====

// Base unit: 8px for consistent spacing
export const spacing = {
  0: '0',
  px: '1px',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  1.5: '0.375rem',  // 6px
  2: '0.5rem',      // 8px
  2.5: '0.625rem',  // 10px
  3: '0.75rem',     // 12px
  3.5: '0.875rem',  // 14px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  7: '1.75rem',     // 28px
  8: '2rem',        // 32px
  10: '2.5rem',     // 40px
  12: '3rem',       // 48px
  16: '4rem',       // 64px
  20: '5rem',       // 80px
  24: '6rem',       // 96px
  32: '8rem',       // 128px
} as const;

// ===== BORDER RADIUS =====

export const borderRadius = {
  none: '0',
  sm: '0.125rem',   // 2px
  base: '0.25rem',  // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  full: '9999px',
} as const;

// ===== SHADOWS =====

export const boxShadow = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  focus: '0 0 0 3px var(--color-focus-ring)',
} as const;

// ===== TRANSITIONS =====

export const transition = {
  fast: '150ms ease',
  base: '200ms ease',
  slow: '300ms ease',
} as const;

// ===== Z-INDEX =====

export const zIndex = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modal: 1040,
  popover: 1050,
  tooltip: 1060,
} as const;

// ===== THEME CONFIGURATION =====

export interface Theme {
  name: string;
  cssClass: string;
  colors: {
    background: string;
    backgroundSecondary: string;
    backgroundMuted: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    textInverse: string;
    borderPrimary: string;
    borderSecondary: string;
    borderMuted: string;
    interactivePrimary: string;
    interactivePrimaryHover: string;
    interactivePrimaryActive: string;
    interactiveSecondary: string;
    interactiveSecondaryHover: string;
    interactiveSecondaryActive: string;
  };
}

export const themes: Record<'light' | 'dark', Theme> = {
  light: {
    name: 'Light',
    cssClass: '',
    colors: {
      background: colors.neutral[50],
      backgroundSecondary: colors.neutral[100],
      backgroundMuted: colors.neutral[200],
      textPrimary: colors.neutral[900],
      textSecondary: colors.neutral[700],
      textMuted: colors.neutral[500],
      textInverse: colors.neutral[50],
      borderPrimary: colors.neutral[200],
      borderSecondary: colors.neutral[300],
      borderMuted: colors.neutral[100],
      interactivePrimary: colors.brand[600],
      interactivePrimaryHover: colors.brand[700],
      interactivePrimaryActive: colors.brand[800],
      interactiveSecondary: colors.neutral[200],
      interactiveSecondaryHover: colors.neutral[300],
      interactiveSecondaryActive: colors.neutral[400],
    },
  },
  dark: {
    name: 'Dark',
    cssClass: 'dark',
    colors: {
      background: colors.neutral[950],
      backgroundSecondary: colors.neutral[900],
      backgroundMuted: colors.neutral[800],
      textPrimary: colors.neutral[50],
      textSecondary: colors.neutral[300],
      textMuted: colors.neutral[500],
      textInverse: colors.neutral[900],
      borderPrimary: colors.neutral[800],
      borderSecondary: colors.neutral[700],
      borderMuted: colors.neutral[900],
      interactivePrimary: colors.brand[500],
      interactivePrimaryHover: colors.brand[400],
      interactivePrimaryActive: colors.brand[300],
      interactiveSecondary: colors.neutral[800],
      interactiveSecondaryHover: colors.neutral[700],
      interactiveSecondaryActive: colors.neutral[600],
    },
  },
} as const;

// ===== COMPONENT VARIANTS =====

export const componentVariants = {
  button: {
    size: {
      sm: {
        padding: `${spacing[2]} ${spacing[3]}`,
        fontSize: typography.fontSize.sm,
        borderRadius: borderRadius.base,
      },
      base: {
        padding: `${spacing[2.5]} ${spacing[4]}`,
        fontSize: typography.fontSize.base,
        borderRadius: borderRadius.md,
      },
      lg: {
        padding: `${spacing[3]} ${spacing[6]}`,
        fontSize: typography.fontSize.lg,
        borderRadius: borderRadius.lg,
      },
    },
    variant: {
      primary: 'bg-interactive-primary hover:bg-interactive-primary-hover text-text-inverse',
      secondary: 'bg-interactive-secondary hover:bg-interactive-secondary-hover text-text-primary',
      outline: 'border border-border-primary hover:bg-background-secondary text-text-primary',
      ghost: 'hover:bg-background-secondary text-text-primary',
    },
  },
  input: {
    size: {
      sm: {
        padding: `${spacing[1.5]} ${spacing[2.5]}`,
        fontSize: typography.fontSize.sm,
        borderRadius: borderRadius.base,
      },
      base: {
        padding: `${spacing[2.5]} ${spacing[3.5]}`,
        fontSize: typography.fontSize.base,
        borderRadius: borderRadius.md,
      },
      lg: {
        padding: `${spacing[3]} ${spacing[4]}`,
        fontSize: typography.fontSize.lg,
        borderRadius: borderRadius.lg,
      },
    },
  },
} as const;

// ===== ACCESSIBILITY HELPERS =====

export const accessibility = {
  // Minimum target sizes for touch/click (WCAG 2.2 AA)
  minTargetSize: {
    width: '44px',
    height: '44px',
  },
  
  // Focus ring specifications
  focusRing: {
    width: '2px',
    style: 'solid',
    color: colors.focus.primary,
    offset: '2px',
  },
  
  // Color contrast ratios (WCAG 2.2 AA compliant)
  contrast: {
    minimum: 4.5,   // For normal text
    large: 3,       // For large text (18px+ or 14px+ bold)
    enhanced: 7,    // AAA level for better accessibility
  },
  
  // Motion preferences
  motion: {
    reduce: 'prefers-reduced-motion: reduce',
    noPreference: 'prefers-reduced-motion: no-preference',
  },
  
  // Screen reader utilities
  screenReader: {
    only: 'sr-only',
    focusable: 'sr-only-focusable',
  },
} as const;

// ===== ENERGY LEVEL UTILITIES =====

export const energyLevels = {
  high: {
    color: colors.energy.high,
    label: 'High Energy',
    description: 'Tasks requiring immediate attention or high focus',
    priority: 3,
  },
  medium: {
    color: colors.energy.medium,
    label: 'Medium Energy',
    description: 'Tasks requiring moderate focus and energy',
    priority: 2,
  },
  low: {
    color: colors.energy.low,
    label: 'Low Energy',
    description: 'Tasks suitable for low energy periods',
    priority: 1,
  },
} as const;

// ===== BREAKPOINTS =====

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// ===== DESIGN TOKEN EXPORTS =====

export const designTokens = {
  colors,
  typography,
  spacing,
  borderRadius,
  boxShadow,
  transition,
  zIndex,
  themes,
  componentVariants,
  accessibility,
  energyLevels,
  breakpoints,
} as const;

export type DesignTokens = typeof designTokens;
export type ColorScale = keyof typeof colors.brand;
export type SpacingScale = keyof typeof spacing;
export type FontSize = keyof typeof typography.fontSize;
export type EnergyLevel = keyof typeof energyLevels;
export type ThemeName = keyof typeof themes;
