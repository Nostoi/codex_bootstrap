import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { FilterBar, type FilterValues } from './FilterBar';

// Default filter values for stories
const defaultFilters: FilterValues = {
  search: '',
  energyLevels: [],
  focusTypes: [],
  statuses: [],
  priorityRange: [1, 5],
  dateRange: undefined,
};

// Sample filter configurations
const activeFilters: FilterValues = {
  search: 'design',
  energyLevels: ['HIGH', 'MEDIUM'],
  focusTypes: ['CREATIVE', 'TECHNICAL'],
  statuses: ['TODO', 'IN_PROGRESS'],
  priorityRange: [3, 5],
  dateRange: {
    start: '2025-07-28',
    end: '2025-08-04',
  },
};

const energyFilters: FilterValues = {
  search: '',
  energyLevels: ['HIGH'],
  focusTypes: [],
  statuses: [],
  priorityRange: [1, 5],
  dateRange: undefined,
};

const statusFilters: FilterValues = {
  search: '',
  energyLevels: [],
  focusTypes: [],
  statuses: ['IN_PROGRESS', 'BLOCKED'],
  priorityRange: [1, 5],
  dateRange: undefined,
};

const meta: Meta<typeof FilterBar> = {
  title: 'Components/FilterBar',
  component: FilterBar,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
The FilterBar component provides comprehensive task filtering functionality with ADHD-friendly design patterns and full accessibility support.

## Features

- **Search**: Debounced search input (300ms) for task titles and descriptions
- **Energy Level Filtering**: Visual energy badges with color coding (High=red, Medium=yellow, Low=green)
- **Focus Type Filtering**: Icon-based focus type selection with semantic meaning
- **Status Filtering**: Task status toggles with clear visual states
- **Priority Range**: Min/max priority selection with accessible controls
- **Responsive Design**: Horizontal layout on desktop, collapsible panels on mobile
- **Accessibility**: WCAG 2.2 AA compliant with full keyboard navigation and screen reader support

## ADHD-Friendly Features

- **Sticky Positioning**: Always accessible filtering without scrolling
- **Clear Visual Grouping**: Related filters grouped with headers and spacing
- **Immediate Feedback**: Visual indicators for active filters and counts
- **Easy Reset**: Clear and reset options for quick filter management
- **Consistent Patterns**: Predictable interaction model across all filter types

## Accessibility

- **ARIA Roles**: Proper toolbar and group roles for screen readers
- **Keyboard Navigation**: Full keyboard support with Tab, Enter, Space navigation
- **Screen Reader Support**: Descriptive labels and state announcements
- **Focus Management**: Clear focus indicators and logical tab order
- **Live Regions**: Filter count updates announced to screen readers

## Usage

The FilterBar component integrates with the EnhancedTask interface used throughout the application:

\`\`\`typescript
const [filters, setFilters] = useState<FilterValues>({
  search: '',
  energyLevels: [],
  focusTypes: [],
  statuses: [],
  priorityRange: [1, 5],
});

<FilterBar
  filters={filters}
  onFiltersChange={setFilters}
  onClear={() => setFilters(defaultFilters)}
/>
\`\`\`

## Design Tokens

Uses the application's design token system for consistent theming:
- Color tokens for interactive states and filter badges
- Spacing tokens for consistent layout rhythm
- Focus rings and hover states for accessibility
- Motion preferences for reduced animation support
        `,
      },
    },
  },
  argTypes: {
    filters: {
      control: 'object',
      description: 'Current filter values object',
    },
    onFiltersChange: {
      action: 'filters-changed',
      description: 'Callback when filter values change',
    },
    onClear: {
      action: 'filters-cleared',
      description: 'Callback to clear all filters',
    },
    onReset: {
      action: 'filters-reset',
      description: 'Callback to reset filters to default',
    },
    loading: {
      control: 'boolean',
      description: 'Show loading state during filter operations',
    },
    compact: {
      control: 'boolean',
      description: 'Enable compact mode for mobile layouts',
    },
    'aria-label': {
      control: 'text',
      description: 'Accessibility label for the filter bar',
    },
  },
  args: {
    onFiltersChange: fn(),
    onClear: fn(),
    onReset: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default empty state showing all available filter options
 */
export const Default: Story = {
  args: {
    filters: defaultFilters,
  },
};

/**
 * Active filters state showing multiple selected filters
 */
export const WithActiveFilters: Story = {
  args: {
    filters: activeFilters,
  },
};

/**
 * Energy level filtering showcase
 */
export const EnergyFiltering: Story = {
  args: {
    filters: energyFilters,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Shows energy level filtering with high energy tasks selected. Energy levels use ADHD-friendly color coding.',
      },
    },
  },
};

