import type { Meta, StoryObj } from '@storybook/react';
import { Badge, EnergyBadge, StatusBadge, ConfidenceBadge, PriorityBadge } from './Badge';

const meta: Meta<typeof Badge> = {
  title: 'UI Primitives/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Badge components for semantic status indicators with ADHD-friendly visual design and accessibility features.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'energy', 'status', 'confidence', 'priority'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    energyLevel: {
      control: 'select',
      options: ['high', 'medium', 'low'],
    },
    status: {
      control: 'select',
      options: ['pending', 'in-progress', 'blocked', 'done'],
    },
    confidence: {
      control: 'select',
      options: ['high', 'medium', 'low'],
    },
    priority: {
      control: 'select',
      options: [1, 2, 3, 4, 5],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Basic Badge Stories
export const Default: Story = {
  args: {
    children: 'Default Badge',
    variant: 'default',
    size: 'md',
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Badge size="sm">Small</Badge>
      <Badge size="md">Medium</Badge>
      <Badge size="lg">Large</Badge>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Badge component in different sizes for various contexts.',
      },
    },
  },
};

// Energy Level Badges (ADHD-specific)
export const EnergyLevels: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <EnergyBadge level="high" />
        <EnergyBadge level="medium" />
        <EnergyBadge level="low" />
      </div>
      <div className="text-sm text-gray-600 max-w-md">
        Energy level badges help ADHD users quickly identify task demands:
        <ul className="mt-2 ml-4 list-disc">
          <li><strong>High Energy (Red):</strong> Requires focus and concentration</li>
          <li><strong>Medium Energy (Yellow):</strong> Moderate effort required</li>
          <li><strong>Low Energy (Green):</strong> Easy, can be done when tired</li>
        </ul>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Energy level indicators designed specifically for ADHD task management.',
      },
    },
  },
};

// Status Badges
export const StatusBadges: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <StatusBadge status="pending" />
        <StatusBadge status="in-progress" />
        <StatusBadge status="blocked" />
        <StatusBadge status="done" />
      </div>
      <div className="text-sm text-gray-600">
        Status badges provide clear visual feedback on task progress.
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Task status indicators with consistent color coding.',
      },
    },
  },
};

// Confidence Badges (AI predictions)
export const ConfidenceBadges: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <ConfidenceBadge confidence="high" />
        <ConfidenceBadge confidence="medium" />
        <ConfidenceBadge confidence="low" />
      </div>
      <div className="text-sm text-gray-600">
        Confidence badges show the reliability of AI predictions and suggestions.
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'AI confidence indicators for automated task classification.',
      },
    },
  },
};

// Priority Badges
export const PriorityBadges: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <PriorityBadge priority={5} />
        <PriorityBadge priority={4} />
        <PriorityBadge priority={3} />
        <PriorityBadge priority={2} />
        <PriorityBadge priority={1} />
      </div>
      <div className="text-sm text-gray-600">
        Priority badges from P5 (highest) to P1 (lowest) with color intensity indicating urgency.
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Priority level indicators with visual weight corresponding to importance.',
      },
    },
  },
};

// Custom Badge
export const CustomBadge: Story = {
  args: {
    children: 'Custom',
    variant: 'default',
    size: 'md',
    className: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  parameters: {
    docs: {
      description: {
        story: 'Badge with custom styling using className prop.',
      },
    },
  },
};

// Accessibility Demo
export const Accessibility: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Badge aria-label="High priority task requiring immediate attention">🔥 Urgent</Badge>
        <Badge aria-label="Task suitable for when you have low energy">💤 Easy</Badge>
        <Badge aria-label="Creative work that requires focus">🎨 Creative</Badge>
      </div>
      <div className="text-sm text-gray-600 max-w-md">
        <strong>Accessibility Features:</strong>
        <ul className="mt-2 ml-4 list-disc">
          <li>ARIA labels for screen readers</li>
          <li>High contrast color combinations (WCAG 2.2 AA)</li>
          <li>Focus indicators for keyboard navigation</li>
          <li>Semantic meaning through consistent color coding</li>
        </ul>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Accessibility features including ARIA labels and high contrast colors.',
      },
    },
  },
};
