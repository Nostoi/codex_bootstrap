/**
 * Calendar Accessibility Tests
 * Comprehensive test suite for WCAG 2.2 AA compliance in calendar components
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { AccessibilityTester } from '../lib/accessibility-testing';
import CalendarView from '../components/calendar/CalendarView';
import { CalendarGrid } from '../components/calendar/CalendarGrid';
import { CalendarHeader } from '../components/calendar/CalendarHeader';
import { AccessibilityProvider } from '../components/accessibility/AccessibilityComponents';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock data for testing
const mockCalendarDate = {
  year: 2025,
  month: 1,
  day: 15,
};

const mockCalendarEvents = [
  {
    id: '1',
    title: 'Team Meeting',
    startTime: new Date('2025-01-15T09:00:00'),
    endTime: new Date('2025-01-15T10:00:00'),
    source: 'google' as const,
    energyLevel: 'HIGH' as const,
    focusType: 'SOCIAL' as const,
    isAllDay: false,
  },
  {
    id: '2',
    title: 'Focus Work',
    startTime: new Date('2025-01-15T14:00:00'),
    endTime: new Date('2025-01-15T16:00:00'),
    source: 'task' as const,
    energyLevel: 'MEDIUM' as const,
    focusType: 'TECHNICAL' as const,
    isAllDay: false,
  },
];

const mockADHDSettings = {
  reducedMotion: false,
  highContrast: false,
  colorblindMode: 'none' as const,
  dragDelay: 300,
  confirmTimeChanges: true,
  enableSounds: false,
  maxEventsPerView: 3,
  showEnergyIndicators: true,
  enableFocusMode: false,
  reminderBuffer: 15,
  gentleTransitions: true,
};

// Mock the useCalendarEvents hook
vi.mock('../hooks/useApi', () => ({
  useCalendarEvents: () => ({
    data: { events: mockCalendarEvents },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

describe('Calendar Accessibility Tests', () => {
  let accessibilityTester: AccessibilityTester;

  beforeEach(() => {
    accessibilityTester = new AccessibilityTester();

    // Mock media queries for accessibility preferences
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
  });

  describe('CalendarView Accessibility', () => {
    test('meets WCAG 2.2 AA standards', async () => {
      const { container } = render(
        <AccessibilityProvider>
          <CalendarView
            initialView="weekly"
            initialDate={mockCalendarDate}
            adhdSettings={mockADHDSettings}
          />
        </AccessibilityProvider>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('has proper ARIA landmarks and roles', () => {
      render(
        <AccessibilityProvider>
          <CalendarView
            initialView="weekly"
            initialDate={mockCalendarDate}
            adhdSettings={mockADHDSettings}
          />
        </AccessibilityProvider>
      );

      // Check main calendar application role
      expect(screen.getByRole('application')).toBeInTheDocument();

      // Check navigation landmark
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('navigation')).toBeInTheDocument();

      // Check grid role for calendar grid
      expect(screen.getByRole('grid')).toBeInTheDocument();

      // Check tablist for view selector
      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });

    test('provides comprehensive screen reader instructions', () => {
      render(
        <AccessibilityProvider>
          <CalendarView
            initialView="weekly"
            initialDate={mockCalendarDate}
            adhdSettings={mockADHDSettings}
          />
        </AccessibilityProvider>
      );

      // Check for screen reader instructions
      expect(screen.getByText(/Use arrow keys to navigate/)).toBeInTheDocument();
      expect(screen.getByText(/Press Enter or Space to select/)).toBeInTheDocument();
      expect(screen.getByText(/Press 1 for daily view/)).toBeInTheDocument();

      // Check for help text
      expect(
        screen.getByText(/Calendar events can be selected and rescheduled/)
      ).toBeInTheDocument();
    });

    test('has live regions for dynamic announcements', () => {
      render(
        <AccessibilityProvider>
          <CalendarView
            initialView="weekly"
            initialDate={mockCalendarDate}
            adhdSettings={mockADHDSettings}
          />
        </AccessibilityProvider>
      );

      // Check for polite live region
      const politeRegion = document.querySelector('[aria-live="polite"]');
      expect(politeRegion).toBeInTheDocument();

      // Check for assertive live region
      const assertiveRegion = document.querySelector('[aria-live="assertive"]');
      expect(assertiveRegion).toBeInTheDocument();
    });

    test('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      const mockViewChange = jest.fn();

      render(
        <AccessibilityProvider>
          <CalendarView
            initialView="weekly"
            initialDate={mockCalendarDate}
            onViewChange={mockViewChange}
            adhdSettings={mockADHDSettings}
          />
        </AccessibilityProvider>
      );

      const calendarElement = screen.getByRole('application');
      calendarElement.focus();

      // Test view change shortcuts
      await user.keyboard('1');
      expect(mockViewChange).toHaveBeenCalledWith('daily');

      await user.keyboard('2');
      expect(mockViewChange).toHaveBeenCalledWith('weekly');

      await user.keyboard('3');
      expect(mockViewChange).toHaveBeenCalledWith('monthly');
    });

    test('respects reduced motion preferences', () => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query.includes('prefers-reduced-motion: reduce'),
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
        <AccessibilityProvider>
          <CalendarView
            initialView="weekly"
            initialDate={mockCalendarDate}
            adhdSettings={mockADHDSettings}
          />
        </AccessibilityProvider>
      );

      const calendarElement = screen.getByRole('application');
      const styles = getComputedStyle(calendarElement);

      // Should have reduced motion styles applied
      expect(calendarElement).toHaveStyle({
        '--calendar-motion-duration': '0ms',
      });
    });
  });

  describe('CalendarHeader Accessibility', () => {
    test('has proper navigation structure', () => {
      const mockProps = {
        currentDate: mockCalendarDate,
        currentView: 'weekly' as const,
        onDateChange: jest.fn(),
        onViewChange: jest.fn(),
        onPrevious: jest.fn(),
        onNext: jest.fn(),
        onToday: jest.fn(),
        showViewSelector: true,
        disabled: false,
        isLoading: false,
        onRefresh: jest.fn(),
      };

      render(<CalendarHeader {...mockProps} />);

      // Check navigation roles
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('navigation')).toBeInTheDocument();

      // Check button accessibility
      expect(screen.getByLabelText(/Go to previous weekly/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Go to next weekly/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Go to today/)).toBeInTheDocument();

      // Check view selector tablist
      expect(screen.getByRole('tablist')).toBeInTheDocument();
      expect(screen.getAllByRole('tab')).toHaveLength(3);
    });

    test('announces current date changes', () => {
      const mockProps = {
        currentDate: mockCalendarDate,
        currentView: 'weekly' as const,
        onDateChange: jest.fn(),
        onViewChange: jest.fn(),
        onPrevious: jest.fn(),
        onNext: jest.fn(),
        onToday: jest.fn(),
      };

      render(<CalendarHeader {...mockProps} />);

      // Check for live region on date display
      const dateDisplay = screen.getByRole('heading', { level: 2 });
      expect(dateDisplay).toHaveAttribute('aria-live', 'polite');
    });

    test('has proper keyboard shortcuts indicated', () => {
      const mockProps = {
        currentDate: mockCalendarDate,
        currentView: 'weekly' as const,
        onDateChange: jest.fn(),
        onViewChange: jest.fn(),
        onPrevious: jest.fn(),
        onNext: jest.fn(),
        onToday: jest.fn(),
        showViewSelector: true,
      };

      render(<CalendarHeader {...mockProps} />);

      // Check keyboard shortcut hints in tooltips
      expect(screen.getByTitle(/Keyboard shortcut: 1/)).toBeInTheDocument();
      expect(screen.getByTitle(/Keyboard shortcut: 2/)).toBeInTheDocument();
      expect(screen.getByTitle(/Keyboard shortcut: 3/)).toBeInTheDocument();
    });
  });

  describe('CalendarGrid Accessibility', () => {
    test('has proper grid structure', () => {
      const mockProps = {
        currentDate: mockCalendarDate,
        currentView: 'weekly' as const,
        events: mockCalendarEvents,
        isLoading: false,
        onEventClick: jest.fn(),
        maxEventsPerSlot: 3,
        enableDragAndDrop: true,
        adhdSettings: mockADHDSettings,
        onEventMove: jest.fn(),
        onTimeSlotClick: jest.fn(),
      };

      render(<CalendarGrid {...mockProps} />);

      const grid = screen.getByRole('grid');
      expect(grid).toBeInTheDocument();
      expect(grid).toHaveAttribute('aria-rowcount');
      expect(grid).toHaveAttribute('aria-colcount');
    });

    test('respects ADHD settings for motion and contrast', () => {
      const adhdSettings = {
        ...mockADHDSettings,
        reducedMotion: true,
        highContrast: true,
      };

      const mockProps = {
        currentDate: mockCalendarDate,
        currentView: 'weekly' as const,
        events: mockCalendarEvents,
        isLoading: false,
        adhdSettings,
      };

      render(<CalendarGrid {...mockProps} />);

      const grid = screen.getByRole('grid');
      expect(grid).toHaveStyle({
        '--calendar-reduce-motion': '1',
      });
    });
  });

  describe('Color Contrast Compliance', () => {
    test('meets WCAG AA contrast requirements', async () => {
      const { container } = render(
        <AccessibilityProvider>
          <CalendarView
            initialView="weekly"
            initialDate={mockCalendarDate}
            adhdSettings={mockADHDSettings}
          />
        </AccessibilityProvider>
      );

      const contrastResults = await accessibilityTester.checkColorContrast(container);
      expect(contrastResults.passes).toBe(true);
      expect(contrastResults.ratios.every(ratio => ratio >= 4.5)).toBe(true);
    });

    test('supports high contrast mode', () => {
      // Mock high contrast preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query.includes('prefers-contrast: high'),
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
        <AccessibilityProvider>
          <CalendarView
            initialView="weekly"
            initialDate={mockCalendarDate}
            adhdSettings={mockADHDSettings}
          />
        </AccessibilityProvider>
      );

      const calendarElement = screen.getByRole('application');
      expect(calendarElement).toHaveStyle({
        '--calendar-high-contrast': '1',
      });
    });
  });

  describe('Focus Management', () => {
    test('manages focus correctly on view changes', async () => {
      const user = userEvent.setup();

      render(
        <AccessibilityProvider>
          <CalendarView
            initialView="weekly"
            initialDate={mockCalendarDate}
            adhdSettings={mockADHDSettings}
          />
        </AccessibilityProvider>
      );

      // Change to daily view
      const dailyTab = screen.getByRole('tab', { name: /Day/ });
      await user.click(dailyTab);

      // Focus should move to grid after view change
      await waitFor(() => {
        const grid = screen.getByRole('grid');
        expect(grid).toHaveFocus();
      });
    });

    test('provides skip links for keyboard users', () => {
      render(
        <AccessibilityProvider>
          <CalendarView
            initialView="weekly"
            initialDate={mockCalendarDate}
            adhdSettings={mockADHDSettings}
          />
        </AccessibilityProvider>
      );

      // Check for descriptive content that acts as skip navigation
      expect(
        screen.getByText(/Use Tab to navigate between interactive elements/)
      ).toBeInTheDocument();
    });
  });

  describe('Error Handling Accessibility', () => {
    test('announces errors to screen readers', () => {
      // Mock error state
      jest.doMock('../hooks/useApi', () => ({
        useCalendarEvents: () => ({
          data: null,
          isLoading: false,
          error: new Error('Failed to load'),
          refetch: jest.fn(),
        }),
      }));

      render(
        <AccessibilityProvider>
          <CalendarView
            initialView="weekly"
            initialDate={mockCalendarDate}
            adhdSettings={mockADHDSettings}
          />
        </AccessibilityProvider>
      );

      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toBeInTheDocument();
      expect(errorAlert).toHaveAttribute('aria-live', 'assertive');
      expect(errorAlert).toHaveAttribute('aria-labelledby');
      expect(errorAlert).toHaveAttribute('aria-describedby');
    });
  });

  describe('Loading States Accessibility', () => {
    test('announces loading states appropriately', () => {
      // Mock loading state
      jest.doMock('../hooks/useApi', () => ({
        useCalendarEvents: () => ({
          data: null,
          isLoading: true,
          error: null,
          refetch: jest.fn(),
        }),
      }));

      render(
        <AccessibilityProvider>
          <CalendarView
            initialView="weekly"
            initialDate={mockCalendarDate}
            adhdSettings={mockADHDSettings}
          />
        </AccessibilityProvider>
      );

      const loadingStatus = screen.getByRole('status');
      expect(loadingStatus).toBeInTheDocument();
      expect(loadingStatus).toHaveAttribute('aria-live', 'polite');
      expect(screen.getByText(/Loading calendar events/)).toBeInTheDocument();
    });
  });
});

describe('Keyboard Navigation Integration Tests', () => {
  test('complete keyboard workflow', async () => {
    const user = userEvent.setup();
    const mockEventClick = jest.fn();

    render(
      <AccessibilityProvider>
        <CalendarView
          initialView="weekly"
          initialDate={mockCalendarDate}
          onEventClick={mockEventClick}
          adhdSettings={mockADHDSettings}
        />
      </AccessibilityProvider>
    );

    const calendarElement = screen.getByRole('application');

    // Start with calendar focused
    calendarElement.focus();
    expect(calendarElement).toHaveFocus();

    // Navigate through views
    await user.keyboard('1'); // Daily view
    await user.keyboard('2'); // Weekly view
    await user.keyboard('3'); // Monthly view

    // Navigate through time
    await user.keyboard('[ArrowLeft]'); // Previous period
    await user.keyboard('[ArrowRight]'); // Next period
    await user.keyboard('[Home]'); // Today

    // Tab through interactive elements
    await user.keyboard('[Tab]'); // Should move to first button
    await user.keyboard('[Tab]'); // Next button
    await user.keyboard('[Tab]'); // Next button

    // All navigation should work without errors
    expect(mockEventClick).not.toHaveBeenCalled(); // No accidental event selections
  });
});

// Performance tests for accessibility features
describe('Calendar Accessibility Performance', () => {
  test('accessibility features do not impact performance significantly', async () => {
    const startTime = performance.now();

    render(
      <AccessibilityProvider>
        <CalendarView
          initialView="weekly"
          initialDate={mockCalendarDate}
          adhdSettings={mockADHDSettings}
        />
      </AccessibilityProvider>
    );

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Rendering with accessibility should be fast (< 100ms for this simple case)
    expect(renderTime).toBeLessThan(100);
  });

  test('large event datasets maintain accessibility', async () => {
    // Create large dataset
    const largeEventSet = Array.from({ length: 100 }, (_, i) => ({
      id: `event-${i}`,
      title: `Event ${i}`,
      startTime: new Date(`2025-01-15T${String(9 + (i % 8)).padStart(2, '0')}:00:00`),
      endTime: new Date(`2025-01-15T${String(10 + (i % 8)).padStart(2, '0')}:00:00`),
      source: 'google' as const,
      energyLevel: 'MEDIUM' as const,
      focusType: 'TECHNICAL' as const,
      isAllDay: false,
    }));

    // Mock large dataset
    jest.doMock('../hooks/useApi', () => ({
      useCalendarEvents: () => ({
        data: { events: largeEventSet },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      }),
    }));

    const { container } = render(
      <AccessibilityProvider>
        <CalendarView
          initialView="weekly"
          initialDate={mockCalendarDate}
          adhdSettings={mockADHDSettings}
        />
      </AccessibilityProvider>
    );

    // Should still meet accessibility standards with large datasets
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
