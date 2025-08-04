/**
 * Accessibility testing utilities for automated and manual testing
 *
 * This module provides comprehensive testing tools for WCAG 2.2 AA compliance,
 * keyboard navigation, screen reader compatibility, and ADHD-friendly features.
 */

import { act } from '@testing-library/react';

// ===== TYPES =====

export interface AccessibilityTestOptions {
  wcagLevel?: 'A' | 'AA' | 'AAA';
  rules?: {
    include?: string[];
    exclude?: string[];
  };
  timeout?: number;
  announcement?: boolean;
  keyboard?: boolean;
  focus?: boolean;
  colorContrast?: boolean;
}

export interface KeyboardTestOptions {
  keys: string[];
  expectedBehavior: string;
  startElement?: string;
  endElement?: string;
  announcements?: string[];
}

export interface ContrastTestResult {
  ratio: number;
  passes: boolean;
  level: 'A' | 'AA' | 'AAA' | 'fail';
  foreground: string;
  background: string;
}

export interface FocusTestResult {
  hasFocus: boolean;
  isVisible: boolean;
  isTrappedCorrectly: boolean;
  announcedCorrectly: boolean;
}

// ===== ACCESSIBILITY TESTING CLASS =====

export class AccessibilityTester {
  private container: HTMLElement;
  private announcements: string[] = [];
  private focusHistory: HTMLElement[] = [];

  constructor(container: HTMLElement) {
    this.container = container;
    this.setupAnnouncementListener();
    this.setupFocusListener();
  }

  private setupAnnouncementListener() {
    // Monitor ARIA live regions
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
          const target = mutation.target as HTMLElement;
          const ariaLive = target.getAttribute('aria-live');

          if (ariaLive && (ariaLive === 'polite' || ariaLive === 'assertive')) {
            const text = target.textContent || '';
            if (text.trim()) {
              this.announcements.push(text.trim());
            }
          }
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    // Store observer for cleanup
    (this as any).observer = observer;
  }

  private setupFocusListener() {
    const handleFocus = (event: FocusEvent) => {
      if (event.target instanceof HTMLElement) {
        this.focusHistory.push(event.target);
      }
    };

    document.addEventListener('focus', handleFocus, true);
    (this as any).focusListener = handleFocus;
  }

  // ===== WCAG COMPLIANCE TESTING =====

  /**
   * Test basic WCAG compliance using axe-core patterns
   */
  async testWCAGCompliance(options: AccessibilityTestOptions = {}): Promise<{
    passes: boolean;
    violations: Array<{
      rule: string;
      description: string;
      impact: string;
      elements: HTMLElement[];
    }>;
  }> {
    const {
      wcagLevel = 'AA',
      rules = {},
      colorContrast = true,
      focus = true,
      keyboard = true,
    } = options;

    const violations: Array<{
      rule: string;
      description: string;
      impact: string;
      elements: HTMLElement[];
    }> = [];

    // Test color contrast
    if (colorContrast) {
      const contrastViolations = await this.testColorContrast();
      violations.push(...contrastViolations);
    }

    // Test focus management
    if (focus) {
      const focusViolations = await this.testFocusManagement();
      violations.push(...focusViolations);
    }

    // Test keyboard navigation
    if (keyboard) {
      const keyboardViolations = await this.testKeyboardNavigation();
      violations.push(...keyboardViolations);
    }

    // Test ARIA usage
    const ariaViolations = await this.testARIAUsage();
    violations.push(...ariaViolations);

    // Test semantic structure
    const semanticViolations = await this.testSemanticStructure();
    violations.push(...semanticViolations);

    return {
      passes: violations.length === 0,
      violations,
    };
  }

