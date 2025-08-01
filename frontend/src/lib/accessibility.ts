/**
 * Accessibility utilities for WCAG 2.2 AA compliance and ADHD-friendly interfaces
 * 
 * This module provides comprehensive accessibility support including:
 * - Keyboard navigation management
 * - Focus management and indicators
 * - Screen reader announcements
 * - High contrast and reduced motion support
 * - ARIA utilities and constants
 */

import { useEffect, useRef, useCallback, useState } from 'react';

// ===== ARIA CONSTANTS =====

export const ARIA_ROLES = {
  // Landmark roles
  banner: 'banner',
  navigation: 'navigation',
  main: 'main',
  contentinfo: 'contentinfo',
  complementary: 'complementary',
  region: 'region',
  search: 'search',
  
  // Widget roles
  button: 'button',
  link: 'link',
  menuitem: 'menuitem',
  menuitemcheckbox: 'menuitemcheckbox',
  menuitemradio: 'menuitemradio',
  option: 'option',
  tab: 'tab',
  tabpanel: 'tabpanel',
  
  // Composite roles
  menu: 'menu',
  menubar: 'menubar',
  tablist: 'tablist',
  listbox: 'listbox',
  grid: 'grid',
  gridcell: 'gridcell',
  tree: 'tree',
  treeitem: 'treeitem',
  
  // Document structure roles
  article: 'article',
  document: 'document',
  group: 'group',
  heading: 'heading',
  list: 'list',
  listitem: 'listitem',
  
  // Live region roles
  alert: 'alert',
  log: 'log',
  status: 'status',
  timer: 'timer',
  
  // Calendar-specific roles
  calendar: 'calendar',
  calendarday: 'calendarday',
  calendarmonth: 'calendarmonth',
  calendaryear: 'calendaryear',
} as const;

export const ARIA_STATES = {
  expanded: 'aria-expanded',
  selected: 'aria-selected',
  checked: 'aria-checked',
  disabled: 'aria-disabled',
  hidden: 'aria-hidden',
  current: 'aria-current',
  pressed: 'aria-pressed',
  busy: 'aria-busy',
  invalid: 'aria-invalid',
  required: 'aria-required',
} as const;

export const ARIA_PROPERTIES = {
  label: 'aria-label',
  labelledby: 'aria-labelledby',
  describedby: 'aria-describedby',
  controls: 'aria-controls',
  owns: 'aria-owns',
  activedescendant: 'aria-activedescendant',
  level: 'aria-level',
  setsize: 'aria-setsize',
  posinset: 'aria-posinset',
  live: 'aria-live',
  atomic: 'aria-atomic',
  relevant: 'aria-relevant',
} as const;

// ===== KEYBOARD CONSTANTS =====

export const KEYS = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  TAB: 'Tab',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown',
  DELETE: 'Delete',
  BACKSPACE: 'Backspace',
} as const;

// ===== FOCUS MANAGEMENT =====

/**
 * Focus trap utility for modals and overlays
 * Ensures focus stays within a container for accessibility
 */
export class FocusTrap {
  private container: HTMLElement;
  private previousFocus: HTMLElement | null = null;
  private isActive = false;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  private getFocusableElements(): HTMLElement[] {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
    ].join(', ');

    return Array.from(this.container.querySelectorAll(focusableSelectors))
      .filter(el => !el.hasAttribute('aria-hidden')) as HTMLElement[];
  }

  private handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== KEYS.TAB) return;

    const focusableElements = this.getFocusableElements();
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Shift + Tab on first element -> focus last element
    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
      return;
    }

    // Tab on last element -> focus first element
    if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
      return;
    }
  };

  activate(): void {
    if (this.isActive) return;

    this.previousFocus = document.activeElement as HTMLElement;
    this.isActive = true;

    // Add event listener
    document.addEventListener('keydown', this.handleKeyDown);

    // Focus first focusable element
    const focusableElements = this.getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  }

  deactivate(): void {
    if (!this.isActive) return;

    this.isActive = false;
    document.removeEventListener('keydown', this.handleKeyDown);

    // Restore previous focus
    if (this.previousFocus) {
      this.previousFocus.focus();
      this.previousFocus = null;
    }
  }
}

/**
 * React hook for focus trap functionality
 */
export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLElement>(null);
  const focusTrapRef = useRef<FocusTrap | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (!focusTrapRef.current) {
      focusTrapRef.current = new FocusTrap(containerRef.current);
    }

    if (isActive) {
      focusTrapRef.current.activate();
    } else {
      focusTrapRef.current.deactivate();
    }

    return () => {
      focusTrapRef.current?.deactivate();
    };
  }, [isActive]);

  return containerRef;
}

