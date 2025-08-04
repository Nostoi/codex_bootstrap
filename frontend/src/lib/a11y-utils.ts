/**
 * Accessibility Utility Functions
 *
 * This module provides utility functions for implementing accessible
 * user interfaces with special consideration for ADHD-friendly patterns.
 */

/**
 * Focus Management Utilities
 */

/**
 * Manages focus trapping within a container element
 */
export class FocusTrap {
  private container: HTMLElement;
  private focusableElements: HTMLElement[];
  private firstFocusable: HTMLElement | null = null;
  private lastFocusable: HTMLElement | null = null;
  private previousFocus: HTMLElement | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.focusableElements = this.getFocusableElements();
    this.updateFocusableElements();
  }

  /**
   * Gets all focusable elements within the container
   */
  private getFocusableElements(): HTMLElement[] {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      'details summary',
      'iframe',
      'object',
      'embed',
      '[contenteditable="true"]',
    ].join(', ');

    const elements = Array.from(
      this.container.querySelectorAll(focusableSelectors)
    ) as HTMLElement[];

    return elements.filter(element => {
      return this.isVisible(element) && this.isNotInert(element);
    });
  }

  /**
   * Checks if an element is visible
   */
  private isVisible(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element);
    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0' &&
      element.offsetParent !== null
    );
  }

  /**
   * Checks if an element is not inert
   */
  private isNotInert(element: HTMLElement): boolean {
    return !element.hasAttribute('inert') && !element.closest('[inert]');
  }

  /**
   * Updates the focusable elements list
   */
  private updateFocusableElements(): void {
    this.focusableElements = this.getFocusableElements();
    this.firstFocusable = this.focusableElements[0] || null;
    this.lastFocusable = this.focusableElements[this.focusableElements.length - 1] || null;
  }

  /**
   * Activates the focus trap
   */
  activate(): void {
    this.previousFocus = document.activeElement as HTMLElement;
    this.updateFocusableElements();

    if (this.firstFocusable) {
      this.firstFocusable.focus();
    }

    this.container.addEventListener('keydown', this.handleKeyDown);
  }

  /**
   * Deactivates the focus trap
   */
  deactivate(): void {
    this.container.removeEventListener('keydown', this.handleKeyDown);

    if (this.previousFocus) {
      this.previousFocus.focus();
    }
  }

  /**
   * Handles keydown events for focus trapping
   */
  private handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== 'Tab') return;

    this.updateFocusableElements();

    if (this.focusableElements.length === 0) {
      event.preventDefault();
      return;
    }

    if (this.focusableElements.length === 1) {
      event.preventDefault();
      this.focusableElements[0].focus();
      return;
    }

    if (event.shiftKey) {
      // Shift + Tab (moving backwards)
      if (document.activeElement === this.firstFocusable) {
        event.preventDefault();
        this.lastFocusable?.focus();
      }
    } else {
      // Tab (moving forwards)
      if (document.activeElement === this.lastFocusable) {
        event.preventDefault();
        this.firstFocusable?.focus();
      }
    }
  };
}

/**
 * ARIA Utilities
 */

/**
 * Announces a message to screen readers using live regions
 */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite',
  delay: number = 100
): void {
  const announcer = getOrCreateAnnouncer(priority);

  // Clear the announcer first, then add the message after a brief delay
  // This ensures the message is properly announced
  announcer.textContent = '';

  setTimeout(() => {
    announcer.textContent = message;
  }, delay);
}

/**
 * Gets or creates a live region announcer
 */
function getOrCreateAnnouncer(priority: 'polite' | 'assertive'): HTMLElement {
  const id = `a11y-announcer-${priority}`;
  let announcer = document.getElementById(id);

  if (!announcer) {
    announcer = document.createElement('div');
    announcer.id = id;
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.style.cssText = `
      position: absolute !important;
      left: -10000px !important;
      width: 1px !important;
      height: 1px !important;
      overflow: hidden !important;
    `;

    document.body.appendChild(announcer);
  }

  return announcer;
}

/**
 * Updates the page title and announces the change
 */
export function updatePageTitle(newTitle: string, announce: boolean = true): void {
  document.title = newTitle;

  if (announce) {
    announceToScreenReader(`Page title updated: ${newTitle}`, 'polite');
  }
}

/**
 * Keyboard Navigation Utilities
 */

