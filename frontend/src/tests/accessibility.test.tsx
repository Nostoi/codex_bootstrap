import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { toHaveNoViolations } from 'jest-axe';
import { axeConfig } from './accessibility-setup';

// Extend expect with accessibility matchers
expect.extend(toHaveNoViolations);

/**
 * Comprehensive Accessibility Test Suite
 * 
 * This test suite provides automated accessibility testing using axe-core
 * with a focus on WCAG 2.2 AA compliance and ADHD-friendly design patterns.
 */

describe('Accessibility Audit System', () => {
  /**
   * Test helper function for running accessibility audits on components
   */
  const testAccessibility = async (component: React.ReactElement, testName: string) => {
    const { container } = render(component);
    const results = await axe(container, axeConfig);
    
    expect(results, `${testName} should have no accessibility violations`).toHaveNoViolations();
    
    return { container, results };
  };

  describe('Basic HTML Elements', () => {
    it('should validate accessible button elements', async () => {
      const ButtonComponent = () => (
        <div>
          <button type="button" aria-label="Close dialog">
            Close
          </button>
          <button type="submit" disabled>
            Submit Form
          </button>
        </div>
      );

      await testAccessibility(<ButtonComponent />, 'Button elements');
    });

    it('should validate accessible form elements', async () => {
      const FormComponent = () => (
        <form role="form" aria-label="Contact form">
          <div>
            <label htmlFor="email">Email Address</label>
            <input 
              id="email" 
              type="email" 
              required 
              aria-describedby="email-error"
              aria-invalid="false"
            />
            <div id="email-error" role="alert" aria-live="polite"></div>
          </div>
          
          <div>
            <label htmlFor="message">Message</label>
            <textarea 
              id="message" 
              required
              aria-describedby="message-help"
            />
            <div id="message-help">Please provide detailed information</div>
          </div>
        </form>
      );

      await testAccessibility(<FormComponent />, 'Form elements');
    });

    it('should validate accessible navigation structure', async () => {
      const NavigationComponent = () => (
        <div>
          <nav role="navigation" aria-label="Main navigation">
            <ul>
              <li><a href="#home" aria-current="page">Home</a></li>
              <li><a href="#about">About</a></li>
              <li><a href="#contact">Contact</a></li>
            </ul>
          </nav>
          
          <main role="main">
            <h1>Page Title</h1>
            <p>Page content</p>
          </main>
        </div>
      );

      await testAccessibility(<NavigationComponent />, 'Navigation structure');
    });
  });

  describe('ADHD-Specific Accessibility Features', () => {
    it('should validate focus indicators and management', async () => {
      const FocusComponent = () => (
        <div>
          <button 
            style={{ 
              outline: '2px solid blue',
              outlineOffset: '2px'
            }}
            onFocus={(e) => e.target.style.outline = '3px solid #0066cc'}
          >
            Clearly Focusable Button
          </button>
          
          <input 
            type="text" 
            placeholder="Input with clear focus"
            style={{
              border: '2px solid #ccc',
              padding: '8px',
              margin: '8px'
            }}
            onFocus={(e) => e.target.style.borderColor = '#0066cc'}
          />
        </div>
      );

      await testAccessibility(<FocusComponent />, 'Focus indicators');
    });

    it('should validate consistent interaction patterns', async () => {
      const ConsistentComponent = () => (
        <div>
          {/* Consistent button patterns */}
          <button className="btn-primary" type="button">Primary Action</button>
          <button className="btn-secondary" type="button">Secondary Action</button>
          <button className="btn-danger" type="button">Delete Action</button>
          
          {/* Consistent spacing and layout */}
          <div style={{ display: 'grid', gap: '16px', margin: '16px 0' }}>
            <div>Consistent Grid Item 1</div>
            <div>Consistent Grid Item 2</div>
            <div>Consistent Grid Item 3</div>
          </div>
        </div>
      );

      await testAccessibility(<ConsistentComponent />, 'Consistent interaction patterns');
    });

    it('should validate reduced motion preferences', async () => {
      const MotionComponent = () => (
        <div>
          <div 
            style={{
              transition: 'transform 0.2s ease',
              // Respect prefers-reduced-motion
              '@media (prefers-reduced-motion: reduce)': {
                transition: 'none'
              }
            }}
            className="motion-sensitive"
          >
            Animation-aware content
          </div>
          
          <button 
            style={{
              transform: 'scale(1)',
              transition: 'transform 0.1s ease'
            }}
            onMouseEnter={(e) => {
              if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                e.currentTarget.style.transform = 'scale(1.05)';
              }
            }}
          >
            Hover with motion consideration
          </button>
        </div>
      );

      await testAccessibility(<MotionComponent />, 'Motion preferences');
    });
  });

  describe('Color Contrast and Visual Design', () => {
    it('should validate color contrast ratios', async () => {
      const ContrastComponent = () => (
        <div>
          {/* High contrast combinations */}
          <div style={{ backgroundColor: '#000000', color: '#ffffff', padding: '16px' }}>
            High contrast text (21:1 ratio)
          </div>
          
          <div style={{ backgroundColor: '#ffffff', color: '#333333', padding: '16px' }}>
            Standard contrast text (12.6:1 ratio)
          </div>
          
          {/* ADHD-friendly color coding */}
          <div style={{ 
            backgroundColor: '#e8f5e8', 
            color: '#2d5016', 
            padding: '16px',
            border: '2px solid #4caf50'
          }}>
            Success message with clear visual hierarchy
          </div>
        </div>
      );

      await testAccessibility(<ContrastComponent />, 'Color contrast');
    });

    it('should validate semantic color usage', async () => {
      const SemanticColorComponent = () => (
        <div>
          <div role="alert" style={{ 
            backgroundColor: '#ffebee', 
            color: '#c62828', 
            padding: '12px',
            border: '1px solid #e57373'
          }}>
            Error: This is an error message
          </div>
          
          <div role="status" style={{ 
            backgroundColor: '#e8f5e8', 
            color: '#2e7d32', 
            padding: '12px',
            border: '1px solid #66bb6a'
          }}>
            Success: Operation completed successfully
          </div>
          
          <div role="alert" style={{ 
            backgroundColor: '#fff3e0', 
            color: '#ef6c00', 
            padding: '12px',
            border: '1px solid #ffb74d'
          }}>
            Warning: Please review this information
          </div>
        </div>
      );

      await testAccessibility(<SemanticColorComponent />, 'Semantic color usage');
    });
  });

  describe('Screen Reader Compatibility', () => {
    it('should validate ARIA labels and descriptions', async () => {
      const AriaComponent = () => (
        <div>
          <button 
            aria-label="Close modal dialog"
            aria-describedby="close-help"
          >
            ×
          </button>
          <div id="close-help" className="sr-only">
            Closes the current dialog and returns to the main page
          </div>
          
          <div 
            role="tablist" 
            aria-label="Settings categories"
          >
            <button 
              role="tab" 
              aria-selected="true" 
              aria-controls="general-panel"
              id="general-tab"
            >
              General
            </button>
            <button 
              role="tab" 
              aria-selected="false" 
              aria-controls="privacy-panel"
              id="privacy-tab"
            >
              Privacy
            </button>
          </div>
          
          <div 
            role="tabpanel" 
            id="general-panel" 
            aria-labelledby="general-tab"
          >
            General settings content
          </div>
        </div>
      );

      await testAccessibility(<AriaComponent />, 'ARIA labels and descriptions');
    });

    it('should validate live regions for dynamic content', async () => {
      const LiveRegionComponent = () => (
        <div>
          <div 
            role="status" 
            aria-live="polite" 
            aria-atomic="true"
            id="status-message"
          >
            Ready
          </div>
          
          <div 
            role="alert" 
            aria-live="assertive" 
            aria-atomic="true"
            id="error-message"
          >
            {/* Error messages will be announced immediately */}
          </div>
          
          <div 
            aria-live="polite" 
            aria-relevant="additions removals"
            id="task-list-updates"
          >
            {/* Task list changes will be announced politely */}
          </div>
        </div>
      );

      await testAccessibility(<LiveRegionComponent />, 'Live regions');
    });
  });

  describe('Complex Component Patterns', () => {
    it('should validate modal dialogs', async () => {
      const ModalComponent = () => (
        <div>
          <div 
            role="dialog" 
            aria-modal="true" 
            aria-labelledby="modal-title"
            aria-describedby="modal-description"
          >
            <h2 id="modal-title">Confirm Action</h2>
            <p id="modal-description">
              Are you sure you want to delete this item? This action cannot be undone.
            </p>
            
            <div role="group" aria-label="Dialog actions">
              <button type="button" autoFocus>Cancel</button>
              <button type="button">Delete</button>
            </div>
          </div>
          
          <div 
            className="modal-backdrop" 
            aria-hidden="true"
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)' }}
          />
        </div>
      );

      await testAccessibility(<ModalComponent />, 'Modal dialogs');
    });

    it('should validate data tables', async () => {
      const TableComponent = () => (
        <table role="table" aria-label="Task list">
          <caption>
            Your current tasks (3 items)
          </caption>
          <thead>
            <tr>
              <th scope="col" id="task-name">Task Name</th>
              <th scope="col" id="task-status">Status</th>
              <th scope="col" id="task-priority">Priority</th>
              <th scope="col" id="task-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td headers="task-name">Complete project proposal</td>
              <td headers="task-status">
                <span role="img" aria-label="In progress">🔄</span>
                In Progress
              </td>
              <td headers="task-priority">High</td>
              <td headers="task-actions">
                <button aria-label="Edit Complete project proposal task">Edit</button>
              </td>
            </tr>
          </tbody>
        </table>
      );

      await testAccessibility(<TableComponent />, 'Data tables');
    });
  });
});
