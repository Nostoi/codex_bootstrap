/**
 * ARIA constants and utilities for consistent accessibility implementation
 * 
 * This module provides standardized ARIA roles, properties, and states
 * to ensure consistent accessibility across all components.
 */

// ===== ARIA LIVE REGION LEVELS =====

export const ARIA_LIVE_LEVELS = {
  OFF: 'off',
  POLITE: 'polite',
  ASSERTIVE: 'assertive',
} as const;

// ===== ARIA CURRENT VALUES =====

export const ARIA_CURRENT_VALUES = {
  PAGE: 'page',
  STEP: 'step',
  LOCATION: 'location',
  DATE: 'date',
  TIME: 'time',
  TRUE: 'true',
  FALSE: 'false',
} as const;

// ===== ARIA AUTOCOMPLETE VALUES =====

export const ARIA_AUTOCOMPLETE = {
  NONE: 'none',
  INLINE: 'inline',
  LIST: 'list',
  BOTH: 'both',
} as const;

// ===== ARIA ORIENTATION VALUES =====

export const ARIA_ORIENTATION = {
  HORIZONTAL: 'horizontal',
  VERTICAL: 'vertical',
} as const;

// ===== ARIA SORT VALUES =====

export const ARIA_SORT = {
  NONE: 'none',
  ASCENDING: 'ascending',
  DESCENDING: 'descending',
  OTHER: 'other',
} as const;

// ===== ARIA DROPEFFECT VALUES =====

export const ARIA_DROPEFFECT = {
  NONE: 'none',
  COPY: 'copy',
  EXECUTE: 'execute',
  LINK: 'link',
  MOVE: 'move',
  POPUP: 'popup',
} as const;

// ===== ARIA GRABBED VALUES =====

export const ARIA_GRABBED = {
  TRUE: 'true',
  FALSE: 'false',
  UNDEFINED: 'undefined',
} as const;

// ===== LANDMARK ROLE MAPPINGS =====

export const LANDMARK_ROLES = {
  banner: {
    role: 'banner',
    htmlEquivalent: 'header',
    description: 'Site-wide header content',
  },
  navigation: {
    role: 'navigation',
    htmlEquivalent: 'nav',
    description: 'Navigation links',
  },
  main: {
    role: 'main',
    htmlEquivalent: 'main',
    description: 'Main content area',
  },
  contentinfo: {
    role: 'contentinfo',
    htmlEquivalent: 'footer',
    description: 'Site-wide footer content',
  },
  complementary: {
    role: 'complementary',
    htmlEquivalent: 'aside',
    description: 'Supporting content',
  },
  search: {
    role: 'search',
    htmlEquivalent: null,
    description: 'Search functionality',
  },
  region: {
    role: 'region',
    htmlEquivalent: 'section',
    description: 'Important content section',
  },
} as const;

// ===== FORM CONTROL MAPPINGS =====

export const FORM_CONTROL_ROLES = {
  textbox: {
    role: 'textbox',
    htmlEquivalent: 'input[type="text"]',
    ariaRequired: true,
  },
  searchbox: {
    role: 'searchbox',
    htmlEquivalent: 'input[type="search"]',
    ariaRequired: false,
  },
  combobox: {
    role: 'combobox',
    htmlEquivalent: 'select',
    ariaRequired: true,
  },
  listbox: {
    role: 'listbox',
    htmlEquivalent: 'select[multiple]',
    ariaRequired: false,
  },
  checkbox: {
    role: 'checkbox',
    htmlEquivalent: 'input[type="checkbox"]',
    ariaRequired: false,
  },
  radio: {
    role: 'radio',
    htmlEquivalent: 'input[type="radio"]',
    ariaRequired: false,
  },
  switch: {
    role: 'switch',
    htmlEquivalent: null,
    ariaRequired: false,
  },
  slider: {
    role: 'slider',
    htmlEquivalent: 'input[type="range"]',
    ariaRequired: true,
  },
  spinbutton: {
    role: 'spinbutton',
    htmlEquivalent: 'input[type="number"]',
    ariaRequired: true,
  },
} as const;