/**
 * Creates a roving tabindex manager for arrow key navigation
 */
export class RovingTabindex {
  private container: HTMLElement;
  private items: HTMLElement[];
  private currentIndex: number = 0;

  constructor(
    container: HTMLElement,
    itemSelector: string = '[role="option"], [role="menuitem"], [role="tab"]'
  ) {
    this.container = container;
    this.items = Array.from(container.querySelectorAll(itemSelector)) as HTMLElement[];
    this.initialize();
  }

  /**
   * Initializes the roving tabindex
   */
  private initialize(): void {
    if (this.items.length === 0) return;

    // Set initial tabindex values
    this.items.forEach((item, index) => {
      item.tabIndex = index === 0 ? 0 : -1;
    });

    this.container.addEventListener('keydown', this.handleKeyDown);
    this.container.addEventListener('focusin', this.handleFocusIn);
  }

  /**
   * Handles keydown events for arrow navigation
   */
  private handleKeyDown = (event: KeyboardEvent): void => {
    const { key } = event;
    let newIndex = this.currentIndex;

    switch (key) {
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault();
        newIndex = (this.currentIndex + 1) % this.items.length;
        break;

      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault();
        newIndex = this.currentIndex === 0 ? this.items.length - 1 : this.currentIndex - 1;
        break;

      case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;

      case 'End':
        event.preventDefault();
        newIndex = this.items.length - 1;
        break;

      default:
        return;
    }

    this.moveTo(newIndex);
  };

  /**
   * Handles focus events to update current index
   */
  private handleFocusIn = (event: Event): void => {
    const target = event.target as HTMLElement;
    const index = this.items.indexOf(target);

    if (index !== -1) {
      this.moveTo(index);
    }
  };

  /**
   * Moves focus to a specific index
   */
  moveTo(index: number): void {
    if (index < 0 || index >= this.items.length) return;

    // Update tabindex values
    this.items[this.currentIndex].tabIndex = -1;
    this.items[index].tabIndex = 0;

    // Move focus
    this.items[index].focus();
    this.currentIndex = index;
  }

  /**
   * Destroys the roving tabindex
   */
  destroy(): void {
    this.container.removeEventListener('keydown', this.handleKeyDown);
    this.container.removeEventListener('focusin', this.handleFocusIn);
  }
}

/**
 * ADHD-Friendly Utilities
 */

/**
 * Checks if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Respects motion preferences when applying animations
 */
export function respectMotionPreferences<T extends HTMLElement>(
  element: T,
  animations: {
    normal: () => void;
    reduced: () => void;
  }
): void {
  if (prefersReducedMotion()) {
    animations.reduced();
  } else {
    animations.normal();
  }
}

/**
 * Creates a focus indicator that respects ADHD-friendly design principles
 */
export function createADHDFriendlyFocus(element: HTMLElement): void {
  const focusStyle = {
    outline: '3px solid #0066cc',
    outlineOffset: '2px',
    borderRadius: '4px',
    transition: prefersReducedMotion() ? 'none' : 'outline 0.15s ease',
  };

  const blurStyle = {
    outline: 'none',
    transition: prefersReducedMotion() ? 'none' : 'outline 0.15s ease',
  };

  element.addEventListener('focus', () => {
    Object.assign(element.style, focusStyle);
  });

  element.addEventListener('blur', () => {
    Object.assign(element.style, blurStyle);
  });
}

/**
 * Form Accessibility Utilities
 */

/**
 * Associates form controls with their labels and error messages
 */
export function enhanceFormAccessibility(form: HTMLFormElement): void {
  const inputs = form.querySelectorAll('input, select, textarea');

  inputs.forEach(input => {
    const inputElement = input as HTMLInputElement;
    const id = inputElement.id || `input-${Math.random().toString(36).substr(2, 9)}`;
    inputElement.id = id;

    // Associate with label
    const label = form.querySelector(`label[for="${id}"]`) as HTMLLabelElement;
    if (!label) {
      const closestLabel = inputElement.closest('label');
      if (closestLabel && !closestLabel.getAttribute('for')) {
        closestLabel.setAttribute('for', id);
      }
    }

    // Create error container if it doesn't exist
    let errorContainer = form.querySelector(`#${id}-error`);
    if (!errorContainer) {
      errorContainer = document.createElement('div');
      errorContainer.id = `${id}-error`;
      errorContainer.className = 'sr-only';
      errorContainer.setAttribute('role', 'alert');
      errorContainer.setAttribute('aria-live', 'polite');
      inputElement.parentNode?.insertBefore(errorContainer, inputElement.nextSibling);
    }

    // Associate with error container
    const describedBy = inputElement.getAttribute('aria-describedby') || '';
    if (!describedBy.includes(`${id}-error`)) {
      inputElement.setAttribute(
        'aria-describedby',
        describedBy ? `${describedBy} ${id}-error` : `${id}-error`
      );
    }
  });
}

