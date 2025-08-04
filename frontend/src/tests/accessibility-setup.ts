import '@testing-library/jest-dom/vitest';
import { expect } from 'vitest';

// Extend Vitest expect with accessibility matchers
import { toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);

// Configure axe for consistent testing with WCAG 2.2 AA compliance
export const axeConfig = {
  rules: {
    // Core accessibility rules that are known to exist in axe-core
    // Note: color-contrast disabled due to canvas requirements in test environment
    'color-contrast': { enabled: false },
    'aria-allowed-attr': { enabled: true },
    'aria-hidden-focus': { enabled: true },
    'aria-required-attr': { enabled: true },
    'aria-roles': { enabled: true },
    'aria-valid-attr': { enabled: true },
    'aria-valid-attr-value': { enabled: true },
    'heading-order': { enabled: true },
    label: { enabled: true },
    'image-alt': { enabled: true },
  },
  tags: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'],
};