// ===== CALENDAR-SPECIFIC ARIA PATTERNS =====

export const CALENDAR_ARIA = {
  calendar: {
    role: 'grid',
    requiredProperties: ['aria-label', 'aria-rowcount', 'aria-colcount'],
    keyboardNavigation: ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown'],
  },
  calendarMonth: {
    role: 'gridcell',
    requiredProperties: ['aria-label', 'aria-selected'],
    optionalProperties: ['aria-disabled', 'aria-current'],
  },
  calendarDay: {
    role: 'gridcell',
    requiredProperties: ['aria-label', 'aria-selected'],
    optionalProperties: ['aria-disabled', 'aria-current', 'aria-describedby'],
  },
  calendarWeek: {
    role: 'row',
    requiredProperties: ['aria-rowindex'],
    optionalProperties: ['aria-label'],
  },
  calendarHeader: {
    role: 'columnheader',
    requiredProperties: ['aria-label'],
    optionalProperties: ['aria-sort'],
  },
} as const;

// ===== DRAG AND DROP ARIA PATTERNS =====

export const DND_ARIA = {
  draggable: {
    requiredProperties: ['aria-grabbed'],
    optionalProperties: ['aria-dropeffect', 'aria-describedby'],
    keyboardSupport: true,
  },
  dropzone: {
    requiredProperties: ['aria-dropeffect'],
    optionalProperties: ['aria-label', 'aria-describedby'],
    stateUpdates: ['aria-dropeffect'],
  },
} as const;

// ===== MENU ARIA PATTERNS =====

export const MENU_ARIA = {
  menubar: {
    role: 'menubar',
    orientation: 'horizontal',
    keyboardNavigation: ['ArrowLeft', 'ArrowRight', 'Enter', 'Escape'],
  },
  menu: {
    role: 'menu',
    orientation: 'vertical',
    keyboardNavigation: ['ArrowUp', 'ArrowDown', 'Enter', 'Escape'],
  },
  menuitem: {
    role: 'menuitem',
    requiredProperties: [],
    optionalProperties: ['aria-disabled', 'aria-expanded', 'aria-haspopup'],
  },
  menuitemcheckbox: {
    role: 'menuitemcheckbox',
    requiredProperties: ['aria-checked'],
    optionalProperties: ['aria-disabled'],
  },
  menuitemradio: {
    role: 'menuitemradio',
    requiredProperties: ['aria-checked'],
    optionalProperties: ['aria-disabled'],
  },
} as const;

// ===== TAB ARIA PATTERNS =====

export const TAB_ARIA = {
  tablist: {
    role: 'tablist',
    requiredProperties: [],
    optionalProperties: ['aria-label', 'aria-orientation'],
    keyboardNavigation: ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'],
  },
  tab: {
    role: 'tab',
    requiredProperties: ['aria-selected', 'aria-controls'],
    optionalProperties: ['aria-disabled', 'aria-label'],
  },
  tabpanel: {
    role: 'tabpanel',
    requiredProperties: ['aria-labelledby'],
    optionalProperties: ['aria-hidden'],
  },
} as const;

// ===== GRID ARIA PATTERNS =====

export const GRID_ARIA = {
  grid: {
    role: 'grid',
    requiredProperties: [],
    optionalProperties: ['aria-label', 'aria-rowcount', 'aria-colcount', 'aria-multiselectable'],
    keyboardNavigation: ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown'],
  },
  row: {
    role: 'row',
    requiredProperties: [],
    optionalProperties: ['aria-rowindex', 'aria-selected', 'aria-expanded'],
  },
  columnheader: {
    role: 'columnheader',
    requiredProperties: [],
    optionalProperties: ['aria-sort', 'aria-label', 'aria-colindex'],
  },
  rowheader: {
    role: 'rowheader',
    requiredProperties: [],
    optionalProperties: ['aria-label', 'aria-rowindex'],
  },
  gridcell: {
    role: 'gridcell',
    requiredProperties: [],
    optionalProperties: ['aria-label', 'aria-selected', 'aria-rowindex', 'aria-colindex'],
  },
} as const;

