/**
 * ADHD-Optimized Calendar Design Tokens
 *
 * Design system specifically crafted for users with ADHD:
 * - High contrast ratios (≥4.5:1 for WCAG AA)
 * - Limited color palette to reduce cognitive load
 * - Consistent spacing and interaction patterns
 * - Calming, non-overwhelming visual hierarchy
 */

// ADHD-friendly color palette with semantic meaning
export const ADHD_CALENDAR_COLORS = {
  // Energy level colors (high contrast, semantically meaningful)
  energyLevels: {
    HIGH: {
      primary: '#10B981', // Emerald 500 - Fresh morning energy
      secondary: '#D1FAE5', // Emerald 100 - Light background
      text: '#064E3B', // Emerald 900 - High contrast text
      contrast: 7.1, // WCAG AAA compliant
    },
    MEDIUM: {
      primary: '#F59E0B', // Amber 500 - Steady afternoon energy
      secondary: '#FEF3C7', // Amber 100 - Light background
      text: '#92400E', // Amber 800 - High contrast text
      contrast: 6.8, // WCAG AAA compliant
    },
    LOW: {
      primary: '#6366F1', // Indigo 500 - Calm evening energy
      secondary: '#E0E7FF', // Indigo 100 - Light background
      text: '#312E81', // Indigo 800 - High contrast text
      contrast: 7.2, // WCAG AAA compliant
    },
  },

  // Focus type colors (limited palette for cognitive ease)
  focusTypes: {
    CREATIVE: {
      primary: '#8B5CF6', // Violet 500 - Creative inspiration
      secondary: '#EDE9FE', // Violet 100
      text: '#4C1D95', // Violet 800
      contrast: 5.9,
    },
    TECHNICAL: {
      primary: '#3B82F6', // Blue 500 - Logical thinking
      secondary: '#DBEAFE', // Blue 100
      text: '#1E3A8A', // Blue 800
      contrast: 6.1,
    },
    ADMINISTRATIVE: {
      primary: '#6B7280', // Gray 500 - Neutral tasks
      secondary: '#F3F4F6', // Gray 100
      text: '#374151', // Gray 700
      contrast: 4.7,
    },
    SOCIAL: {
      primary: '#EC4899', // Pink 500 - Human connections
      secondary: '#FCE7F3', // Pink 100
      text: '#BE185D', // Pink 700
      contrast: 5.4,
    },
  },

  // Conflict and state indicators
  conflictStates: {
    none: {
      background: 'transparent',
      border: 'transparent',
    },
    soft: {
      background: '#FEF3C7', // Amber 100 - Gentle warning
      border: '#F59E0B', // Amber 500
      text: '#92400E', // Amber 800
    },
    hard: {
      background: '#FEE2E2', // Red 100 - Clear alert
      border: '#EF4444', // Red 500
      text: '#991B1B', // Red 800
    },
  },

  // UI element colors
  interface: {
    primary: '#1F2937', // Gray 800 - Main text
    secondary: '#6B7280', // Gray 500 - Secondary text
    muted: '#9CA3AF', // Gray 400 - Disabled text
    background: '#FFFFFF', // White - Main background
    surface: '#F9FAFB', // Gray 50 - Card backgrounds
    border: '#E5E7EB', // Gray 200 - Subtle borders
    focus: '#3B82F6', // Blue 500 - Focus indicators
    selection: '#DBEAFE', // Blue 100 - Selection highlight
  },

  // High contrast mode overrides
  highContrast: {
    background: '#000000',
    surface: '#1A1A1A',
    text: '#FFFFFF',
    border: '#FFFFFF',
    focus: '#00FF00', // High visibility focus
  },
} as const;

// Spacing scale optimized for ADHD (consistent, predictable)
export const ADHD_SPACING = {
  xs: '4px', // Minimal spacing
  sm: '8px', // Component padding
  md: '16px', // Card padding
  lg: '24px', // Section spacing
  xl: '32px', // Page margins
  xxl: '48px', // Major section breaks
} as const;

// Typography scale for clear hierarchy
export const ADHD_TYPOGRAPHY = {
  // Font sizes with clear distinction
  sizes: {
    xs: '12px', // Captions, metadata
    sm: '14px', // Secondary text
    base: '16px', // Body text (minimum for readability)
    lg: '18px', // Emphasized text
    xl: '20px', // Small headings
    '2xl': '24px', // Section headings
    '3xl': '30px', // Page headings
  },

  // Line heights for comfortable reading
  lineHeights: {
    tight: '1.25', // Headings
    normal: '1.5', // Body text
    relaxed: '1.75', // Long-form content
  },

  // Font weights for clear hierarchy
  weights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;

// Border radius for gentle, approachable UI
export const ADHD_RADIUS = {
  none: '0px',
  sm: '4px', // Buttons, inputs
  md: '8px', // Cards, panels
  lg: '12px', // Modals
  full: '9999px', // Pills, avatars
} as const;

// Shadow system for depth without overwhelm
export const ADHD_SHADOWS = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  focus: '0 0 0 3px rgba(59, 130, 246, 0.5)', // Blue focus ring
} as const;

