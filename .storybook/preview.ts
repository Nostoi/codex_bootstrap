import type { Preview } from '@storybook/react';
import React from 'react';
import '../frontend/src/app/globals.css';

const preview: Preview = {
  parameters: {
    actions: {
      // Use explicit action handlers instead of regex pattern
      disable: false,
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
      expanded: true,
    },
    docs: {
      toc: true,
      autodocs: 'tag',
    },
    // Comprehensive A11y Testing Configuration
    a11y: {
      // Enable accessibility tests to fail on violations
      test: 'error',
      config: {
        rules: [
          // Color and Contrast
          { id: 'color-contrast', enabled: true },
          { id: 'color-contrast-enhanced', enabled: true },

          // Focus Management (Critical for ADHD)
          { id: 'focus-order-semantics', enabled: true },
          { id: 'focus-trap', enabled: true },
          { id: 'focusable-content', enabled: true },
          { id: 'focus-indicator', enabled: true },

          // Keyboard Navigation
          { id: 'keyboard-navigation', enabled: true },
          { id: 'keyboard', enabled: true },
          { id: 'bypass', enabled: true },

          // ARIA and Semantics
          { id: 'aria-allowed-attr', enabled: true },
          { id: 'aria-hidden-focus', enabled: true },
          { id: 'aria-required-attr', enabled: true },
          { id: 'aria-roles', enabled: true },
          { id: 'aria-valid-attr', enabled: true },
          { id: 'aria-valid-attr-value', enabled: true },

          // Structure and Headings
          { id: 'heading-order', enabled: true },
          { id: 'landmark-banner-is-top-level', enabled: true },
          { id: 'landmark-main-is-top-level', enabled: true },
          { id: 'page-has-heading-one', enabled: true },

          // Forms and Labels
          { id: 'label', enabled: true },
          { id: 'form-field-multiple-labels', enabled: true },

          // Motion and Animation (ADHD-specific)
          { id: 'motion', enabled: true },

          // Content and Language
          { id: 'html-has-lang', enabled: true },
          { id: 'html-lang-valid', enabled: true },

          // Images and Media
          { id: 'image-alt', enabled: true },
          { id: 'audio-caption', enabled: true },
          { id: 'video-caption', enabled: true },
        ],
      },
      // Visual simulation options
      options: {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'],
        },
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: '#ffffff',
        },
        {
          name: 'dark',
          value: '#1a1a1a',
        },
        {
          name: 'high-contrast-light',
          value: '#ffffff',
        },
        {
          name: 'high-contrast-dark',
          value: '#000000',
        },
      ],
    },
    // Viewport configurations for responsive testing
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile',
          styles: {
            width: '375px',
            height: '667px',
          },
        },
        tablet: {
          name: 'Tablet',
          styles: {
            width: '768px',
            height: '1024px',
          },
        },
        desktop: {
          name: 'Desktop',
          styles: {
            width: '1200px',
            height: '800px',
          },
        },
        largeDesktop: {
          name: 'Large Desktop',
          styles: {
            width: '1440px',
            height: '900px',
          },
        },
      },
    },
    // ADHD-specific testing considerations
    layout: 'centered',
    // Enable interaction testing
    interactions: {
      // Automatically detect and highlight interactive elements
      disable: false,
    },
  },
  tags: ['autodocs'],
  // Global decorators for consistent testing environment
  decorators: [
    Story =>
      React.createElement(
        'div',
        {
          style: {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            // Ensure proper focus visibility with CSS custom properties
            '--focus-ring-color': '#0066cc',
            '--focus-ring-width': '2px',
          } as React.CSSProperties,
        },
        React.createElement(Story)
      ),
  ],
  // Global types for toolbar configuration
  globalTypes: {
    motionPreference: {
      name: 'Motion Preference',
      description: 'Global motion preference for ADHD testing',
      defaultValue: 'reduce',
      toolbar: {
        icon: 'play',
        items: [
          { value: 'reduce', title: 'Reduced Motion' },
          { value: 'normal', title: 'Normal Motion' },
        ],
        showName: true,
      },
    },
    focusMode: {
      name: 'Focus Mode',
      description: 'Enhanced focus visibility for ADHD testing',
      defaultValue: 'enhanced',
      toolbar: {
        icon: 'eye',
        items: [
          { value: 'enhanced', title: 'Enhanced Focus' },
          { value: 'normal', title: 'Normal Focus' },
        ],
        showName: true,
      },
    },
  },
};

export default preview;