// ===== VALIDATION UTILITIES =====

/**
 * Validates required ARIA properties for a given role
 */
export function validateAriaProperties(
  role: string,
  properties: Record<string, any>
): { isValid: boolean; missingProperties: string[] } {
  const patterns = {
    ...CALENDAR_ARIA,
    ...MENU_ARIA,
    ...TAB_ARIA,
    ...GRID_ARIA,
  };

  const pattern = patterns[role as keyof typeof patterns];
  if (!pattern || !('requiredProperties' in pattern)) {
    return { isValid: true, missingProperties: [] };
  }

  const missingProperties = pattern.requiredProperties.filter(
    prop => !(prop in properties) || properties[prop] === undefined
  );

  return {
    isValid: missingProperties.length === 0,
    missingProperties,
  };
}

/**
 * Generates ARIA attributes object for a specific pattern
 */
export function generateAriaAttributes(
  pattern: string,
  options: Record<string, any> = {}
): Record<string, any> {
  const attributes: Record<string, any> = {};

  // Add role if specified
  if (options.role) {
    attributes.role = options.role;
  }

  // Add common ARIA properties
  Object.entries(options).forEach(([key, value]) => {
    if (key.startsWith('aria-') && value !== undefined) {
      attributes[key] = value;
    }
  });

  return attributes;
}

// ===== KEYBOARD SHORTCUT MAPPINGS =====

export const KEYBOARD_SHORTCUTS = {
  global: {
    'Alt+M': 'Open main menu',
    'Alt+S': 'Open search',
    'Alt+H': 'Go to home',
    'Escape': 'Close modal/menu',
    '/': 'Focus search (when not in input)',
  },
  calendar: {
    'ArrowUp': 'Previous week',
    'ArrowDown': 'Next week', 
    'ArrowLeft': 'Previous day',
    'ArrowRight': 'Next day',
    'Home': 'First day of month',
    'End': 'Last day of month',
    'PageUp': 'Previous month',
    'PageDown': 'Next month',
    'Enter': 'Select date',
    'Space': 'Select date',
  },
  tasks: {
    'j': 'Next task',
    'k': 'Previous task',
    'Enter': 'Open task',
    'Space': 'Toggle task completion',
    'e': 'Edit task',
    'd': 'Delete task',
    'f': 'Filter tasks',
  },
  modal: {
    'Escape': 'Close modal',
    'Tab': 'Next focusable element',
    'Shift+Tab': 'Previous focusable element',
  },
} as const;

// ===== SCREEN READER TEXT UTILITIES =====

/**
 * Generates screen reader friendly text for common UI patterns
 */
export const srText = {
  /**
   * Task status announcements
   */
  taskStatus: (status: string, title: string) => {
    const statusMap = {
      pending: 'not started',
      'in-progress': 'in progress',
      done: 'completed',
      blocked: 'blocked',
    };
    return `Task "${title}" is ${statusMap[status as keyof typeof statusMap] || status}`;
  },

  /**
   * Energy level announcements
   */
  energyLevel: (level: string) => {
    const levelMap = {
      high: 'high energy required',
      medium: 'medium energy required',
      low: 'low energy required',
    };
    return levelMap[level as keyof typeof levelMap] || `${level} energy level`;
  },

  /**
   * Priority announcements
   */
  priority: (priority: number) => {
    if (priority >= 8) return 'urgent priority';
    if (priority >= 6) return 'high priority';
    if (priority >= 4) return 'medium priority';
    return 'low priority';
  },

  /**
   * Calendar date announcements
   */
  calendarDate: (date: Date, hasEvents?: boolean) => {
    const dateStr = date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const eventStr = hasEvents ? ' with events' : '';
    return `${dateStr}${eventStr}`;
  },

  /**
   * Progress announcements
   */
  progress: (completed: number, total: number) => {
    const percentage = Math.round((completed / total) * 100);
    return `${completed} of ${total} tasks completed, ${percentage} percent`;
  },

  /**
   * Loading state announcements
   */
  loading: (context?: string) => {
    return context ? `Loading ${context}` : 'Loading';
  },

  /**
   * Error announcements
   */
  error: (message: string, context?: string) => {
    return context ? `Error in ${context}: ${message}` : `Error: ${message}`;
  },
};

