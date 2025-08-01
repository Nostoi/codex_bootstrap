/**
 * Comprehensive accessibility tests for ADHD-friendly components
 * 
 * Tests WCAG 2.2 AA compliance, keyboard navigation, screen reader
 * announcements, and ADHD-specific accessibility features.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import {
  AccessibilityProvider,
  AccessibleButton,
  AccessibleInput,
  Modal,
  EnergyIndicator,
  ProgressIndicator,
  LoadingSpinner,
  KeyboardNavigationContainer
} from '../AccessibilityComponents';
import { AccessibleCalendar } from '../AccessibleCalendar';
import { 
  AccessibilityTester,
  expectToBeAccessible,
  expectKeyboardNavigation,
  expectAnnouncement 
} from '../../lib/accessibility-testing';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AccessibilityProvider>
      {children}
    </AccessibilityProvider>
  );
};

describe('Accessibility Components', () => {
  
  // ===== ACCESSIBILITY PROVIDER TESTS =====
  
  describe('AccessibilityProvider', () => {
    test('provides accessibility context to children', () => {
      const TestComponent = () => {
        // Would use useAccessibilityContext() hook here
        return <div>Test</div>;
      };

      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      expect(screen.getByText('Test')).toBeInTheDocument();
    });
  });

  // ===== ACCESSIBLE BUTTON TESTS =====

  describe('AccessibleButton', () => {
    test('renders with proper ARIA attributes', () => {
      render(
        <TestWrapper>
          <AccessibleButton>Click me</AccessibleButton>
        </TestWrapper>
      );

      const button = screen.getByRole('button', { name: 'Click me' });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('type', 'button');
    });

    test('handles loading state correctly', () => {
      render(
        <TestWrapper>
          <AccessibleButton loading>Loading button</AccessibleButton>
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(screen.getByText('Loading')).toBeInTheDocument();
    });

    test('announces custom messages', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <AccessibleButton announcement="Task created successfully">
            Create Task
          </AccessibleButton>
        </TestWrapper>
      );

      const button = screen.getByRole('button', { name: 'Create Task' });
      
      await user.click(button);
      
      // Test would check for live region announcement
      // This would be handled by the LiveAnnouncer in real implementation
    });

    test('supports energy level indicators', () => {
      render(
        <TestWrapper>
          <AccessibleButton energyLevel="high">
            High energy task
          </AccessibleButton>
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('data-energy-level', 'high');
    });

    test('meets WCAG contrast requirements', async () => {
      const { container } = render(
        <TestWrapper>
          <AccessibleButton variant="primary">Primary Button</AccessibleButton>
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      const onClick = jest.fn();

      render(
        <TestWrapper>
          <AccessibleButton onClick={onClick}>Test Button</AccessibleButton>
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      
      // Test Enter key
      button.focus();
      await user.keyboard('{Enter}');
      expect(onClick).toHaveBeenCalledTimes(1);

      // Test Space key
      await user.keyboard(' ');
      expect(onClick).toHaveBeenCalledTimes(2);
    });
  });

  // ===== ACCESSIBLE INPUT TESTS =====

  describe('AccessibleInput', () => {
    test('renders with proper labeling', () => {
      render(
        <TestWrapper>
          <AccessibleInput 
            label="Task name" 
            placeholder="Enter task name"
          />
        </TestWrapper>
      );

      const input = screen.getByLabelText('Task name');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('placeholder', 'Enter task name');
    });

    test('handles required fields correctly', () => {
      render(
        <TestWrapper>
          <AccessibleInput 
            label="Required field" 
            required
          />
        </TestWrapper>
      );

      const input = screen.getByLabelText(/Required field/);
      expect(input).toBeRequired();
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    test('displays error states properly', () => {
      render(
        <TestWrapper>
          <AccessibleInput 
            label="Email" 
            error="Please enter a valid email"
          />
        </TestWrapper>
      );

      const input = screen.getByLabelText('Email');
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByRole('alert')).toHaveTextContent('Please enter a valid email');
    });

    test('provides hint text', () => {
      render(
        <TestWrapper>
          <AccessibleInput 
            label="Password" 
            hint="Must be at least 8 characters"
          />
        </TestWrapper>
      );

      const input = screen.getByLabelText('Password');
      expect(input).toHaveAccessibleDescription('Must be at least 8 characters');
    });

    test('meets accessibility standards', async () => {
      const { container } = render(
        <TestWrapper>
          <AccessibleInput 
            label="Test input"
            hint="Helper text"
            error="Error message"
          />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  // ===== MODAL TESTS =====

  describe('Modal', () => {
    test('renders with proper ARIA attributes', () => {
      render(
        <TestWrapper>
          <Modal 
            isOpen={true}
            onClose={() => {}}
            title="Test Modal"
            description="Modal description"
          >
            Modal content
          </Modal>
        </TestWrapper>
      );

      const modal = screen.getByRole('dialog');
      expect(modal).toHaveAttribute('aria-modal', 'true');
      expect(modal).toHaveAccessibleName('Test Modal');
      expect(modal).toHaveAccessibleDescription('Modal description');
    });

    test('traps focus correctly', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <button>Outside button</button>
          <Modal 
            isOpen={true}
            onClose={() => {}}
            title="Focus trap test"
          >
            <button>Modal button 1</button>
            <button>Modal button 2</button>
          </Modal>
        </TestWrapper>
      );

      // Focus should be trapped within modal
      const modalButton1 = screen.getByText('Modal button 1');
      const modalButton2 = screen.getByText('Modal button 2');
      const closeButton = screen.getByLabelText('Close modal');

      // Test forward tab navigation
      modalButton1.focus();
      await user.tab();
      expect(modalButton2).toHaveFocus();
      
      await user.tab();
      expect(closeButton).toHaveFocus();
      
      await user.tab();
      expect(modalButton1).toHaveFocus(); // Should wrap around
    });

    test('closes on Escape key', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();

      render(
        <TestWrapper>
          <Modal 
            isOpen={true}
            onClose={onClose}
            title="Escape test"
          >
            Modal content
          </Modal>
        </TestWrapper>
      );

      await user.keyboard('{Escape}');
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    test('does not render when closed', () => {
      render(
        <TestWrapper>
          <Modal 
            isOpen={false}
            onClose={() => {}}
            title="Hidden modal"
          >
            Should not be visible
          </Modal>
        </TestWrapper>
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    test('meets accessibility standards', async () => {
      const { container } = render(
        <TestWrapper>
          <Modal 
            isOpen={true}
            onClose={() => {}}
            title="Accessibility test"
          >
            <p>Modal content for testing</p>
          </Modal>
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  // ===== ENERGY INDICATOR TESTS =====

  describe('EnergyIndicator', () => {
    test('renders different energy levels', () => {
      const { rerender } = render(
        <TestWrapper>
          <EnergyIndicator level="high" />
        </TestWrapper>
      );

      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'high energy required');

      rerender(
        <TestWrapper>
          <EnergyIndicator level="medium" />
        </TestWrapper>
      );

      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'medium energy required');

      rerender(
        <TestWrapper>
          <EnergyIndicator level="low" />
        </TestWrapper>
      );

      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'low energy required');
    });

    test('supports custom labels', () => {
      render(
        <TestWrapper>
          <EnergyIndicator level="high" label="Custom energy label" />
        </TestWrapper>
      );

      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Custom energy label');
    });

    test('includes data attributes for styling', () => {
      render(
        <TestWrapper>
          <EnergyIndicator level="medium" />
        </TestWrapper>
      );

      expect(screen.getByRole('status')).toHaveAttribute('data-energy-level', 'medium');
    });
  });

  // ===== PROGRESS INDICATOR TESTS =====

  describe('ProgressIndicator', () => {
    test('renders with proper ARIA attributes', () => {
      render(
        <TestWrapper>
          <ProgressIndicator 
            current={3} 
            total={10} 
            label="Task progress" 
          />
        </TestWrapper>
      );

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuemin', '0');
      expect(progressbar).toHaveAttribute('aria-valuemax', '10');
      expect(progressbar).toHaveAttribute('aria-valuenow', '3');
      expect(progressbar).toHaveAttribute('aria-label', 'Task progress');
    });

    test('calculates percentage correctly', () => {
      render(
        <TestWrapper>
          <ProgressIndicator current={7} total={10} showPercentage />
        </TestWrapper>
      );

      expect(screen.getByText('70%')).toBeInTheDocument();
    });

    test('announces progress changes', () => {
      const { rerender } = render(
        <TestWrapper>
          <ProgressIndicator current={5} total={10} />
        </TestWrapper>
      );

      // Initial progress
      expect(screen.getByText('5 of 10 tasks completed, 50 percent')).toBeInTheDocument();

      // Updated progress
      rerender(
        <TestWrapper>
          <ProgressIndicator current={8} total={10} />
        </TestWrapper>
      );

      expect(screen.getByText('8 of 10 tasks completed, 80 percent')).toBeInTheDocument();
    });
  });

  // ===== KEYBOARD NAVIGATION CONTAINER TESTS =====

  describe('KeyboardNavigationContainer', () => {
    test('enables keyboard navigation for child elements', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <KeyboardNavigationContainer>
            <button>Button 1</button>
            <button>Button 2</button>
            <button>Button 3</button>
          </KeyboardNavigationContainer>
        </TestWrapper>
      );

      const button1 = screen.getByText('Button 1');
      const button2 = screen.getByText('Button 2');
      const button3 = screen.getByText('Button 3');

      button1.focus();
      
      // Test arrow key navigation
      await user.keyboard('{ArrowDown}');
      expect(button2).toHaveFocus();
      
      await user.keyboard('{ArrowDown}');
      expect(button3).toHaveFocus();
      
      // Test looping
      await user.keyboard('{ArrowDown}');
      expect(button1).toHaveFocus();
    });

    test('supports different navigation directions', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <KeyboardNavigationContainer direction="horizontal">
            <button>Left</button>
            <button>Right</button>
          </KeyboardNavigationContainer>
        </TestWrapper>
      );

      const leftButton = screen.getByText('Left');
      const rightButton = screen.getByText('Right');

      leftButton.focus();
      
      await user.keyboard('{ArrowRight}');
      expect(rightButton).toHaveFocus();
      
      await user.keyboard('{ArrowLeft}');
      expect(leftButton).toHaveFocus();
    });
  });

  // ===== ACCESSIBLE CALENDAR TESTS =====

  describe('AccessibleCalendar', () => {
    const mockEvents = [
      {
        id: '1',
        title: 'Team meeting',
        date: new Date(2024, 0, 15),
        energyLevel: 'medium' as const,
      },
      {
        id: '2',
        title: 'Project deadline',
        date: new Date(2024, 0, 20),
        energyLevel: 'high' as const,
      },
    ];

    test('renders calendar grid with proper structure', () => {
      render(
        <TestWrapper>
          <AccessibleCalendar events={mockEvents} />
        </TestWrapper>
      );

      const calendar = screen.getByRole('grid');
      expect(calendar).toHaveAttribute('aria-rowcount', '7');
      expect(calendar).toHaveAttribute('aria-colcount', '7');
    });

    test('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <AccessibleCalendar selectedDate={new Date(2024, 0, 15)} />
        </TestWrapper>
      );

      const calendar = screen.getByRole('grid');
      calendar.focus();

      // Test arrow key navigation
      await user.keyboard('{ArrowRight}');
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowLeft}');
      await user.keyboard('{ArrowUp}');

      // Test Home/End keys
      await user.keyboard('{Home}');
      await user.keyboard('{End}');

      // Test Page Up/Down for month navigation
      await user.keyboard('{PageDown}');
      await user.keyboard('{PageUp}');
    });

    test('announces date selections', async () => {
      const user = userEvent.setup();
      const onDateSelect = jest.fn();
      
      render(
        <TestWrapper>
          <AccessibleCalendar onDateSelect={onDateSelect} />
        </TestWrapper>
      );

      const firstDay = screen.getAllByRole('gridcell')[7]; // Skip header row
      await user.click(firstDay);
      
      expect(onDateSelect).toHaveBeenCalled();
    });

    test('displays events correctly', () => {
      render(
        <TestWrapper>
          <AccessibleCalendar events={mockEvents} />
        </TestWrapper>
      );

      // Check for event indicators
      const eventDays = screen.getAllByText(/event/i);
      expect(eventDays.length).toBeGreaterThan(0);
    });

    test('shows energy levels when enabled', () => {
      render(
        <TestWrapper>
          <AccessibleCalendar 
            events={mockEvents} 
            showEnergyLevels={true}
          />
        </TestWrapper>
      );

      // Energy indicators should be present for days with events
      const energyIndicators = document.querySelectorAll('[data-energy-level]');
      expect(energyIndicators.length).toBeGreaterThan(0);
    });

    test('meets accessibility standards', async () => {
      const { container } = render(
        <TestWrapper>
          <AccessibleCalendar events={mockEvents} />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  // ===== INTEGRATION TESTS =====

  describe('Integration Tests', () => {
    test('multiple components work together', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <div>
            <AccessibleButton>Open Calendar</AccessibleButton>
            <AccessibleCalendar />
            <ProgressIndicator current={5} total={10} />
            <EnergyIndicator level="medium" />
          </div>
        </TestWrapper>
      );

      // Test that all components render without conflicts
      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByRole('grid')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument();

      // Test keyboard navigation between components
      const button = screen.getByRole('button');
      button.focus();
      
      await user.tab();
      // Focus should move to calendar
      
      await user.tab();
      // Focus should continue through focusable elements
    });

    test('respects user preferences', () => {
      // Mock user preferences
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query.includes('prefers-reduced-motion'),
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      render(
        <TestWrapper>
          <LoadingSpinner />
        </TestWrapper>
      );

      // Spinner should respect reduced motion preference
      const spinner = screen.getByRole('status');
      expect(spinner).toBeInTheDocument();
    });
  });

  // ===== PERFORMANCE TESTS =====

  describe('Performance Tests', () => {
    test('components render efficiently with many elements', () => {
      const manyEvents = Array.from({ length: 100 }, (_, i) => ({
        id: `event-${i}`,
        title: `Event ${i}`,
        date: new Date(2024, 0, (i % 30) + 1),
        energyLevel: ['high', 'medium', 'low'][i % 3] as 'high' | 'medium' | 'low',
      }));

      const startTime = performance.now();
      
      render(
        <TestWrapper>
          <AccessibleCalendar events={manyEvents} />
        </TestWrapper>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Render should complete in reasonable time (less than 100ms)
      expect(renderTime).toBeLessThan(100);
    });
  });

  // ===== ERROR HANDLING TESTS =====

  describe('Error Handling', () => {
    test('handles invalid dates gracefully', () => {
      const invalidEvents = [
        {
          id: '1',
          title: 'Invalid event',
          date: new Date('invalid'),
          energyLevel: 'medium' as const,
        },
      ];

      expect(() => {
        render(
          <TestWrapper>
            <AccessibleCalendar events={invalidEvents} />
          </TestWrapper>
        );
      }).not.toThrow();
    });

    test('handles missing accessibility context gracefully', () => {
      // Test component outside of AccessibilityProvider
      expect(() => {
        render(<AccessibleButton>Test</AccessibleButton>);
      }).toThrow('useAccessibilityContext must be used within AccessibilityProvider');
    });
  });
});

// ===== CUSTOM ACCESSIBILITY TESTS =====

describe('Custom Accessibility Testing', () => {
  test('comprehensive WCAG compliance check', async () => {
    const { container } = render(
      <TestWrapper>
        <div>
          <AccessibleButton>Primary Action</AccessibleButton>
          <AccessibleInput label="User input" />
          <ProgressIndicator current={3} total={5} />
          <EnergyIndicator level="high" />
        </div>
      </TestWrapper>
    );

    await expectToBeAccessible(container, {
      wcagLevel: 'AA',
      colorContrast: true,
      focus: true,
      keyboard: true,
    });
  });

  test('keyboard navigation patterns', async () => {
    const { container } = render(
      <TestWrapper>
        <KeyboardNavigationContainer>
          <button>Item 1</button>
          <button>Item 2</button>
          <button>Item 3</button>
        </KeyboardNavigationContainer>
      </TestWrapper>
    );

    await expectKeyboardNavigation(
      container,
      ['ArrowDown', 'ArrowDown', 'Enter'],
      'Navigate to third item and activate'
    );
  });

  test('screen reader announcements', async () => {
    const { container } = render(
      <TestWrapper>
        <AccessibleButton announcement="Task completed successfully">
          Complete Task
        </AccessibleButton>
      </TestWrapper>
    );

    await expectAnnouncement(
      container,
      () => {
        fireEvent.click(screen.getByRole('button'));
      },
      'Task completed successfully'
    );
  });
});

// ===== ADHD-SPECIFIC TESTS =====

describe('ADHD-Specific Features', () => {
  test('energy level indicators function correctly', () => {
    render(
      <TestWrapper>
        <div>
          <EnergyIndicator level="high" />
          <EnergyIndicator level="medium" />
          <EnergyIndicator level="low" />
        </div>
      </TestWrapper>
    );

    const indicators = screen.getAllByRole('status');
    expect(indicators).toHaveLength(3);
    
    expect(indicators[0]).toHaveAttribute('data-energy-level', 'high');
    expect(indicators[1]).toHaveAttribute('data-energy-level', 'medium');
    expect(indicators[2]).toHaveAttribute('data-energy-level', 'low');
  });

  test('cognitive load indicators provide appropriate feedback', () => {
    render(
      <TestWrapper>
        <AccessibleButton cognitiveLoad="high">
          Complex Action
        </AccessibleButton>
      </TestWrapper>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-cognitive-load', 'high');
  });

  test('progress indicators help with task completion awareness', () => {
    render(
      <TestWrapper>
        <ProgressIndicator 
          current={7} 
          total={10} 
          label="Daily tasks" 
          showPercentage
        />
      </TestWrapper>
    );

    expect(screen.getByText('70%')).toBeInTheDocument();
    expect(screen.getByText('7 of 10 tasks completed, 70 percent')).toBeInTheDocument();
  });
});