/**
 * Status filtering showcase
 */
export const StatusFiltering: Story = {
  args: {
    filters: statusFilters,
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates status filtering with in-progress and blocked tasks selected.',
      },
    },
  },
};

/**
 * Search functionality demonstration
 */
export const WithSearch: Story = {
  args: {
    filters: {
      ...defaultFilters,
      search: 'dashboard component',
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Shows search functionality with debounced input. Search terms are applied after 300ms of typing pause.',
      },
    },
  },
};

/**
 * Loading state during filter operations
 */
export const Loading: Story = {
  args: {
    filters: activeFilters,
    loading: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Loading state shown during async filter operations with overlay and spinner.',
      },
    },
  },
};

/**
 * Compact mode for mobile devices
 */
export const CompactMode: Story = {
  args: {
    filters: activeFilters,
    compact: true,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Compact mode with collapsible filter groups for mobile viewports.',
      },
    },
  },
};

/**
 * Focus type filtering demonstration
 */
export const FocusTypeFiltering: Story = {
  args: {
    filters: {
      ...defaultFilters,
      focusTypes: ['CREATIVE', 'TECHNICAL'],
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Focus type filtering with creative and technical tasks selected, showing icon-based visual indicators.',
      },
    },
  },
};

/**
 * Priority range filtering
 */
export const PriorityRangeFiltering: Story = {
  args: {
    filters: {
      ...defaultFilters,
      priorityRange: [4, 5],
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'High priority tasks filtering (priority 4-5) with accessible range selectors.',
      },
    },
  },
};

/**
 * Empty filters with reset option
 */
export const WithResetOption: Story = {
  args: {
    filters: defaultFilters,
    onReset: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows reset button functionality for returning to default filter state.',
      },
    },
  },
};

/**
 * All filter types active for comprehensive testing
 */
export const AllFiltersActive: Story = {
  args: {
    filters: {
      search: 'important task',
      energyLevels: ['HIGH', 'MEDIUM'],
      focusTypes: ['CREATIVE', 'TECHNICAL', 'SOCIAL'],
      statuses: ['TODO', 'IN_PROGRESS'],
      priorityRange: [3, 5],
      dateRange: {
        start: '2025-07-28',
        end: '2025-08-15',
      },
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Comprehensive example with all filter types active, showing filter count and clear functionality.',
      },
    },
  },
};

/**
 * Accessibility testing story with keyboard navigation focus
 */
export const AccessibilityDemo: Story = {
  args: {
    filters: {
      ...defaultFilters,
      energyLevels: ['MEDIUM'],
      focusTypes: ['ADMINISTRATIVE'],
    },
  },
  parameters: {
    docs: {
      description: {
        story: `
Interactive story for testing accessibility features:

- **Tab Navigation**: Use Tab to move between filter groups and controls
- **Filter Selection**: Use Space or Enter to toggle filter buttons
- **Search Input**: Type to test debounced search functionality
- **Escape Key**: Press Escape to clear all filters
- **Screen Reader**: Test with screen reader for ARIA announcements
- **Focus Indicators**: Verify clear focus rings on all interactive elements

**ARIA Roles and Labels:**
- Main container has \`role="toolbar"\` with descriptive label
- Filter groups have \`role="group"\` with group labels
- Buttons have \`aria-pressed\` states for toggle status
- Live regions announce filter count changes
        `,
      },
    },
  },
};

/**
 * Desktop responsive layout demonstration
 */
export const DesktopLayout: Story = {
  args: {
    filters: activeFilters,
    compact: false,
  },
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
    docs: {
      description: {
        story: 'Desktop layout with horizontal filter groups in a responsive grid.',
      },
    },
  },
};

/**
 * Tablet responsive layout
 */
export const TabletLayout: Story = {
  args: {
    filters: activeFilters,
    compact: false,
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
    docs: {
      description: {
        story: 'Tablet layout showing responsive grid adjustment for medium screens.',
      },
    },
  },
};