// ===== FOCUS OUTLINE UTILITIES =====

/**
 * CSS-in-JS focus styles that respect user preferences
 */
export const focusStyles = {
  /**
   * Default focus outline for interactive elements
   */
  default: {
    '&:focus-visible': {
      outline: '2px solid var(--color-primary)',
      outlineOffset: '2px',
      borderRadius: 'var(--border-radius-sm)',
    },
    '&:focus:not(:focus-visible)': {
      outline: 'none',
    },
  },

  /**
   * High contrast focus outline for better visibility
   */
  highContrast: {
    '&:focus-visible': {
      outline: '3px solid var(--color-primary)',
      outlineOffset: '2px',
      borderRadius: 'var(--border-radius-sm)',
      boxShadow: '0 0 0 1px var(--color-surface-primary)',
    },
  },

  /**
   * Error state focus outline
   */
  error: {
    '&:focus-visible': {
      outline: '2px solid var(--color-error)',
      outlineOffset: '2px',
      borderRadius: 'var(--border-radius-sm)',
    },
  },

  /**
   * Success state focus outline
   */
  success: {
    '&:focus-visible': {
      outline: '2px solid var(--color-success)',
      outlineOffset: '2px',
      borderRadius: 'var(--border-radius-sm)',
    },
  },
};

// ===== ADHD-SPECIFIC ARIA PATTERNS =====

/**
 * ARIA patterns optimized for ADHD-friendly interfaces
 */
export const ADHD_ARIA = {
  /**
   * Energy level indicators with clear semantics
   * Note: For buttons, we avoid role conflicts by using data attributes and aria-label
   */
  energyIndicator: (level: 'high' | 'medium' | 'low') => ({
    'aria-label': srText.energyLevel(level),
    'data-energy-level': level,
  }),

  /**
   * Focus management for distraction reduction
   */
  focusContainer: (label: string) => ({
    role: 'region',
    'aria-label': label,
    'aria-live': 'polite',
    'aria-atomic': 'true',
  }),

  /**
   * Progress indicators with context
   */
  progressIndicator: (current: number, total: number, context?: string) => ({
    role: 'progressbar',
    'aria-valuemin': 0,
    'aria-valuemax': total,
    'aria-valuenow': current,
    'aria-valuetext': srText.progress(current, total),
    'aria-label': context || 'Progress indicator',
  }),

  /**
   * Cognitive load indicators
   * Note: For buttons, we avoid role conflicts by using data attributes and aria-label
   */
  cognitiveLoad: (level: 'low' | 'medium' | 'high') => ({
    'aria-label': `Cognitive load: ${level}`,
    'data-cognitive-load': level,
  }),
};

export type AriaRole = keyof typeof LANDMARK_ROLES | keyof typeof FORM_CONTROL_ROLES;
export type AriaLiveLevel = typeof ARIA_LIVE_LEVELS[keyof typeof ARIA_LIVE_LEVELS];
export type AriaCurrentValue = typeof ARIA_CURRENT_VALUES[keyof typeof ARIA_CURRENT_VALUES];
