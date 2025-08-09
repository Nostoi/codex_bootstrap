import React, { useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';

/**
 * Filter values for task filtering
 */
export interface FilterValues {
  search: string;
  energyLevels: Array<'LOW' | 'MEDIUM' | 'HIGH'>;
  focusTypes: Array<'CREATIVE' | 'TECHNICAL' | 'ADMINISTRATIVE' | 'SOCIAL'>;
  statuses: Array<'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE'>;
  priorityRange: [number, number]; // [min, max] 1-5
  dateRange?: {
    start?: string;
    end?: string;
  };
}

/**
 * FilterBar Props Interface
 */
export interface FilterBarProps {
  /** Current filter values */
  filters: FilterValues;
  /** Callback when filters change */
  onFiltersChange: (filters: FilterValues) => void;
  /** Callback to clear all filters */
  onClear?: () => void;
  /** Callback to reset to default filters */
  onReset?: () => void;
  /** Loading state for async operations */
  loading?: boolean;
  /** Compact mode for mobile/narrow layouts */
  compact?: boolean;
  /** Custom className for container */
  className?: string;
  /** Accessibility label for the filter bar */
  'aria-label'?: string;
}

/**
 * Energy level configuration with ADHD-friendly colors
 */
const energyConfig = {
  HIGH: { label: 'High Energy', color: 'bg-status-error text-text-inverse', icon: '⚡' },
  MEDIUM: { label: 'Medium Energy', color: 'bg-status-warning text-text-inverse', icon: '⚖️' },
  LOW: { label: 'Low Energy', color: 'bg-status-success text-text-inverse', icon: '🌱' },
} as const;

/**
 * Focus type configuration
 */
const focusConfig = {
  CREATIVE: { label: 'Creative', icon: '🎨', color: 'bg-purple-100 text-purple-800' },
  TECHNICAL: { label: 'Technical', icon: '⚙️', color: 'bg-blue-100 text-blue-800' },
  ADMINISTRATIVE: { label: 'Administrative', icon: '📋', color: 'bg-gray-100 text-gray-800' },
  SOCIAL: { label: 'Social', icon: '👥', color: 'bg-green-100 text-green-800' },
} as const;

/**
 * Status configuration
 */
const statusConfig = {
  TODO: { label: 'To Do', color: 'bg-gray-100 text-gray-800' },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
  BLOCKED: { label: 'Blocked', color: 'bg-red-100 text-red-800' },
  DONE: { label: 'Complete', color: 'bg-green-100 text-green-800' },
} as const;

/**
 * FilterBar Component
 *
 * Comprehensive filtering component with ADHD-friendly design patterns:
 * - Clear visual grouping of related filters
 * - Sticky positioning for always-accessible filtering
 * - Immediate feedback on filter changes
 * - Easy reset/clear options
 * - Full accessibility with ARIA labels and keyboard navigation
 */
export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFiltersChange,
  onClear,
  onReset,
  loading = false,
  compact = false,
  className,
  'aria-label': ariaLabel = 'Filter tasks',
}) => {
  const [searchInput, setSearchInput] = useState(filters.search);
  const [isExpanded, setIsExpanded] = useState(!compact);

  // Debounced search implementation
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        onFiltersChange({ ...filters, search: searchInput });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput, filters, onFiltersChange]);

  // Update search input when filters change externally
  useEffect(() => {
    setSearchInput(filters.search);
  }, [filters.search]);

  const handleEnergyToggle = useCallback(
    (energy: keyof typeof energyConfig) => {
      const newEnergyLevels = filters.energyLevels.includes(energy)
        ? filters.energyLevels.filter(e => e !== energy)
        : [...filters.energyLevels, energy];

      onFiltersChange({ ...filters, energyLevels: newEnergyLevels });
    },
    [filters, onFiltersChange]
  );

  const handleFocusToggle = useCallback(
    (focus: keyof typeof focusConfig) => {
      const newFocusTypes = filters.focusTypes.includes(focus)
        ? filters.focusTypes.filter(f => f !== focus)
        : [...filters.focusTypes, focus];

      onFiltersChange({ ...filters, focusTypes: newFocusTypes });
    },
    [filters, onFiltersChange]
  );

  const handleStatusToggle = useCallback(
    (status: keyof typeof statusConfig) => {
      const newStatuses = filters.statuses.includes(status)
        ? filters.statuses.filter(s => s !== status)
        : [...filters.statuses, status];

      onFiltersChange({ ...filters, statuses: newStatuses });
    },
    [filters, onFiltersChange]
  );

  const handlePriorityChange = useCallback(
    (min: number, max: number) => {
      onFiltersChange({ ...filters, priorityRange: [min, max] });
    },
    [filters, onFiltersChange]
  );

  const handleClear = useCallback(() => {
    if (onClear) {
      onClear();
    } else {
      // Default clear implementation
      onFiltersChange({
        search: '',
        energyLevels: [],
        focusTypes: [],
        statuses: [],
        priorityRange: [1, 5],
        dateRange: undefined,
      });
    }
    setSearchInput('');
  }, [onClear, onFiltersChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClear();
      }
    },
    [handleClear]
  );

  const getActiveFilterCount = useCallback(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.energyLevels.length > 0) count++;
    if (filters.focusTypes.length > 0) count++;
    if (filters.statuses.length > 0) count++;
    if (filters.priorityRange[0] > 1 || filters.priorityRange[1] < 5) count++;
    if (filters.dateRange?.start || filters.dateRange?.end) count++;
    return count;
  }, [filters]);

  const activeFilterCount = getActiveFilterCount();

  return (
    <div
      className={cn(
        'sticky top-0 z-20 bg-background border-b border-border-primary',
        'transition-all duration-200 ease-in-out',
        className
      )}
      role="toolbar"
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
    >
      <div className="px-4 py-3">
        {/* Header Row: Search and Toggle */}
        <div className="flex items-center gap-3 mb-3">
          {/* Search Input */}
          <div className="flex-1 min-w-0">
            <label htmlFor="task-search" className="sr-only">
              Search tasks by title or description
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-4 w-4 text-text-secondary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                id="task-search"
                type="text"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Search tasks..."
                className={cn(
                  'block w-full pl-10 pr-3 py-2 border border-border-primary rounded-md',
                  'text-text-primary placeholder-text-secondary bg-background',
                  'focus:outline-none focus:ring-2 focus:ring-focus focus:border-focus',
                  'transition-colors duration-200',
                  loading && 'opacity-50 cursor-not-allowed'
                )}
                disabled={loading}
                aria-describedby="search-help"
              />
              <div id="search-help" className="sr-only">
                Search will automatically filter tasks as you type. Press Escape to clear all
                filters.
              </div>
            </div>
          </div>

          {/* Filter Status and Controls */}
          <div className="flex items-center gap-2">
            {/* Active Filter Count */}
            {activeFilterCount > 0 && (
              <span
                className="px-2 py-1 text-xs font-medium bg-interactive-primary text-text-inverse rounded-md"
                aria-live="polite"
                aria-label={`${activeFilterCount} active filter${activeFilterCount === 1 ? '' : 's'}`}
              >
                {activeFilterCount}
              </span>
            )}

            {/* Clear Button */}
            {activeFilterCount > 0 && (
              <button
                onClick={handleClear}
                className={cn(
                  'px-3 py-2 text-sm font-medium text-text-secondary hover:text-text-primary',
                  'hover:bg-background-muted rounded-md transition-colors duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-focus'
                )}
                aria-label="Clear all filters"
              >
                Clear
              </button>
            )}

            {/* Reset Button */}
            {onReset && (
              <button
                onClick={onReset}
                className={cn(
                  'px-3 py-2 text-sm font-medium text-text-secondary hover:text-text-primary',
                  'hover:bg-background-muted rounded-md transition-colors duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-focus'
                )}
                aria-label="Reset filters to default"
              >
                Reset
              </button>
            )}

            {/* Expand/Collapse Toggle (Mobile) */}
            {compact && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={cn(
                  'p-2 text-text-secondary hover:text-text-primary hover:bg-background-muted',
                  'rounded-md transition-colors duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-focus'
                )}
                aria-expanded={isExpanded}
                aria-label={isExpanded ? 'Collapse filters' : 'Expand filters'}
              >
                <svg
                  className={cn(
                    'h-4 w-4 transition-transform duration-200',
                    isExpanded && 'rotate-180'
                  )}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Filter Groups */}
        <div
          className={cn(
            'transition-all duration-300 ease-in-out',
            compact && !isExpanded && 'max-h-0 overflow-hidden opacity-0',
            compact && isExpanded && 'max-h-96 overflow-visible opacity-100',
            !compact && 'max-h-none overflow-visible opacity-100'
          )}
        >
          <div
            className={cn(
              'grid gap-4',
              compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
            )}
          >
            {/* Energy Level Filter */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-text-primary">Energy Level</h3>
              <div
                data-testid="energy-filter-group"
                className="flex flex-wrap gap-2"
                role="group"
                aria-labelledby="energy-filter-label"
              >
                <span id="energy-filter-label" className="sr-only">
                  Select energy levels to filter
                </span>
                {Object.entries(energyConfig).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => handleEnergyToggle(key as keyof typeof energyConfig)}
                    className={cn(
                      'inline-flex items-center px-3 py-1 rounded-md text-xs font-medium',
                      'border transition-all duration-200',
                      'focus:outline-none focus:ring-2 focus:ring-focus',
                      filters.energyLevels.includes(key as FilterValues['energyLevels'][number])
                        ? `${config.color} border-transparent`
                        : 'bg-background border-border-primary text-text-secondary hover:text-text-primary hover:border-border-secondary'
                    )}
                    aria-pressed={filters.energyLevels.includes(
                      key as FilterValues['energyLevels'][number]
                    )}
                    aria-label={`Filter by ${config.label}`}
                  >
                    <span className="mr-1" aria-hidden="true">
                      {config.icon}
                    </span>
                    {config.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Focus Type Filter */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-text-primary">Focus Type</h3>
              <div
                className="flex flex-wrap gap-2"
                role="group"
                aria-labelledby="focus-filter-label"
              >
                <span id="focus-filter-label" className="sr-only">
                  Select focus types to filter
                </span>
                {Object.entries(focusConfig).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => handleFocusToggle(key as keyof typeof focusConfig)}
                    className={cn(
                      'inline-flex items-center px-3 py-1 rounded-md text-xs font-medium',
                      'border transition-all duration-200',
                      'focus:outline-none focus:ring-2 focus:ring-focus',
                      filters.focusTypes.includes(key as FilterValues['focusTypes'][number])
                        ? `${config.color} border-transparent`
                        : 'bg-background border-border-primary text-text-secondary hover:text-text-primary hover:border-border-secondary'
                    )}
                    aria-pressed={filters.focusTypes.includes(
                      key as FilterValues['focusTypes'][number]
                    )}
                    aria-label={`Filter by ${config.label} tasks`}
                  >
                    <span className="mr-1" aria-hidden="true">
                      {config.icon}
                    </span>
                    {config.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-text-primary">Status</h3>
              <div
                className="flex flex-wrap gap-2"
                role="group"
                aria-labelledby="status-filter-label"
              >
                <span id="status-filter-label" className="sr-only">
                  Select task statuses to filter
                </span>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => handleStatusToggle(key as keyof typeof statusConfig)}
                    className={cn(
                      'inline-flex items-center px-3 py-1 rounded-md text-xs font-medium',
                      'border transition-all duration-200',
                      'focus:outline-none focus:ring-2 focus:ring-focus',
                      filters.statuses.includes(key as FilterValues['statuses'][number])
                        ? `${config.color} border-transparent`
                        : 'bg-background border-border-primary text-text-secondary hover:text-text-primary hover:border-border-secondary'
                    )}
                    aria-pressed={filters.statuses.includes(
                      key as FilterValues['statuses'][number]
                    )}
                    aria-label={`Filter by ${config.label} status`}
                  >
                    {config.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority Range Filter */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-text-primary">Priority Range</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label htmlFor="priority-min" className="text-xs text-text-secondary">
                    Min:
                  </label>
                  <select
                    id="priority-min"
                    value={filters.priorityRange[0]}
                    onChange={e =>
                      handlePriorityChange(Number(e.target.value), filters.priorityRange[1])
                    }
                    className={cn(
                      'px-2 py-1 text-xs border border-border-primary rounded',
                      'bg-background text-text-primary',
                      'focus:outline-none focus:ring-2 focus:ring-focus'
                    )}
                    aria-label="Minimum priority level"
                  >
                    {[1, 2, 3, 4, 5].map(num => (
                      <option key={num} value={num}>
                        {num}
                      </option>
                    ))}
                  </select>
                  <label htmlFor="priority-max" className="text-xs text-text-secondary">
                    Max:
                  </label>
                  <select
                    id="priority-max"
                    value={filters.priorityRange[1]}
                    onChange={e =>
                      handlePriorityChange(filters.priorityRange[0], Number(e.target.value))
                    }
                    className={cn(
                      'px-2 py-1 text-xs border border-border-primary rounded',
                      'bg-background text-text-primary',
                      'focus:outline-none focus:ring-2 focus:ring-focus'
                    )}
                    aria-label="Maximum priority level"
                  >
                    {[1, 2, 3, 4, 5].map(num => (
                      <option key={num} value={num}>
                        {num}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="text-xs text-text-secondary">
                  Priority {filters.priorityRange[0]} - {filters.priorityRange[1]}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div
          className="absolute inset-0 bg-background/50 flex items-center justify-center"
          aria-live="polite"
          aria-label="Applying filters"
        >
          <div className="flex items-center gap-2 text-text-secondary">
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Applying filters...
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterBar;