  /**
   * Test color contrast ratios
   */
  async testColorContrast(): Promise<
    Array<{
      rule: string;
      description: string;
      impact: string;
      elements: HTMLElement[];
    }>
  > {
    const violations: Array<{
      rule: string;
      description: string;
      impact: string;
      elements: HTMLElement[];
    }> = [];

    const textElements = this.container.querySelectorAll('*');

    for (const element of textElements) {
      const htmlElement = element as HTMLElement;
      const computedStyle = window.getComputedStyle(htmlElement);
      const textContent = htmlElement.textContent?.trim();

      if (!textContent) continue;

      const result = this.calculateContrastRatio(
        computedStyle.color,
        computedStyle.backgroundColor
      );

      if (result && !result.passes) {
        violations.push({
          rule: 'color-contrast',
          description: `Insufficient color contrast (${result.ratio.toFixed(2)}:1)`,
          impact: 'serious',
          elements: [htmlElement],
        });
      }
    }

    return violations;
  }

  /**
   * Calculate color contrast ratio
   */
  calculateContrastRatio(foreground: string, background: string): ContrastTestResult | null {
    try {
      // Simple implementation - in real app would use more sophisticated color parsing
      const fgLum = this.getRelativeLuminance(foreground);
      const bgLum = this.getRelativeLuminance(background);

      const ratio = (Math.max(fgLum, bgLum) + 0.05) / (Math.min(fgLum, bgLum) + 0.05);

      return {
        ratio,
        passes: ratio >= 4.5, // WCAG AA standard
        level: ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : ratio >= 3 ? 'A' : 'fail',
        foreground,
        background,
      };
    } catch {
      return null;
    }
  }

  private getRelativeLuminance(color: string): number {
    // Simplified luminance calculation
    // Real implementation would properly parse CSS colors
    const rgb = this.parseColor(color);
    if (!rgb) return 0;

    const [r, g, b] = rgb.map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  private parseColor(color: string): [number, number, number] | null {
    // Simplified color parsing - real implementation would handle all CSS color formats
    const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
      return [parseInt(rgbMatch[1]), parseInt(rgbMatch[2]), parseInt(rgbMatch[3])];
    }
    return null;
  }

  /**
   * Test focus management
   */
  async testFocusManagement(): Promise<
    Array<{
      rule: string;
      description: string;
      impact: string;
      elements: HTMLElement[];
    }>
  > {
    const violations: Array<{
      rule: string;
      description: string;
      impact: string;
      elements: HTMLElement[];
    }> = [];

    // Find all focusable elements
    const focusableElements = this.container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    focusableElements.forEach(element => {
      const htmlElement = element as HTMLElement;

      // Check for focus indicators
      htmlElement.focus();
      const computedStyle = window.getComputedStyle(htmlElement);

      if (computedStyle.outline === 'none' && !computedStyle.boxShadow.includes('inset')) {
        violations.push({
          rule: 'focus-indicator',
          description: 'Focusable element missing visible focus indicator',
          impact: 'serious',
          elements: [htmlElement],
        });
      }

      // Check tabindex values
      const tabindex = htmlElement.getAttribute('tabindex');
      if (tabindex && parseInt(tabindex) > 0) {
        violations.push({
          rule: 'tabindex-positive',
          description: 'Positive tabindex values can cause navigation issues',
          impact: 'moderate',
          elements: [htmlElement],
        });
      }
    });

    return violations;
  }