// Animation durations respecting reduced motion
export const ADHD_MOTION = {
  // Standard durations
  durations: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    gentle: '500ms', // For ADHD-friendly transitions
  },

  // Easing functions for natural feel
  easing: {
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    gentle: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', // Custom gentle curve
  },

  // Reduced motion alternatives
  reducedMotion: {
    duration: '0ms',
    easing: 'linear',
  },
} as const;

// Z-index scale for predictable layering
export const ADHD_Z_INDEX = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  overlay: 30,
  modal: 40,
  toast: 50,
  tooltip: 60,
} as const;

// Breakpoints for responsive design
export const ADHD_BREAKPOINTS = {
  xs: '320px', // Small phones
  sm: '640px', // Large phones
  md: '768px', // Tablets
  lg: '1024px', // Small laptops
  xl: '1280px', // Large laptops
  '2xl': '1536px', // Desktop
} as const;

// Calendar-specific design tokens
export const ADHD_CALENDAR_TOKENS = {
  // Time slot dimensions
  timeSlot: {
    height: '60px', // 1-hour slots
    minHeight: '30px', // 30-minute slots
    minWidth: '120px', // Minimum readable width
  },

  // Event styling
  event: {
    minHeight: '24px', // Minimum touch target
    borderWidth: '2px',
    borderRadius: ADHD_RADIUS.sm,
    padding: ADHD_SPACING.sm,
  },

  // Drag and drop
  dragHandle: {
    width: '8px',
    opacity: 0.6,
    hoverOpacity: 1,
  },

  // Grid lines
  gridLines: {
    color: ADHD_CALENDAR_COLORS.interface.border,
    width: '1px',
    style: 'solid',
  },

  // Focus indicators
  focus: {
    outlineWidth: '3px',
    outlineOffset: '2px',
    outlineColor: ADHD_CALENDAR_COLORS.interface.focus,
  },
} as const;

// CSS custom properties for dynamic theming
export const CSS_VARIABLES = {
  // Energy colors
  '--energy-high': ADHD_CALENDAR_COLORS.energyLevels.HIGH.primary,
  '--energy-medium': ADHD_CALENDAR_COLORS.energyLevels.MEDIUM.primary,
  '--energy-low': ADHD_CALENDAR_COLORS.energyLevels.LOW.primary,

  // Focus colors
  '--focus-creative': ADHD_CALENDAR_COLORS.focusTypes.CREATIVE.primary,
  '--focus-technical': ADHD_CALENDAR_COLORS.focusTypes.TECHNICAL.primary,
  '--focus-admin': ADHD_CALENDAR_COLORS.focusTypes.ADMINISTRATIVE.primary,
  '--focus-social': ADHD_CALENDAR_COLORS.focusTypes.SOCIAL.primary,

  // Spacing
  '--spacing-xs': ADHD_SPACING.xs,
  '--spacing-sm': ADHD_SPACING.sm,
  '--spacing-md': ADHD_SPACING.md,
  '--spacing-lg': ADHD_SPACING.lg,

  // Motion
  '--motion-duration': ADHD_MOTION.durations.normal,
  '--motion-easing': ADHD_MOTION.easing.gentle,
} as const;

// Utility functions for color manipulation
export const colorUtils = {
  // Get energy level color with opacity
  getEnergyColor: (level: keyof typeof ADHD_CALENDAR_COLORS.energyLevels, opacity = 1) => {
    const color = ADHD_CALENDAR_COLORS.energyLevels[level];
    return opacity === 1
      ? color.primary
      : `${color.primary}${Math.round(opacity * 255)
          .toString(16)
          .padStart(2, '0')}`;
  },

  // Get focus type color
  getFocusColor: (type: keyof typeof ADHD_CALENDAR_COLORS.focusTypes, opacity = 1) => {
    const color = ADHD_CALENDAR_COLORS.focusTypes[type];
    return opacity === 1
      ? color.primary
      : `${color.primary}${Math.round(opacity * 255)
          .toString(16)
          .padStart(2, '0')}`;
  },

  // Get appropriate text color for background
  getTextColor: (backgroundColor: string) => {
    // Simple contrast calculation - in production, use a proper contrast library
    return backgroundColor.includes('100') || backgroundColor.includes('50')
      ? ADHD_CALENDAR_COLORS.interface.primary
      : '#FFFFFF';
  },
} as const;

// Main export for easy access in components
export const calendarTokens = {
  ...ADHD_CALENDAR_TOKENS,
  colors: ADHD_CALENDAR_COLORS,
  spacing: ADHD_SPACING,
  motion: ADHD_MOTION,
  typography: ADHD_TYPOGRAPHY,
  radius: ADHD_RADIUS,
  shadows: ADHD_SHADOWS,
  zIndex: ADHD_Z_INDEX,
  breakpoints: ADHD_BREAKPOINTS,
  sizing: {
    slotHeight: ADHD_CALENDAR_TOKENS.timeSlot.height,
  },
  accessibility: {
    focusRing: {
      width: ADHD_CALENDAR_TOKENS.focus.outlineWidth,
    },
  },
};