// ===== LIVE REGION ANNOUNCEMENTS =====

/**
 * Screen reader announcement utility
 * Creates live regions for dynamic content updates
 */
export class LiveAnnouncer {
  private static instance: LiveAnnouncer | null = null;
  private liveRegion: HTMLElement | null = null;

  static getInstance(): LiveAnnouncer {
    if (!LiveAnnouncer.instance) {
      LiveAnnouncer.instance = new LiveAnnouncer();
    }
    return LiveAnnouncer.instance;
  }

  private constructor() {
    this.createLiveRegion();
  }

  private createLiveRegion(): void {
    if (typeof document === 'undefined') return;

    this.liveRegion = document.createElement('div');
    this.liveRegion.setAttribute('aria-live', 'polite');
    this.liveRegion.setAttribute('aria-atomic', 'true');
    this.liveRegion.setAttribute('aria-relevant', 'text');
    this.liveRegion.style.position = 'absolute';
    this.liveRegion.style.left = '-10000px';
    this.liveRegion.style.width = '1px';
    this.liveRegion.style.height = '1px';
    this.liveRegion.style.overflow = 'hidden';

    document.body.appendChild(this.liveRegion);
  }

  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (!this.liveRegion) return;

    this.liveRegion.setAttribute('aria-live', priority);
    this.liveRegion.textContent = message;

    // Clear after announcement to allow repeat announcements
    setTimeout(() => {
      if (this.liveRegion) {
        this.liveRegion.textContent = '';
      }
    }, 1000);
  }
}

/**
 * React hook for live announcements
 */
export function useLiveAnnouncer() {
  const announcer = useRef(LiveAnnouncer.getInstance());

  const announce = useCallback(
    (message: string, priority: 'polite' | 'assertive' = 'polite') => {
      announcer.current.announce(message, priority);
    },
    []
  );

  return { announce };
}

// ===== KEYBOARD NAVIGATION =====

/**
 * Keyboard navigation utilities for complex widgets
 */
export interface NavigationItem {
  id: string;
  element: HTMLElement;
  disabled?: boolean;
}

export class KeyboardNavigator {
  private items: NavigationItem[] = [];
  private currentIndex = 0;
  private orientation: 'horizontal' | 'vertical' | 'both' = 'vertical';
  private wrap = true;
  private onSelectionChange?: (item: NavigationItem) => void;

  constructor(options: {
    orientation?: 'horizontal' | 'vertical' | 'both';
    wrap?: boolean;
    onSelectionChange?: (item: NavigationItem) => void;
  } = {}) {
    this.orientation = options.orientation || 'vertical';
    this.wrap = options.wrap ?? true;
    this.onSelectionChange = options.onSelectionChange;
  }

  setItems(items: NavigationItem[]): void {
    this.items = items.filter(item => !item.disabled);
    this.currentIndex = Math.min(this.currentIndex, this.items.length - 1);
  }

  handleKeyDown(event: KeyboardEvent): boolean {
    const { key } = event;
    let handled = false;

    switch (key) {
      case KEYS.ARROW_DOWN:
        if (this.orientation === 'vertical' || this.orientation === 'both') {
          this.moveNext();
          handled = true;
        }
        break;

      case KEYS.ARROW_UP:
        if (this.orientation === 'vertical' || this.orientation === 'both') {
          this.movePrevious();
          handled = true;
        }
        break;

      case KEYS.ARROW_RIGHT:
        if (this.orientation === 'horizontal' || this.orientation === 'both') {
          this.moveNext();
          handled = true;
        }
        break;

      case KEYS.ARROW_LEFT:
        if (this.orientation === 'horizontal' || this.orientation === 'both') {
          this.movePrevious();
          handled = true;
        }
        break;

      case KEYS.HOME:
        this.moveToFirst();
        handled = true;
        break;

      case KEYS.END:
        this.moveToLast();
        handled = true;
        break;

      case KEYS.ENTER:
      case KEYS.SPACE:
        this.selectCurrent();
        handled = true;
        break;
    }

    if (handled) {
      event.preventDefault();
      event.stopPropagation();
    }

    return handled;
  }

  private moveNext(): void {
    if (this.items.length === 0) return;

    this.currentIndex++;
    if (this.currentIndex >= this.items.length) {
      this.currentIndex = this.wrap ? 0 : this.items.length - 1;
    }
    this.focusCurrent();
  }

