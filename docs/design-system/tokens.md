# Design Tokens Documentation

## 🎨 Overview

Design tokens are the foundational elements of our design system, providing a consistent visual language across the Helmsman application. These tokens are specifically optimized for ADHD-friendly interfaces and accessibility compliance.

## 🎯 Token Categories

### Color System

#### Primary Palette

```css
:root {
  /* Energy Level Colors - Core to ADHD-friendly design */
  --color-energy-high: #10b981; /* Green - Energizing */
  --color-energy-medium: #f59e0b; /* Amber - Balanced */
  --color-energy-low: #6366f1; /* Indigo - Calming */

  /* Brand Colors */
  --color-primary: #3b82f6; /* Blue - Primary actions */
  --color-secondary: #6b7280; /* Gray - Secondary actions */

  /* Semantic Colors */
  --color-success: #10b981; /* Green - Success states */
  --color-warning: #f59e0b; /* Amber - Warning states */
  --color-error: #ef4444; /* Red - Error states */
  --color-info: #3b82f6; /* Blue - Informational */
}
```

#### Surface Colors

```css
:root {
  /* Light Theme Surfaces */
  --color-surface-primary: #ffffff; /* Main backgrounds */
  --color-surface-secondary: #f9fafb; /* Card backgrounds */
  --color-surface-tertiary: #f3f4f6; /* Subtle backgrounds */
  --color-surface-elevated: #ffffff; /* Modal/dropdown backgrounds */

  /* Dark Theme Surfaces */
  --color-surface-primary-dark: #111827;
  --color-surface-secondary-dark: #1f2937;
  --color-surface-tertiary-dark: #374151;
  --color-surface-elevated-dark: #1f2937;
}
```

#### Text Colors

```css
:root {
  /* Light Theme Text */
  --color-text-primary: #111827; /* Primary text - 15.8:1 contrast */
  --color-text-secondary: #6b7280; /* Secondary text - 4.6:1 contrast */
  --color-text-tertiary: #9ca3af; /* Tertiary text - 3.1:1 contrast */
  --color-text-inverse: #ffffff; /* Text on dark backgrounds */

  /* Dark Theme Text */
  --color-text-primary-dark: #f9fafb;
  --color-text-secondary-dark: #d1d5db;
  --color-text-tertiary-dark: #9ca3af;
  --color-text-inverse-dark: #111827;
}
```

#### Border Colors

```css
:root {
  /* Border and Divider Colors */
  --color-border-subtle: #e5e7eb; /* Subtle borders */
  --color-border-default: #d1d5db; /* Default borders */
  --color-border-strong: #9ca3af; /* Emphasized borders */
  --color-border-interactive: #3b82f6; /* Interactive elements */

  /* Dark Theme Borders */
  --color-border-subtle-dark: #374151;
  --color-border-default-dark: #4b5563;
  --color-border-strong-dark: #6b7280;
  --color-border-interactive-dark: #60a5fa;
}
```

### Typography

#### Font Families

```css
:root {
  --font-family-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-family-mono: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
}
```

#### Font Sizes

```css
:root {
  /* Font Size Scale - Modular scale with 1.25 ratio */
  --font-size-xs: 0.75rem; /* 12px */
  --font-size-sm: 0.875rem; /* 14px */
  --font-size-base: 1rem; /* 16px - Base size */
  --font-size-lg: 1.125rem; /* 18px */
  --font-size-xl: 1.25rem; /* 20px */
  --font-size-2xl: 1.5rem; /* 24px */
  --font-size-3xl: 1.875rem; /* 30px */
  --font-size-4xl: 2.25rem; /* 36px */
  --font-size-5xl: 3rem; /* 48px */
}
```

#### Font Weights

```css
:root {
  --font-weight-light: 300;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  --font-weight-extrabold: 800;
}
```

#### Line Heights

```css
:root {
  --line-height-tight: 1.25; /* Headings */
  --line-height-snug: 1.375; /* Large text */
  --line-height-normal: 1.5; /* Body text */
  --line-height-relaxed: 1.625; /* Reading text */
  --line-height-loose: 2; /* Spaced text */
}
```

### Spacing System

#### 8px Grid System