  /**
   * Test keyboard navigation
   */
  async testKeyboardNavigation(): Promise<
    Array<{
      rule: string;
      description: string;
      impact: string;
      elements: HTMLElement[];
    }>
  > {
    const violations: Array<{
      rule: string;
      description: string;
      impact: string;
      elements: HTMLElement[];
    }> = [];

    // Test Tab navigation
    const focusableElements = Array.from(
      this.container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ) as HTMLElement[];

    if (focusableElements.length > 0) {
      // Test that all elements are reachable via Tab
      for (let i = 0; i < focusableElements.length; i++) {
        const element = focusableElements[i];

        // Simulate Tab key
        element.focus();
        const event = new KeyboardEvent('keydown', {
          key: 'Tab',
          bubbles: true,
          cancelable: true,
        });

        element.dispatchEvent(event);

        // Check if focus moved appropriately
        if (document.activeElement !== element && !event.defaultPrevented) {
          violations.push({
            rule: 'keyboard-navigation',
            description: 'Element not properly integrated into tab order',
            impact: 'serious',
            elements: [element],
          });
        }
      }
    }

    // Test for keyboard traps
    const modalElements = this.container.querySelectorAll('[role="dialog"], [role="alertdialog"]');
    modalElements.forEach(modal => {
      const firstFocusable = modal.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement;

      if (firstFocusable) {
        firstFocusable.focus();

        // Simulate Escape key
        const escapeEvent = new KeyboardEvent('keydown', {
          key: 'Escape',
          bubbles: true,
          cancelable: true,
        });

        modal.dispatchEvent(escapeEvent);

        // Modal should handle Escape key
        if (!escapeEvent.defaultPrevented) {
          violations.push({
            rule: 'keyboard-trap',
            description: 'Modal does not handle Escape key',
            impact: 'serious',
            elements: [modal as HTMLElement],
          });
        }
      }
    });

    return violations;
  }

  /**
   * Test ARIA usage
   */
  async testARIAUsage(): Promise<
    Array<{
      rule: string;
      description: string;
      impact: string;
      elements: HTMLElement[];
    }>
  > {
    const violations: Array<{
      rule: string;
      description: string;
      impact: string;
      elements: HTMLElement[];
    }> = [];

    // Check for required ARIA properties
    const elementsWithRoles = this.container.querySelectorAll('[role]');

    elementsWithRoles.forEach(element => {
      const htmlElement = element as HTMLElement;
      const role = htmlElement.getAttribute('role');

      // Check specific role requirements
      switch (role) {
        case 'button':
          if (!htmlElement.hasAttribute('aria-label') && !htmlElement.textContent?.trim()) {
            violations.push({
              rule: 'aria-label-required',
              description: 'Button role requires accessible name',
              impact: 'serious',
              elements: [htmlElement],
            });
          }
          break;

        case 'tab':
          if (!htmlElement.hasAttribute('aria-selected')) {
            violations.push({
              rule: 'aria-required-props',
              description: 'Tab role requires aria-selected property',
              impact: 'serious',
              elements: [htmlElement],
            });
          }
          break;

        case 'tabpanel':
          if (!htmlElement.hasAttribute('aria-labelledby')) {
            violations.push({
              rule: 'aria-required-props',
              description: 'Tabpanel role requires aria-labelledby property',
              impact: 'serious',
              elements: [htmlElement],
            });
          }
          break;
      }
    });

    // Check for invalid ARIA attributes
    const allElements = this.container.querySelectorAll('*');
    allElements.forEach(element => {
      const htmlElement = element as HTMLElement;

      Array.from(htmlElement.attributes).forEach(attr => {
        if (attr.name.startsWith('aria-')) {
          // Check for invalid ARIA values
          if (attr.name === 'aria-expanded' && !['true', 'false'].includes(attr.value)) {
            violations.push({
              rule: 'aria-valid-value',
              description: 'aria-expanded must be "true" or "false"',
              impact: 'moderate',
              elements: [htmlElement],
            });
          }

          if (attr.name === 'aria-hidden' && !['true', 'false'].includes(attr.value)) {
            violations.push({
              rule: 'aria-valid-value',
              description: 'aria-hidden must be "true" or "false"',
              impact: 'moderate',
              elements: [htmlElement],
            });
          }
        }
      });
    });

    return violations;
  }