  private movePrevious(): void {
    if (this.items.length === 0) return;

    this.currentIndex--;
    if (this.currentIndex < 0) {
      this.currentIndex = this.wrap ? this.items.length - 1 : 0;
    }
    this.focusCurrent();
  }

  private moveToFirst(): void {
    if (this.items.length === 0) return;
    this.currentIndex = 0;
    this.focusCurrent();
  }

  private moveToLast(): void {
    if (this.items.length === 0) return;
    this.currentIndex = this.items.length - 1;
    this.focusCurrent();
  }

  private focusCurrent(): void {
    const currentItem = this.items[this.currentIndex];
    if (currentItem) {
      currentItem.element.focus();
    }
  }

  private selectCurrent(): void {
    const currentItem = this.items[this.currentIndex];
    if (currentItem && this.onSelectionChange) {
      this.onSelectionChange(currentItem);
    }
  }

  getCurrentItem(): NavigationItem | null {
    return this.items[this.currentIndex] || null;
  }

  setCurrentIndex(index: number): void {
    if (index >= 0 && index < this.items.length) {
      this.currentIndex = index;
      this.focusCurrent();
    }
  }
}

/**
 * React hook for keyboard navigation
 */
export function useKeyboardNavigation(options: {
  orientation?: 'horizontal' | 'vertical' | 'both';
  wrap?: boolean;
  onSelectionChange?: (item: NavigationItem) => void;
} = {}) {
  const navigator = useRef(new KeyboardNavigator(options));

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    return navigator.current.handleKeyDown(event);
  }, []);

  const setItems = useCallback((items: NavigationItem[]) => {
    navigator.current.setItems(items);
  }, []);

  const getCurrentItem = useCallback(() => {
    return navigator.current.getCurrentItem();
  }, []);

  const setCurrentIndex = useCallback((index: number) => {
    navigator.current.setCurrentIndex(index);
  }, []);

  return {
    handleKeyDown,
    setItems,
    getCurrentItem,
    setCurrentIndex,
  };
}

// ===== ACCESSIBILITY ATTRIBUTES =====

/**
 * Generate ARIA attributes for common patterns
 */
export const a11y = {
  /**
   * Button attributes with proper ARIA states
   */
  button: (options: {
    label?: string;
    describedBy?: string;
    expanded?: boolean;
    pressed?: boolean;
    disabled?: boolean;
  } = {}) => ({
    role: ARIA_ROLES.button,
    'aria-label': options.label,
    'aria-describedby': options.describedBy,
    'aria-expanded': options.expanded,
    'aria-pressed': options.pressed,
    'aria-disabled': options.disabled,
    tabIndex: options.disabled ? -1 : 0,
  }),

  /**
   * Menu attributes for dropdown and context menus
   */
  menu: (options: {
    label?: string;
    orientation?: 'horizontal' | 'vertical';
  } = {}) => ({
    role: ARIA_ROLES.menu,
    'aria-label': options.label,
    'aria-orientation': options.orientation || 'vertical',
  }),

  /**
   * Menu item attributes
   */
  menuitem: (options: {
    label?: string;
    disabled?: boolean;
    selected?: boolean;
  } = {}) => ({
    role: ARIA_ROLES.menuitem,
    'aria-label': options.label,
    'aria-disabled': options.disabled,
    'aria-selected': options.selected,
    tabIndex: options.disabled ? -1 : 0,
  }),

  /**
   * Tab attributes for tab navigation
   */
  tab: (options: {
    selected?: boolean;
    controls?: string;
    label?: string;
  } = {}) => ({
    role: ARIA_ROLES.tab,
    'aria-selected': options.selected,
    'aria-controls': options.controls,
    'aria-label': options.label,
    tabIndex: options.selected ? 0 : -1,
  }),

  /**
   * Tab panel attributes
   */
  tabpanel: (options: {
    labelledBy?: string;
    hidden?: boolean;
  } = {}) => ({
    role: ARIA_ROLES.tabpanel,
    'aria-labelledby': options.labelledBy,
    'aria-hidden': options.hidden,
    tabIndex: options.hidden ? -1 : 0,
  }),

  /**
   * Grid attributes for data tables and calendars
   */
  grid: (options: {
    label?: string;
    rowCount?: number;
    colCount?: number;
    multiselectable?: boolean;
  } = {}) => ({
    role: ARIA_ROLES.grid,
    'aria-label': options.label,
    'aria-rowcount': options.rowCount,
    'aria-colcount': options.colCount,
    'aria-multiselectable': options.multiselectable,
  }),

  /**
   * Grid cell attributes
   */
  gridcell: (options: {
    rowIndex?: number;
    colIndex?: number;
    selected?: boolean;
    label?: string;
  } = {}) => ({
    role: ARIA_ROLES.gridcell,
    'aria-rowindex': options.rowIndex,
    'aria-colindex': options.colIndex,
    'aria-selected': options.selected,
    'aria-label': options.label,
    tabIndex: options.selected ? 0 : -1,
  }),

  /**
   * Live region attributes for dynamic content
   */
  liveRegion: (options: {
    level?: 'polite' | 'assertive';
    atomic?: boolean;
    relevant?: string;
  } = {}) => ({
    'aria-live': options.level || 'polite',
    'aria-atomic': options.atomic,
    'aria-relevant': options.relevant || 'text',
  }),

  /**
   * Skip link attributes for keyboard navigation
   */
  skipLink: (targetId: string) => ({
    href: `#${targetId}`,
    className: 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-md',
  }),
};