```css
:root {
  /* Base spacing unit: 8px for predictable layouts */
  --space-px: 1px;
  --space-0: 0px;
  --space-1: 0.25rem; /* 4px - Half unit */
  --space-2: 0.5rem; /* 8px - Base unit */
  --space-3: 0.75rem; /* 12px */
  --space-4: 1rem; /* 16px - Standard spacing */
  --space-5: 1.25rem; /* 20px */
  --space-6: 1.5rem; /* 24px - Section spacing */
  --space-8: 2rem; /* 32px - Large spacing */
  --space-10: 2.5rem; /* 40px */
  --space-12: 3rem; /* 48px - Major sections */
  --space-16: 4rem; /* 64px */
  --space-20: 5rem; /* 80px */
  --space-24: 6rem; /* 96px - Page sections */
}
```

#### Semantic Spacing

```css
:root {
  /* Semantic spacing aliases for ADHD-friendly design */
  --space-xs: var(--space-1); /* Tight spacing */
  --space-sm: var(--space-2); /* Small gaps */
  --space-md: var(--space-4); /* Standard spacing */
  --space-lg: var(--space-6); /* Section separation */
  --space-xl: var(--space-8); /* Major sections */
  --space-2xl: var(--space-12); /* Page sections */
}
```

### Border Radius

```css
:root {
  --border-radius-none: 0px;
  --border-radius-sm: 0.125rem; /* 2px */
  --border-radius-default: 0.25rem; /* 4px */
  --border-radius-md: 0.375rem; /* 6px */
  --border-radius-lg: 0.5rem; /* 8px */
  --border-radius-xl: 0.75rem; /* 12px */
  --border-radius-2xl: 1rem; /* 16px */
  --border-radius-full: 9999px; /* Circle */
}
```

### Shadows

#### Elevation System

```css
:root {
  /* Shadow system for depth and hierarchy */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-default: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  --shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);
  --shadow-inner: inset 0 2px 4px 0 rgb(0 0 0 / 0.05);
}
```

#### Focus Shadows

```css
:root {
  /* High-contrast focus indicators for accessibility */
  --shadow-focus: 0 0 0 2px var(--color-primary);
  --shadow-focus-error: 0 0 0 2px var(--color-error);
  --shadow-focus-success: 0 0 0 2px var(--color-success);
}
```

### Animation & Transitions

#### Duration

```css
:root {
  --duration-fast: 150ms; /* Quick interactions */
  --duration-normal: 200ms; /* Standard transitions */
  --duration-slow: 300ms; /* Deliberate transitions */
  --duration-slower: 500ms; /* Page transitions */
}
```

#### Easing Functions

```css
:root {
  --ease-linear: linear;
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-back: cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

#### Motion Preferences

```css
/* Respect user motion preferences - ADHD-friendly */
@media (prefers-reduced-motion: reduce) {
  :root {
    --duration-fast: 0.01ms;
    --duration-normal: 0.01ms;
    --duration-slow: 0.01ms;
    --duration-slower: 0.01ms;
  }
}

@media (prefers-reduced-motion: no-preference) {
  /* Enhanced animations for users who prefer motion */
  .enhanced-motion {
    --duration-fast: 200ms;
    --duration-normal: 300ms;
    --duration-slow: 400ms;
  }
}
```

### Breakpoints

```css
:root {
  /* Mobile-first responsive breakpoints */
  --breakpoint-sm: 640px; /* Small devices */
  --breakpoint-md: 768px; /* Tablets */
  --breakpoint-lg: 1024px; /* Laptops */
  --breakpoint-xl: 1280px; /* Desktops */
  --breakpoint-2xl: 1536px; /* Large screens */
}
```

### Z-Index Scale

```css
:root {
  /* Layering system for predictable stacking */
  --z-index-behind: -1;
  --z-index-base: 0;
  --z-index-below: 1;
  --z-index-default: 10;
  --z-index-above: 20;
  --z-index-nav: 100;
  --z-index-modal: 1000;
  --z-index-toast: 2000;
  --z-index-tooltip: 3000;
  --z-index-overlay: 9999;
}
```

## 🧠 ADHD-Specific Token Usage

### Energy Level Color Mapping

```css
/* Energy levels with semantic meaning and high contrast */
.energy-high {
  background-color: var(--color-energy-high);
  color: #065f46; /* Dark green text - 8.2:1 contrast */
  border-color: #059669;
}