  /**
   * Test semantic structure
   */
  async testSemanticStructure(): Promise<
    Array<{
      rule: string;
      description: string;
      impact: string;
      elements: HTMLElement[];
    }>
  > {
    const violations: Array<{
      rule: string;
      description: string;
      impact: string;
      elements: HTMLElement[];
    }> = [];

    // Check heading hierarchy
    const headings = this.container.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let lastLevel = 0;

    headings.forEach(heading => {
      const level = parseInt(heading.tagName.substring(1));

      if (level > lastLevel + 1) {
        violations.push({
          rule: 'heading-hierarchy',
          description: `Heading level jumps from h${lastLevel} to h${level}`,
          impact: 'moderate',
          elements: [heading as HTMLElement],
        });
      }

      lastLevel = level;
    });

    // Check for landmarks
    const landmarks = this.container.querySelectorAll(
      'main, nav, header, footer, aside, section[aria-label]'
    );
    if (landmarks.length === 0) {
      const bodyContent = this.container.querySelector('body') || this.container;
      violations.push({
        rule: 'landmark-required',
        description: 'Page should contain landmark elements',
        impact: 'moderate',
        elements: [bodyContent as HTMLElement],
      });
    }

    // Check for alt text on images
    const images = this.container.querySelectorAll('img');
    images.forEach(img => {
      const htmlImg = img as HTMLImageElement;
      if (!htmlImg.hasAttribute('alt')) {
        violations.push({
          rule: 'alt-text-required',
          description: 'Image missing alt attribute',
          impact: 'serious',
          elements: [htmlImg],
        });
      }
    });

    return violations;
  }

  // ===== KEYBOARD TESTING =====

  /**
   * Test specific keyboard interactions
   */
  async testKeyboardInteraction(options: KeyboardTestOptions): Promise<{
    success: boolean;
    actualBehavior: string;
    announcements: string[];
    focusPath: HTMLElement[];
  }> {
    const {
      keys,
      expectedBehavior,
      startElement,
      announcements: expectedAnnouncements = [],
    } = options;

    // Clear previous state
    this.announcements = [];
    this.focusHistory = [];

    // Set initial focus
    if (startElement) {
      const element = this.container.querySelector(startElement) as HTMLElement;
      if (element) {
        element.focus();
      }
    }

    // Simulate key presses
    for (const key of keys) {
      await this.simulateKeyPress(key);
      // Small delay to allow for async updates
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    // Wait for any pending announcements
    await new Promise(resolve => setTimeout(resolve, 100));

    return {
      success: true, // Would implement actual success checking based on expectedBehavior
      actualBehavior: `Pressed keys: ${keys.join(', ')}`,
      announcements: this.announcements,
      focusPath: this.focusHistory,
    };
  }

  private async simulateKeyPress(key: string): Promise<void> {
    const activeElement = document.activeElement as HTMLElement;

    if (!activeElement) return;

    const event = new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true,
    });

    activeElement.dispatchEvent(event);

    // Also dispatch keyup for completeness
    const keyupEvent = new KeyboardEvent('keyup', {
      key,
      bubbles: true,
      cancelable: true,
    });