// ===== USER PREFERENCES =====

/**
 * Detect and respect user accessibility preferences
 */
export function getUserPreferences() {
  if (typeof window === 'undefined') {
    return {
      reducedMotion: false,
      highContrast: false,
      forcedColors: false,
    };
  }

  return {
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    highContrast: window.matchMedia('(prefers-contrast: high)').matches,
    forcedColors: window.matchMedia('(forced-colors: active)').matches,
  };
}

/**
 * React hook for accessibility preferences
 */
export function useAccessibilityPreferences() {
  const [preferences, setPreferences] = useState(getUserPreferences);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    const forcedColorsQuery = window.matchMedia('(forced-colors: active)');

    const updatePreferences = () => {
      setPreferences(getUserPreferences());
    };

    reducedMotionQuery.addEventListener('change', updatePreferences);
    highContrastQuery.addEventListener('change', updatePreferences);
    forcedColorsQuery.addEventListener('change', updatePreferences);

    return () => {
      reducedMotionQuery.removeEventListener('change', updatePreferences);
      highContrastQuery.removeEventListener('change', updatePreferences);
      forcedColorsQuery.removeEventListener('change', updatePreferences);
    };
  }, []);

  return preferences;
}

// ===== FOCUS VISIBLE POLYFILL =====

/**
 * Modern focus-visible implementation for keyboard navigation
 */
export function initializeFocusVisible() {
  if (typeof document === 'undefined') return;

  let hadKeyboardEvent = true;
  let keyboardThrottleTimeout: number;

  const FOCUS_VISIBLE_CLASS = 'focus-visible';

  function onPointerDown() {
    hadKeyboardEvent = false;
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.metaKey || event.altKey || event.ctrlKey) return;
    hadKeyboardEvent = true;
  }

  function onFocus(event: FocusEvent) {
    const target = event.target as HTMLElement;
    if (!target) return;

    if (hadKeyboardEvent || target.matches(':focus-visible')) {
      target.classList.add(FOCUS_VISIBLE_CLASS);
    }
  }

  function onBlur(event: FocusEvent) {
    const target = event.target as HTMLElement;
    if (!target) return;

    target.classList.remove(FOCUS_VISIBLE_CLASS);
    clearTimeout(keyboardThrottleTimeout);
  }

  document.addEventListener('keydown', onKeyDown, true);
  document.addEventListener('mousedown', onPointerDown, true);
  document.addEventListener('pointerdown', onPointerDown, true);
  document.addEventListener('touchstart', onPointerDown, true);
  document.addEventListener('focus', onFocus, true);
  document.addEventListener('blur', onBlur, true);

  // Add CSS custom property for focus-visible detection
  if (!document.documentElement.style.getPropertyValue('--focus-visible-supported')) {
    document.documentElement.style.setProperty('--focus-visible-supported', '1');
  }
}

// ===== ERROR ANNOUNCEMENTS =====

/**
 * Utility for announcing form errors and validation messages
 */
export function announceFormError(message: string, fieldName?: string) {
  const announcer = LiveAnnouncer.getInstance();
  const fullMessage = fieldName 
    ? `Error in ${fieldName}: ${message}`
    : `Error: ${message}`;
  
  announcer.announce(fullMessage, 'assertive');
}

/**
 * Utility for announcing success messages
 */
export function announceSuccess(message: string) {
  const announcer = LiveAnnouncer.getInstance();
  announcer.announce(message, 'polite');
}

// ===== EXPORTS =====

export type { NavigationItem };
export { FocusTrap, LiveAnnouncer, KeyboardNavigator };
