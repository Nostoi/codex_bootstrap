import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FilterBar, type FilterValues } from './FilterBar';

// Default filter values for testing
const defaultFilters: FilterValues = {
  search: '',
  energyLevels: [],
  focusTypes: [],
  statuses: [],
  priorityRange: [1, 5],
  dateRange: undefined,
};

const activeFilters: FilterValues = {
  search: 'test task',
  energyLevels: ['HIGH', 'MEDIUM'],
  focusTypes: ['CREATIVE', 'TECHNICAL'],
  statuses: ['TODO', 'IN_PROGRESS'],
  priorityRange: [3, 5],
  dateRange: {
    start: '2025-07-28',
    end: '2025-08-04',
  },
};

describe('FilterBar', () => {
  let mockOnFiltersChange: ReturnType<typeof vi.fn>;
  let mockOnClear: ReturnType<typeof vi.fn>;
  let mockOnReset: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnFiltersChange = vi.fn();
    mockOnClear = vi.fn();
    mockOnReset = vi.fn();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      render(
        <FilterBar
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      expect(screen.getByRole('toolbar')).toBeInTheDocument();
      expect(screen.getByLabelText('Filter tasks')).toBeInTheDocument();
    });

    it('renders all filter sections', () => {
      render(
        <FilterBar
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      expect(screen.getByText('Energy Level')).toBeInTheDocument();
      expect(screen.getByText('Focus Type')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Priority Range')).toBeInTheDocument();
    });

    it('renders search input with proper accessibility', () => {
      render(
        <FilterBar
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const searchInput = screen.getByLabelText('Search tasks by title or description');
      expect(searchInput).toBeInTheDocument();
      expect(searchInput).toHaveAttribute('placeholder', 'Search tasks...');
      expect(searchInput).toHaveAttribute('aria-describedby', 'search-help');
    });

    it('renders energy level buttons with proper ARIA attributes', () => {
      render(
        <FilterBar
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const highEnergyButton = screen.getByLabelText('Filter by High Energy');
      expect(highEnergyButton).toHaveAttribute('aria-pressed', 'false');
      // Note: button elements have implicit role="button", so we don't need to check for explicit role
      expect(highEnergyButton.tagName).toBe('BUTTON');
    });
  });

  describe('Search Functionality', () => {
    it('updates search input value immediately', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      render(
        <FilterBar
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const searchInput = screen.getByLabelText('Search tasks by title or description');
      await user.type(searchInput, 'test');

      expect(searchInput).toHaveValue('test');
    });

    it('debounces search changes with 300ms delay', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      render(
        <FilterBar
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const searchInput = screen.getByLabelText('Search tasks by title or description');
      await user.type(searchInput, 'test');

      // Should not call onFiltersChange immediately
      expect(mockOnFiltersChange).not.toHaveBeenCalled();

      // Advance timers by 300ms
      vi.advanceTimersByTime(300);

      // Should call onFiltersChange after debounce delay
      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...defaultFilters,
        search: 'test',
      });
    });

    it('updates search input when filters change externally', () => {
      const { rerender } = render(
        <FilterBar
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const searchInput = screen.getByLabelText('Search tasks by title or description');
      expect(searchInput).toHaveValue('');

      rerender(
        <FilterBar
          filters={{ ...defaultFilters, search: 'external update' }}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      expect(searchInput).toHaveValue('external update');
    });
  });

  describe('Filter State Display', () => {
    it('shows energy level buttons as active when selected', () => {
      render(
        <FilterBar
          filters={{ ...defaultFilters, energyLevels: ['HIGH'] }}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const highEnergyButton = screen.getByLabelText('Filter by High Energy');
      const mediumEnergyButton = screen.getByLabelText('Filter by Medium Energy');

      expect(highEnergyButton).toHaveAttribute('aria-pressed', 'true');
      expect(mediumEnergyButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('shows focus type buttons as active when selected', () => {
      render(
        <FilterBar
          filters={{ ...defaultFilters, focusTypes: ['CREATIVE'] }}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const creativeButton = screen.getByLabelText('Filter by Creative tasks');
      const technicalButton = screen.getByLabelText('Filter by Technical tasks');

      expect(creativeButton).toHaveAttribute('aria-pressed', 'true');
      expect(technicalButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('shows status buttons as active when selected', () => {
      render(
        <FilterBar
          filters={{ ...defaultFilters, statuses: ['TODO'] }}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const todoButton = screen.getByLabelText('Filter by To Do status');
      const inProgressButton = screen.getByLabelText('Filter by In Progress status');

      expect(todoButton).toHaveAttribute('aria-pressed', 'true');
      expect(inProgressButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('displays current priority range', () => {
      render(
        <FilterBar
          filters={{ ...defaultFilters, priorityRange: [2, 4] }}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      expect(screen.getByText('Priority 2 - 4')).toBeInTheDocument();
    });
  });

  describe('Filter Count and Management', () => {
    it('displays active filter count', () => {
      render(
        <FilterBar
          filters={activeFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const filterCountBadge = screen.getByLabelText(/active filter/);
      expect(filterCountBadge).toBeInTheDocument();
    });

    it('shows clear button when filters are active', () => {
      render(
        <FilterBar
          filters={activeFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      expect(screen.getByLabelText('Clear all filters')).toBeInTheDocument();
    });

    it('does not show clear button when no filters are active', () => {
      render(
        <FilterBar
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      expect(screen.queryByLabelText('Clear all filters')).not.toBeInTheDocument();
    });

    it('shows reset button when onReset is provided', () => {
      render(
        <FilterBar
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          onReset={mockOnReset}
        />
      );

      expect(screen.getByLabelText('Reset filters to default')).toBeInTheDocument();
    });
  });

  describe('Compact Mode', () => {
    it('shows expand/collapse button in compact mode', () => {
      render(
        <FilterBar
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          compact={true}
        />
      );

      expect(screen.getByLabelText('Expand filters')).toBeInTheDocument();
    });

    it('toggles filter visibility in compact mode', async () => {
      const user = userEvent.setup();
      
      render(
        <FilterBar
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          compact={true}
        />
      );

      const expandButton = screen.getByLabelText('Expand filters');
      
      // Check initial state - in compact mode, the filter sections should be collapsed
      // We'll check if the expand button shows 'Expand' initially
      expect(expandButton).toHaveAttribute('aria-label', 'Expand filters');

      await user.click(expandButton);

      // After expanding, button should update to collapse
      await waitFor(() => {
        expect(screen.getByLabelText('Collapse filters')).toBeInTheDocument();
      });
    });

    it('does not show expand/collapse button in non-compact mode', () => {
      render(
        <FilterBar
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          compact={false}
        />
      );

      expect(screen.queryByLabelText('Expand filters')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Collapse filters')).not.toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('displays loading overlay when loading is true', () => {
      render(
        <FilterBar
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          loading={true}
        />
      );

      expect(screen.getByLabelText('Applying filters')).toBeInTheDocument();
      expect(screen.getByText('Applying filters...')).toBeInTheDocument();
    });

    it('disables search input when loading', () => {
      render(
        <FilterBar
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          loading={true}
        />
      );

      const searchInput = screen.getByLabelText('Search tasks by title or description');
      expect(searchInput).toBeDisabled();
    });

    it('does not show loading overlay when loading is false', () => {
      render(
        <FilterBar
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          loading={false}
        />
      );

      expect(screen.queryByLabelText('Applying filters')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA roles and attributes', () => {
      render(
        <FilterBar
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const toolbar = screen.getByRole('toolbar');
      expect(toolbar).toHaveAttribute('aria-label', 'Filter tasks');

      const energyGroup = screen.getByRole('group', { name: /select energy levels/i });
      expect(energyGroup).toBeInTheDocument();
    });

    it('announces filter button states with aria-pressed', () => {
      render(
        <FilterBar
          filters={{ ...defaultFilters, energyLevels: ['HIGH'] }}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const highEnergyButton = screen.getByLabelText('Filter by High Energy');
      const mediumEnergyButton = screen.getByLabelText('Filter by Medium Energy');

      expect(highEnergyButton).toHaveAttribute('aria-pressed', 'true');
      expect(mediumEnergyButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('provides screen reader help for search input', () => {
      render(
        <FilterBar
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const helpText = screen.getByText(/search will automatically filter tasks/i);
      expect(helpText).toHaveClass('sr-only');
    });

    it('uses custom aria-label when provided', () => {
      render(
        <FilterBar
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          aria-label="Custom filter label"
        />
      );

      const toolbar = screen.getByRole('toolbar');
      expect(toolbar).toHaveAttribute('aria-label', 'Custom filter label');
    });
  });

  describe('Edge Cases', () => {
    it('handles missing callback functions gracefully', () => {
      render(
        <FilterBar
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      // Should render without errors even without onClear and onReset
      expect(screen.getByRole('toolbar')).toBeInTheDocument();
    });

    it('calculates filter count correctly with various combinations', () => {
      render(
        <FilterBar
          filters={{
            search: 'test',
            energyLevels: ['HIGH'],
            focusTypes: ['CREATIVE', 'TECHNICAL'],
            statuses: [],
            priorityRange: [2, 4],
            dateRange: { start: '2025-07-28' },
          }}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      // Should count: search + energyLevels + focusTypes + priorityRange + dateRange = 5
      const filterCountBadge = screen.getByLabelText(/5 active filters/);
      expect(filterCountBadge).toBeInTheDocument();
    });
  });

  // Interaction tests with simpler approach to avoid timeouts
  describe('Filter Interactions', () => {
    it('shows correct button states for energy levels', () => {
      render(
        <FilterBar
          filters={{ ...defaultFilters, energyLevels: ['HIGH', 'MEDIUM'] }}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      expect(screen.getByLabelText('Filter by High Energy')).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByLabelText('Filter by Medium Energy')).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByLabelText('Filter by Low Energy')).toHaveAttribute('aria-pressed', 'false');
    });

    it('shows correct button states for focus types', () => {
      render(
        <FilterBar
          filters={{ ...defaultFilters, focusTypes: ['CREATIVE'] }}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      expect(screen.getByLabelText('Filter by Creative tasks')).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByLabelText('Filter by Technical tasks')).toHaveAttribute('aria-pressed', 'false');
    });

    it('shows correct button states for status filters', () => {
      render(
        <FilterBar
          filters={{ ...defaultFilters, statuses: ['TODO', 'IN_PROGRESS'] }}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      expect(screen.getByLabelText('Filter by To Do status')).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByLabelText('Filter by In Progress status')).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByLabelText('Filter by Done status')).toHaveAttribute('aria-pressed', 'false');
    });

    it('shows correct priority range values', () => {
      render(
        <FilterBar
          filters={{ ...defaultFilters, priorityRange: [3, 4] }}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const minSelect = screen.getByLabelText('Minimum priority level');
      const maxSelect = screen.getByLabelText('Maximum priority level');

      expect(minSelect).toHaveValue('3');
      expect(maxSelect).toHaveValue('4');
    });
  });
});

describe('FilterBar', () => {
  let mockOnFiltersChange: ReturnType<typeof vi.fn>;
  let mockOnClear: ReturnType<typeof vi.fn>;
  let mockOnReset: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnFiltersChange = vi.fn();
    mockOnClear = vi.fn();
    mockOnReset = vi.fn();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      render(
        <FilterBar
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      expect(screen.getByRole('toolbar')).toBeInTheDocument();
      expect(screen.getByLabelText('Filter tasks')).toBeInTheDocument();
    });

    it('renders all filter sections', () => {
      render(
        <FilterBar
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      expect(screen.getByText('Energy Level')).toBeInTheDocument();
      expect(screen.getByText('Focus Type')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Priority Range')).toBeInTheDocument();
    });

    it('renders search input with proper accessibility', () => {
      render(
        <FilterBar
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const searchInput = screen.getByLabelText('Search tasks by title or description');
      expect(searchInput).toBeInTheDocument();
      expect(searchInput).toHaveAttribute('placeholder', 'Search tasks...');
      expect(searchInput).toHaveAttribute('aria-describedby', 'search-help');
    });

    it('renders energy level buttons with proper ARIA attributes', () => {
      render(
        <FilterBar
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const highEnergyButton = screen.getByLabelText('Filter by High Energy');
      expect(highEnergyButton).toHaveAttribute('aria-pressed', 'false');
      // Note: button elements have implicit role="button", so we don't need to check for explicit role
      expect(highEnergyButton.tagName).toBe('BUTTON');
    });
  });

  describe('Search Functionality', () => {
    it('updates search input value immediately', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      render(
        <FilterBar
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const searchInput = screen.getByLabelText('Search tasks by title or description');
      await user.type(searchInput, 'test');

      expect(searchInput).toHaveValue('test');
    });

    it('debounces search changes with 300ms delay', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      render(
        <FilterBar
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const searchInput = screen.getByLabelText('Search tasks by title or description');
      await user.type(searchInput, 'test');

      // Should not call onFiltersChange immediately
      expect(mockOnFiltersChange).not.toHaveBeenCalled();

      // Advance timers by 300ms
      vi.advanceTimersByTime(300);

      // Should call onFiltersChange after debounce delay
      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...defaultFilters,
        search: 'test',
      });
    });

    it('updates search input when filters change externally', () => {
      const { rerender } = render(
        <FilterBar
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const searchInput = screen.getByLabelText('Search tasks by title or description');
      expect(searchInput).toHaveValue('');

      rerender(
        <FilterBar
          filters={{ ...defaultFilters, search: 'external update' }}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      expect(searchInput).toHaveValue('external update');
    });
  });

  describe('Energy Level Filtering', () => {
    it('toggles energy level filters', async () => {
      const user = userEvent.setup();
      
      render(
        <FilterBar
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const highEnergyButton = screen.getByLabelText('Filter by High Energy');
      
      await waitFor(async () => {
        await user.click(highEnergyButton);
      });

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...defaultFilters,
        energyLevels: ['HIGH'],
      });
    });

    it('removes energy level when already selected', async () => {
      const user = userEvent.setup();
      
      render(
        <FilterBar
          filters={{ ...defaultFilters, energyLevels: ['HIGH'] }}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const highEnergyButton = screen.getByLabelText('Filter by High Energy');
      expect(highEnergyButton).toHaveAttribute('aria-pressed', 'true');

      await user.click(highEnergyButton);

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...defaultFilters,
        energyLevels: [],
      });
    });

    it('adds multiple energy levels', async () => {
      const user = userEvent.setup();
      
      render(
        <FilterBar
          filters={{ ...defaultFilters, energyLevels: ['HIGH'] }}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const mediumEnergyButton = screen.getByLabelText('Filter by Medium Energy');
      await user.click(mediumEnergyButton);

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...defaultFilters,
        energyLevels: ['HIGH', 'MEDIUM'],
      });
    });
  });

  describe('Focus Type Filtering', () => {
    it('toggles focus type filters', async () => {
      const user = userEvent.setup();
      
      render(
        <FilterBar
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const creativeButton = screen.getByLabelText('Filter by Creative tasks');
      await user.click(creativeButton);

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...defaultFilters,
        focusTypes: ['CREATIVE'],
      });
    });

    it('handles multiple focus type selections', async () => {
      const user = userEvent.setup();
      
      render(
        <FilterBar
          filters={{ ...defaultFilters, focusTypes: ['CREATIVE'] }}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const technicalButton = screen.getByLabelText('Filter by Technical tasks');
      await user.click(technicalButton);

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...defaultFilters,
        focusTypes: ['CREATIVE', 'TECHNICAL'],
      });
    });
  });

  describe('Status Filtering', () => {
    it('toggles status filters', async () => {
      const user = userEvent.setup();
      
      render(
        <FilterBar
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const todoButton = screen.getByLabelText('Filter by To Do status');
      await user.click(todoButton);

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...defaultFilters,
        statuses: ['TODO'],
      });
    });

    it('handles multiple status selections', async () => {
      const user = userEvent.setup();
      
      render(
        <FilterBar
          filters={{ ...defaultFilters, statuses: ['TODO'] }}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const inProgressButton = screen.getByLabelText('Filter by In Progress status');
      await user.click(inProgressButton);

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...defaultFilters,
        statuses: ['TODO', 'IN_PROGRESS'],
      });
    });
  });

  describe('Priority Range Filtering', () => {
    it('updates minimum priority', async () => {
      const user = userEvent.setup();
      
      render(
        <FilterBar
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const minPrioritySelect = screen.getByLabelText('Minimum priority level');
      await user.selectOptions(minPrioritySelect, '3');

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...defaultFilters,
        priorityRange: [3, 5],
      });
    });

    it('updates maximum priority', async () => {
      const user = userEvent.setup();
      
      render(
        <FilterBar
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const maxPrioritySelect = screen.getByLabelText('Maximum priority level');
      await user.selectOptions(maxPrioritySelect, '4');

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...defaultFilters,
        priorityRange: [1, 4],
      });
    });

    it('displays current priority range', () => {
      render(
        <FilterBar
          filters={{ ...defaultFilters, priorityRange: [2, 4] }}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      expect(screen.getByText('Priority 2 - 4')).toBeInTheDocument();
    });
  });

  describe('Filter Count and Management', () => {
    it('displays active filter count', () => {
      render(
        <FilterBar
          filters={activeFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const filterCountBadge = screen.getByLabelText(/active filter/);
      expect(filterCountBadge).toBeInTheDocument();
    });

    it('shows clear button when filters are active', () => {
      render(
        <FilterBar
          filters={activeFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      expect(screen.getByLabelText('Clear all filters')).toBeInTheDocument();
    });

    it('does not show clear button when no filters are active', () => {
      render(
        <FilterBar
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      expect(screen.queryByLabelText('Clear all filters')).not.toBeInTheDocument();
    });

    it('calls onClear when clear button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <FilterBar
          filters={activeFilters}
          onFiltersChange={mockOnFiltersChange}
          onClear={mockOnClear}
        />
      );

      const clearButton = screen.getByLabelText('Clear all filters');
      await user.click(clearButton);

      expect(mockOnClear).toHaveBeenCalledTimes(1);
    });

    it('uses default clear implementation when onClear not provided', async () => {
      const user = userEvent.setup();
      
      render(
        <FilterBar
          filters={activeFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const clearButton = screen.getByLabelText('Clear all filters');
      await user.click(clearButton);

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        search: '',
        energyLevels: [],
        focusTypes: [],
        statuses: [],
        priorityRange: [1, 5],
        dateRange: undefined,
      });
    });

    it('shows reset button when onReset is provided', () => {
      render(
        <FilterBar
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          onReset={mockOnReset}
        />
      );

      expect(screen.getByLabelText('Reset filters to default')).toBeInTheDocument();
    });

    it('calls onReset when reset button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <FilterBar
          filters={activeFilters}
          onFiltersChange={mockOnFiltersChange}
          onReset={mockOnReset}
        />
      );

      const resetButton = screen.getByLabelText('Reset filters to default');
      await user.click(resetButton);

      expect(mockOnReset).toHaveBeenCalledTimes(1);
    });
  });

  describe('Compact Mode', () => {
    it('shows expand/collapse button in compact mode', () => {
      render(
        <FilterBar
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          compact={true}
        />
      );

      expect(screen.getByLabelText('Expand filters')).toBeInTheDocument();
    });

    it('toggles filter visibility in compact mode', async () => {
      const user = userEvent.setup();
      
      render(
        <FilterBar
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          compact={true}
        />
      );

      const expandButton = screen.getByLabelText('Expand filters');
      
      // Check initial state - in compact mode, the filter sections should be collapsed
      const filterContainer = screen.getByTestId?.('filter-sections') || 
                            screen.getByLabelText('Filter tasks').querySelector('[data-testid="filter-sections"]') ||
                            screen.getByLabelText('Filter tasks').querySelector('.grid');
      
      // Initially the grid container should have hidden class or be visually hidden
      // We'll check if the expand button shows 'Expand' initially
      expect(expandButton).toHaveAttribute('aria-label', 'Expand filters');

      await user.click(expandButton);

      // After expanding, button should update to collapse
      await waitFor(() => {
        expect(screen.getByLabelText('Collapse filters')).toBeInTheDocument();
      });
    });

    it('does not show expand/collapse button in non-compact mode', () => {
      render(
        <FilterBar
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          compact={false}
        />
      );

      expect(screen.queryByLabelText('Expand filters')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Collapse filters')).not.toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('displays loading overlay when loading is true', () => {
      render(
        <FilterBar
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          loading={true}
        />
      );

      expect(screen.getByLabelText('Applying filters')).toBeInTheDocument();
      expect(screen.getByText('Applying filters...')).toBeInTheDocument();
    });

    it('disables search input when loading', () => {
      render(
        <FilterBar
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          loading={true}
        />
      );

      const searchInput = screen.getByLabelText('Search tasks by title or description');
      expect(searchInput).toBeDisabled();
    });

    it('does not show loading overlay when loading is false', () => {
      render(
        <FilterBar
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          loading={false}
        />
      );

      expect(screen.queryByLabelText('Applying filters')).not.toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('clears filters when Escape is pressed', async () => {
      const user = userEvent.setup();
      
      render(
        <FilterBar
          filters={activeFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const toolbar = screen.getByRole('toolbar');
      toolbar.focus();
      await user.keyboard('{Escape}');

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        search: '',
        energyLevels: [],
        focusTypes: [],
        statuses: [],
        priorityRange: [1, 5],
        dateRange: undefined,
      });
    });

    it('supports Tab navigation between filter elements', async () => {
      const user = userEvent.setup();
      
      render(
        <FilterBar
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const searchInput = screen.getByLabelText('Search tasks by title or description');
      const highEnergyButton = screen.getByLabelText('Filter by High Energy');
      
      searchInput.focus();
      await user.tab();
      
      // Should be able to navigate to energy filter buttons
      expect(document.activeElement).toBe(highEnergyButton);
    });

    it('supports Space key to toggle filter buttons', async () => {
      const user = userEvent.setup();
      
      render(
        <FilterBar
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const highEnergyButton = screen.getByLabelText('Filter by High Energy');
      highEnergyButton.focus();
      await user.keyboard(' ');

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...defaultFilters,
        energyLevels: ['HIGH'],
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA roles and attributes', () => {
      render(
        <FilterBar
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const toolbar = screen.getByRole('toolbar');
      expect(toolbar).toHaveAttribute('aria-label', 'Filter tasks');

      const energyGroup = screen.getByRole('group', { name: /select energy levels/i });
      expect(energyGroup).toBeInTheDocument();
    });

    it('announces filter button states with aria-pressed', () => {
      render(
        <FilterBar
          filters={{ ...defaultFilters, energyLevels: ['HIGH'] }}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const highEnergyButton = screen.getByLabelText('Filter by High Energy');
      const mediumEnergyButton = screen.getByLabelText('Filter by Medium Energy');

      expect(highEnergyButton).toHaveAttribute('aria-pressed', 'true');
      expect(mediumEnergyButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('provides screen reader help for search input', () => {
      render(
        <FilterBar
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const helpText = screen.getByText(/search will automatically filter tasks/i);
      expect(helpText).toHaveClass('sr-only');
    });

    it('uses custom aria-label when provided', () => {
      render(
        <FilterBar
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          aria-label="Custom filter label"
        />
      );

      const toolbar = screen.getByRole('toolbar');
      expect(toolbar).toHaveAttribute('aria-label', 'Custom filter label');
    });
  });

  describe('Edge Cases', () => {
    it('handles missing callback functions gracefully', () => {
      render(
        <FilterBar
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      // Should render without errors even without onClear and onReset
      expect(screen.getByRole('toolbar')).toBeInTheDocument();
    });

    it('calculates filter count correctly with various combinations', () => {
      render(
        <FilterBar
          filters={{
            search: 'test',
            energyLevels: ['HIGH'],
            focusTypes: ['CREATIVE', 'TECHNICAL'],
            statuses: [],
            priorityRange: [2, 4],
            dateRange: { start: '2025-07-28' },
          }}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      // Should count: search + energyLevels + focusTypes + priorityRange + dateRange = 5
      const filterCountBadge = screen.getByLabelText(/5 active filters/);
      expect(filterCountBadge).toBeInTheDocument();
    });

    it('handles rapid filter changes without errors', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      render(
        <FilterBar
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const buttons = [
        screen.getByLabelText('Filter by High Energy'),
        screen.getByLabelText('Filter by Medium Energy'),
        screen.getByLabelText('Filter by Creative tasks'),
      ];

      // Rapidly click multiple buttons
      for (const button of buttons) {
        await user.click(button);
      }

      // Should handle all clicks without errors
      expect(mockOnFiltersChange).toHaveBeenCalledTimes(3);
    });
  });
});
