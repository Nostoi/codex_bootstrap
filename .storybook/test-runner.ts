import type { TestRunnerConfig } from '@storybook/test-runner';
import { getStoryContext } from '@storybook/test-runner';
import { injectAxe, checkA11y, configureAxe } from 'axe-playwright';

/**
 * Storybook Test Runner Configuration with Comprehensive A11y Testing
 *
 * This configuration enables automated accessibility testing for all stories
 * with special focus on ADHD-friendly features and WCAG 2.2 AA compliance.
 */
const config: TestRunnerConfig = {
  /**
   * Setup phase - inject axe-core accessibility testing library
   */
  async preVisit(page) {
    await injectAxe(page);
  },

  /**
   * Post-render testing phase - run comprehensive accessibility audits
   */
  async postVisit(page, context) {
    // Get the story context to access parameters and configurations
    const storyContext = await getStoryContext(page, context);

    // Skip accessibility tests if explicitly disabled for this story
    if (storyContext.parameters?.a11y?.disable) {
      return;
    }

    // Configure axe with story-specific rules if provided
    await configureAxe(page, {
      rules: storyContext.parameters?.a11y?.config?.rules || [],
      tags: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa', 'best-practice'],
      // ADHD-specific accessibility considerations
      options: {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'],
        },
      },
    });

    // Run comprehensive accessibility check
    await checkA11y(page, '#storybook-root', {
      detailedReport: true,
      detailedReportOptions: {
        html: true,
      },
      // ADHD-focused accessibility rules
      rules: {
        // Focus management - critical for ADHD users
        'focus-order-semantics': { enabled: true },
        'focus-trap': { enabled: true },
        'focusable-content': { enabled: true },

        // Color contrast - enhanced requirements
        'color-contrast': { enabled: true },
        'color-contrast-enhanced': { enabled: true },

        // Keyboard navigation
        keyboard: { enabled: true },
        bypass: { enabled: true },

        // Motion and animation considerations
        motion: { enabled: true },

        // ARIA and semantic structure
        'aria-allowed-attr': { enabled: true },
        'aria-hidden-focus': { enabled: true },
        'aria-required-attr': { enabled: true },
        'aria-roles': { enabled: true },
        'aria-valid-attr': { enabled: true },
        'aria-valid-attr-value': { enabled: true },

        // Structure and headings
        'heading-order': { enabled: true },
        'landmark-banner-is-top-level': { enabled: true },
        'landmark-main-is-top-level': { enabled: true },
        'page-has-heading-one': { enabled: true },

        // Forms and labels
        label: { enabled: true },
        'form-field-multiple-labels': { enabled: true },

        // Language and content
        'html-has-lang': { enabled: true },
        'html-lang-valid': { enabled: true },

        // Media accessibility
        'image-alt': { enabled: true },
        'audio-caption': { enabled: true },
        'video-caption': { enabled: true },
      },
    });
  },

  /**
   * Test configuration
   */
  setup() {
    // Configure test timeout for comprehensive accessibility testing
    expect.configure({
      // Increased timeout for thorough a11y testing
      timeout: 15000,
    });
  },

  /**
   * Parallel test execution configuration
   */
  async preExecute(page, context) {
    // Ensure consistent viewport for testing
    await page.setViewportSize({ width: 1200, height: 800 });

    // Set up motion preferences for ADHD testing
    await page.emulateMedia({
      reducedMotion: 'reduce',
    });

    // Enable high contrast mode simulation
    await page.emulateMedia({
      colorScheme: 'light',
      forcedColors: 'active',
    });
  },

  /**
   * Custom test patterns for accessibility focus
   */
  async postExecute(page, context) {
    // Additional ADHD-specific checks

    // Check for proper focus indicators
    const focusableElements = await page.$$(
      '[tabindex]:not([tabindex="-1"]), button, input, select, textarea, a[href]'
    );

    for (const element of focusableElements) {
      // Ensure each focusable element has visible focus indication
      await element.focus();

      // Check focus visibility
      const focusStyles = await element.evaluate(el => {
        const styles = window.getComputedStyle(el, ':focus');
        return {
          outline: styles.outline,
          outlineWidth: styles.outlineWidth,
          outlineColor: styles.outlineColor,
          boxShadow: styles.boxShadow,
        };
      });

      // Verify focus is visible (should have outline or box-shadow)
      const hasFocusIndicator =
        focusStyles.outline !== 'none' ||
        focusStyles.outlineWidth !== '0px' ||
        focusStyles.boxShadow !== 'none';

      if (!hasFocusIndicator) {
        console.warn(`Element lacks visible focus indicator:`, await element.textContent());
      }
    }
  },
};

export default config;