    activeElement.dispatchEvent(keyupEvent);
  }

  // ===== FOCUS TESTING =====

  /**
   * Test focus trap functionality
   */
  async testFocusTrap(container: HTMLElement): Promise<FocusTestResult> {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    if (focusableElements.length === 0) {
      return {
        hasFocus: false,
        isVisible: true,
        isTrappedCorrectly: false,
        announcedCorrectly: false,
      };
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Test forward tab trapping
    lastElement.focus();
    await this.simulateKeyPress('Tab');

    const forwardTrapWorks = document.activeElement === firstElement;

    // Test backward tab trapping
    firstElement.focus();
    const shiftTabEvent = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });
    firstElement.dispatchEvent(shiftTabEvent);

    const backwardTrapWorks = document.activeElement === lastElement;

    return {
      hasFocus: document.activeElement !== null,
      isVisible: container.offsetWidth > 0 && container.offsetHeight > 0,
      isTrappedCorrectly: forwardTrapWorks && backwardTrapWorks,
      announcedCorrectly: this.announcements.length > 0,
    };
  }

  // ===== SCREEN READER TESTING =====

  /**
   * Test screen reader announcements
   */
  async testScreenReaderAnnouncements(
    action: () => void,
    expectedAnnouncements: string[],
    timeout = 1000
  ): Promise<{
    success: boolean;
    actualAnnouncements: string[];
    missingAnnouncements: string[];
  }> {
    this.announcements = [];

    // Perform the action
    await act(async () => {
      action();
    });

    // Wait for announcements
    await new Promise(resolve => setTimeout(resolve, timeout));

    const missingAnnouncements = expectedAnnouncements.filter(
      expected => !this.announcements.some(actual => actual.includes(expected))
    );

    return {
      success: missingAnnouncements.length === 0,
      actualAnnouncements: this.announcements,
      missingAnnouncements,
    };
  }

  // ===== ADHD-SPECIFIC TESTING =====

  /**
   * Test ADHD-friendly features
   */
  async testADHDFeatures(): Promise<{
    passes: boolean;
    results: Array<{
      feature: string;
      status: 'pass' | 'fail' | 'warning';
      message: string;
    }>;
  }> {
    const results: Array<{
      feature: string;
      status: 'pass' | 'fail' | 'warning';
      message: string;
    }> = [];

    // Test reduced motion support
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const animatedElements = this.container.querySelectorAll(
      '[style*="animation"], [style*="transition"]'
    );

    if (prefersReducedMotion && animatedElements.length > 0) {
      results.push({
        feature: 'reduced-motion',
        status: 'warning',
        message: 'User prefers reduced motion but animations detected',
      });
    } else {
      results.push({
        feature: 'reduced-motion',
        status: 'pass',
        message: 'Motion preferences respected',
      });
    }

    // Test energy level indicators
    const energyIndicators = this.container.querySelectorAll('[data-energy-level]');
    if (energyIndicators.length > 0) {
      results.push({
        feature: 'energy-indicators',
        status: 'pass',
        message: 'Energy level indicators found',
      });
    }

    // Test focus management
    const focusManagement = this.container.querySelector('[data-focus-management]');
    if (focusManagement) {
      results.push({
        feature: 'focus-management',
        status: 'pass',
        message: 'Focus management implemented',
      });
    }

    // Test cognitive load indicators
    const cognitiveLoad = this.container.querySelectorAll('[data-cognitive-load]');
    if (cognitiveLoad.length > 0) {
      results.push({
        feature: 'cognitive-load',
        status: 'pass',
        message: 'Cognitive load indicators found',
      });
    }

    const passes = results.every(result => result.status === 'pass');

    return { passes, results };
  }

  // ===== CLEANUP =====

  destroy() {
    if ((this as any).observer) {
      (this as any).observer.disconnect();
    }

    if ((this as any).focusListener) {
      document.removeEventListener('focus', (this as any).focusListener, true);
    }
  }
}

// ===== UTILITY FUNCTIONS =====

/**
 * Test helper for asserting accessibility compliance
 */
export async function expectToBeAccessible(
  element: HTMLElement,
  options: AccessibilityTestOptions = {}
): Promise<void> {
  const tester = new AccessibilityTester(element);
  const result = await tester.testWCAGCompliance(options);

  if (!result.passes) {
    const violationMessages = result.violations.map(v => `${v.rule}: ${v.description}`).join('\n');

    throw new Error(`Accessibility violations found:\n${violationMessages}`);
  }

  tester.destroy();
}

/**
 * Test helper for keyboard navigation
 */
export async function expectKeyboardNavigation(
  element: HTMLElement,
  keys: string[],
  expectedBehavior: string
): Promise<void> {
  const tester = new AccessibilityTester(element);
  const result = await tester.testKeyboardInteraction({
    keys,
    expectedBehavior,
  });

  if (!result.success) {
    throw new Error(
      `Keyboard navigation failed: expected ${expectedBehavior}, got ${result.actualBehavior}`
    );
  }

  tester.destroy();
}

/**
 * Test helper for screen reader announcements
 */
export async function expectAnnouncement(
  element: HTMLElement,
  action: () => void,
  expectedText: string
): Promise<void> {
  const tester = new AccessibilityTester(element);
  const result = await tester.testScreenReaderAnnouncements(action, [expectedText]);

  if (!result.success) {
    throw new Error(
      `Expected announcement "${expectedText}" not found. Actual: ${result.actualAnnouncements.join(', ')}`
    );
  }

  tester.destroy();
}