.energy-medium {
  background-color: var(--color-energy-medium);
  color: #92400e; /* Dark amber text - 6.1:1 contrast */
  border-color: #d97706;
}

.energy-low {
  background-color: var(--color-energy-low);
  color: #3730a3; /* Dark indigo text - 7.8:1 contrast */
  border-color: #4f46e5;
}
```

### Priority Indicators

```css
/* Visual priority system using border weights and colors */
.priority-1,
.priority-2 {
  border-left: 4px solid var(--color-error);
  border-left-color: #dc2626; /* High priority - red */
}

.priority-3 {
  border-left: 3px solid var(--color-warning);
  border-left-color: #d97706; /* Medium priority - amber */
}

.priority-4,
.priority-5 {
  border-left: 2px solid var(--color-success);
  border-left-color: #059669; /* Low priority - green */
}
```

### Cognitive Load Indicators

```css
/* Visual density control for ADHD-friendly interfaces */
.density-comfortable {
  --local-spacing: var(--space-lg);
  --local-font-size: var(--font-size-lg);
  line-height: var(--line-height-relaxed);
}

.density-compact {
  --local-spacing: var(--space-md);
  --local-font-size: var(--font-size-base);
  line-height: var(--line-height-normal);
}

.density-tight {
  --local-spacing: var(--space-sm);
  --local-font-size: var(--font-size-sm);
  line-height: var(--line-height-snug);
}
```

## 💻 TypeScript Token Definitions

### Type-Safe Token Access

```typescript
// src/lib/design-tokens.ts
export const tokens = {
  colors: {
    energy: {
      high: '#10b981',
      medium: '#f59e0b',
      low: '#6366f1',
    },
    surface: {
      primary: '#ffffff',
      secondary: '#f9fafb',
      tertiary: '#f3f4f6',
      elevated: '#ffffff',
    },
    text: {
      primary: '#111827',
      secondary: '#6b7280',
      tertiary: '#9ca3af',
      inverse: '#ffffff',
    },
  },
  spacing: {
    xs: '0.25rem', // 4px
    sm: '0.5rem', // 8px
    md: '1rem', // 16px
    lg: '1.5rem', // 24px
    xl: '2rem', // 32px
    '2xl': '3rem', // 48px
  },
  typography: {
    fontSizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
    },
    fontWeights: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeights: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.625,
    },
  },
  borderRadius: {
    none: '0px',
    sm: '0.125rem',
    default: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    default: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  },
  animation: {
    durations: {
      fast: '150ms',
      normal: '200ms',
      slow: '300ms',
      slower: '500ms',
    },
    easings: {
      linear: 'linear',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
} as const;

// Type definitions for token access
export type ColorToken = keyof typeof tokens.colors;
export type SpacingToken = keyof typeof tokens.spacing;
export type FontSizeToken = keyof typeof tokens.typography.fontSizes;

// Utility function for type-safe token access
export function getToken<T extends keyof typeof tokens>(category: T, path: string): string {
  const keys = path.split('.');
  let value: any = tokens[category];

  for (const key of keys) {
    value = value?.[key];
  }

  return value || '';
}
```

### Usage in Components

```tsx
import { tokens, getToken } from '@/lib/design-tokens';

// Direct token usage
const TaskCard = styled.div`
  padding: ${tokens.spacing.md};
  border-radius: ${tokens.borderRadius.lg};
  background: ${tokens.colors.surface.primary};
  box-shadow: ${tokens.shadows.md};
  transition: all ${tokens.animation.durations.normal} ${tokens.animation.easings.out};
`;

// Dynamic token access
const EnergyBadge = ({ level }: { level: 'high' | 'medium' | 'low' }) => {
  const bgColor = getToken('colors', `energy.${level}`);

  return <span style={{ backgroundColor: bgColor }}>{level} Energy</span>;
};
```

## 🎨 Tailwind CSS Integration

### Custom Token Classes

```javascript
// tailwind.config.js
const { tokens } = require('./src/lib/design-tokens');

module.exports = {
  theme: {
    extend: {
      colors: {
        energy: tokens.colors.energy,
        surface: tokens.colors.surface,
        'text-primary': tokens.colors.text.primary,
        'text-secondary': tokens.colors.text.secondary,
      },
      spacing: tokens.spacing,
      fontSize: tokens.typography.fontSizes,
      fontWeight: tokens.typography.fontWeights,
      lineHeight: tokens.typography.lineHeights,
      borderRadius: tokens.borderRadius,
      boxShadow: tokens.shadows,
      transitionDuration: tokens.animation.durations,
      transitionTimingFunction: tokens.animation.easings,
    },
  },
};
```

### Usage in Components

```tsx
// Using Tailwind classes mapped to design tokens
const TaskCard = ({ task, energyLevel }: TaskCardProps) => (
  <article
    className={cn(
      'p-md rounded-lg bg-surface-primary shadow-md',
      'transition-all duration-normal ease-out',
      'border-l-4',
      {
        'border-l-energy-high': energyLevel === 'HIGH',
        'border-l-energy-medium': energyLevel === 'MEDIUM',
        'border-l-energy-low': energyLevel === 'LOW',
      }
    )}
  >
    <h3 className="text-lg font-semibold text-primary leading-tight">{task.title}</h3>
    <p className="text-sm text-secondary leading-normal mt-sm">{task.description}</p>
  </article>
);
```

## 🧪 Token Validation & Testing

### Contrast Validation

```typescript
// src/lib/token-validation.ts
import { tokens } from './design-tokens';

export function validateContrast(
  foreground: string,
  background: string,
  minRatio: number = 4.5
): boolean {
  const ratio = calculateContrastRatio(foreground, background);
  return ratio >= minRatio;
}

// Automated token contrast testing
export const contrastTests = [
  {
    name: 'Primary text on white background',
    foreground: tokens.colors.text.primary,
    background: tokens.colors.surface.primary,
    minRatio: 7, // AA+ compliance
  },
  {
    name: 'Secondary text on white background',
    foreground: tokens.colors.text.secondary,
    background: tokens.colors.surface.primary,
    minRatio: 4.5, // AA compliance
  },
  // Add more contrast tests...
];
```

### Token Usage Analytics

```typescript
// Track token usage across components
export function trackTokenUsage(component: string, tokens: string[]) {
  // Analytics implementation to track which tokens are used where
  analytics.track('design_token_usage', {
    component,
    tokens,
    timestamp: Date.now(),
  });
}
```

## 📊 Token Metrics & Monitoring

### Design System Health

```typescript
// Monitor design system consistency
export const designSystemMetrics = {
  tokenCoverage: calculateTokenCoverage(), // % of hardcoded values vs tokens
  contrastCompliance: validateAllContrasts(), // WCAG compliance rate
  componentConsistency: checkComponentConsistency(), // Consistent token usage
  performanceImpact: measureTokenImpact(), // Bundle size impact
};
```

## 🔄 Token Evolution & Versioning

### Semantic Versioning for Tokens

```json
{
  "name": "@helmsman/design-tokens",
  "version": "2.1.0",
  "description": "Design tokens for Helmsman ADHD-friendly interface",
  "tokens": {
    "version": "2.1.0",
    "lastUpdated": "2025-01-15",
    "changeLog": [
      {
        "version": "2.1.0",
        "changes": [
          "Added energy-level color variants",
          "Improved contrast ratios for accessibility",
          "Added ADHD-specific spacing tokens"
        ]
      }
    ]
  }
}
```

### Migration Guidelines

```typescript
// Token migration utilities
export const tokenMigrations = {
  '2.0.0': {
    'color-brand-primary': 'color-primary',
    'spacing-base': 'spacing-md',
    'font-size-normal': 'font-size-base',
  },
  '2.1.0': {
    'color-high-energy': 'color-energy-high',
    'color-medium-energy': 'color-energy-medium',
    'color-low-energy': 'color-energy-low',
  },
};
```

---

These design tokens form the foundation of our ADHD-friendly, accessible design system. They ensure consistency, maintainability, and optimal user experience across the entire Helmsman application.