/**
 * Sets form field error state accessibly
 */
export function setFieldError(fieldId: string, errorMessage: string): void {
  const field = document.getElementById(fieldId) as HTMLInputElement;
  const errorContainer = document.getElementById(`${fieldId}-error`);

  if (field && errorContainer) {
    field.setAttribute('aria-invalid', 'true');
    errorContainer.textContent = errorMessage;
    errorContainer.className = errorContainer.className.replace('sr-only', '');

    // Announce error to screen readers
    announceToScreenReader(`Error in ${field.name || fieldId}: ${errorMessage}`, 'assertive');
  }
}

/**
 * Clears form field error state
 */
export function clearFieldError(fieldId: string): void {
  const field = document.getElementById(fieldId) as HTMLInputElement;
  const errorContainer = document.getElementById(`${fieldId}-error`);

  if (field && errorContainer) {
    field.setAttribute('aria-invalid', 'false');
    errorContainer.textContent = '';
    errorContainer.className += ' sr-only';
  }
}

/**
 * Color and Contrast Utilities
 */

/**
 * Calculates the contrast ratio between two colors
 */
export function calculateContrastRatio(color1: string, color2: string): number {
  const getLuminance = (color: string): number => {
    const rgb = hexToRgb(color);
    if (!rgb) return 0;

    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
      const sRGB = c / 255;
      return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Converts hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Checks if a color combination meets WCAG contrast requirements
 */
export function meetsContrastRequirements(
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA',
  isLargeText: boolean = false
): boolean {
  const ratio = calculateContrastRatio(foreground, background);

  if (level === 'AAA') {
    return isLargeText ? ratio >= 4.5 : ratio >= 7;
  } else {
    return isLargeText ? ratio >= 3 : ratio >= 4.5;
  }
}

/**
 * Testing and Development Utilities
 */

/**
 * Highlights all focusable elements on the page (for development/testing)
 */
export function highlightFocusableElements(): void {
  const focusableSelectors = [
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
    'details summary',
  ].join(', ');

  const elements = document.querySelectorAll(focusableSelectors);

  elements.forEach((element, index) => {
    const htmlElement = element as HTMLElement;
    htmlElement.style.outline = '2px solid red';
    htmlElement.style.outlineOffset = '2px';
    htmlElement.title = `Focusable element ${index + 1}`;
  });
}

/**
 * Logs accessibility information about an element
 */
export function logAccessibilityInfo(element: HTMLElement): void {
  const info = {
    tagName: element.tagName,
    role: element.getAttribute('role'),
    ariaLabel: element.getAttribute('aria-label'),
    ariaLabelledBy: element.getAttribute('aria-labelledby'),
    ariaDescribedBy: element.getAttribute('aria-describedby'),
    tabIndex: element.tabIndex,
    focusable: element.tabIndex >= 0 || element.matches('a[href], button, input, select, textarea'),
    visible: element.offsetParent !== null,
    computedRole: element.getAttribute('role') || getImplicitRole(element.tagName),
  };

  console.table(info);
}

/**
 * Gets the implicit ARIA role for an element
 */
function getImplicitRole(tagName: string): string {
  const roleMap: Record<string, string> = {
    BUTTON: 'button',
    A: 'link',
    INPUT: 'textbox',
    SELECT: 'combobox',
    TEXTAREA: 'textbox',
    H1: 'heading',
    H2: 'heading',
    H3: 'heading',
    H4: 'heading',
    H5: 'heading',
    H6: 'heading',
    NAV: 'navigation',
    MAIN: 'main',
    SECTION: 'region',
    ARTICLE: 'article',
    ASIDE: 'complementary',
    HEADER: 'banner',
    FOOTER: 'contentinfo',
  };

  return roleMap[tagName.toUpperCase()] || 'generic';
}
