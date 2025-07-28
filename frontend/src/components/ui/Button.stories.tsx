import type { Meta, StoryObj } from '@storybook/react';
import { Button, IconButton, ButtonGroup } from './Button';

// Mock icons for stories
const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
  </svg>
);

const DownloadIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const meta: Meta<typeof Button> = {
  title: 'UI Primitives/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'ADHD-friendly button component with accessibility features, loading states, and energy level theming.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost', 'destructive'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
    },
    energyLevel: {
      control: 'select',
      options: ['high', 'medium', 'low'],
    },
    loading: {
      control: 'boolean',
    },
    fullWidth: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Basic Button Stories
export const Primary: Story = {
  args: {
    children: 'Primary Button',
    variant: 'primary',
  },
};

export const Secondary: Story = {
  args: {
    children: 'Secondary Button',
    variant: 'secondary',
  },
};

export const Outline: Story = {
  args: {
    children: 'Outline Button',
    variant: 'outline',
  },
};

export const Ghost: Story = {
  args: {
    children: 'Ghost Button',
    variant: 'ghost',
  },
};

export const Destructive: Story = {
  args: {
    children: 'Delete Item',
    variant: 'destructive',
  },
};

// Button Sizes
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
      <Button size="xl">Extra Large</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Button component in different sizes for various interface contexts.',
      },
    },
  },
};

// Loading States
export const LoadingStates: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Button loading>Loading...</Button>
        <Button variant="secondary" loading>Processing</Button>
        <Button variant="outline" loading>Saving</Button>
      </div>
      <div className="text-sm text-gray-600">
        Loading buttons show a spinner and are automatically disabled.
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Loading states with accessible spinners and automatic disabling.',
      },
    },
  },
};

// Energy Level Theming (ADHD-specific)
export const EnergyLevels: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button energyLevel="high" variant="primary">High Energy Task</Button>
          <Button energyLevel="high" variant="secondary">High Energy</Button>
          <Button energyLevel="high" variant="outline">High Energy</Button>
        </div>
        <div className="flex items-center gap-4">
          <Button energyLevel="medium" variant="primary">Medium Energy Task</Button>
          <Button energyLevel="medium" variant="secondary">Medium Energy</Button>
          <Button energyLevel="medium" variant="outline">Medium Energy</Button>
        </div>
        <div className="flex items-center gap-4">
          <Button energyLevel="low" variant="primary">Low Energy Task</Button>
          <Button energyLevel="low" variant="secondary">Low Energy</Button>
          <Button energyLevel="low" variant="outline">Low Energy</Button>
        </div>
      </div>
      <div className="text-sm text-gray-600 max-w-md">
        <strong>Energy Level Theming:</strong> Buttons can be themed to match task energy requirements, 
        helping ADHD users quickly identify appropriate actions for their current energy state.
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Energy-themed buttons for ADHD-friendly task management.',
      },
    },
  },
};

// Buttons with Icons
export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Button leftIcon={<PlusIcon />}>Add Task</Button>
        <Button rightIcon={<DownloadIcon />} variant="secondary">Download</Button>
        <Button leftIcon={<TrashIcon />} variant="destructive">Delete</Button>
      </div>
      <div className="text-sm text-gray-600">
        Icons help users quickly identify button actions and reduce cognitive load.
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Buttons with left and right icons for better visual communication.',
      },
    },
  },
};

// Icon Buttons
export const IconButtons: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <IconButton icon={<PlusIcon />} aria-label="Add new task" />
        <IconButton icon={<DownloadIcon />} aria-label="Download file" variant="secondary" />
        <IconButton icon={<TrashIcon />} aria-label="Delete item" variant="destructive" />
      </div>
      <div className="flex items-center gap-2">
        <IconButton icon={<PlusIcon />} aria-label="Add" size="sm" />
        <IconButton icon={<PlusIcon />} aria-label="Add" size="md" />
        <IconButton icon={<PlusIcon />} aria-label="Add" size="lg" />
        <IconButton icon={<PlusIcon />} aria-label="Add" size="xl" />
      </div>
      <div className="text-sm text-gray-600">
        Icon-only buttons with proper ARIA labels for accessibility.
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Square icon buttons with accessible labeling.',
      },
    },
  },
};

// Button Groups
export const ButtonGroups: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div>
        <h4 className="text-sm font-medium mb-2">Horizontal Group</h4>
        <ButtonGroup>
          <Button variant="outline">Left</Button>
          <Button variant="outline">Middle</Button>
          <Button variant="outline">Right</Button>
        </ButtonGroup>
      </div>
      
      <div>
        <h4 className="text-sm font-medium mb-2">Vertical Group</h4>
        <ButtonGroup orientation="vertical">
          <Button variant="outline">Top</Button>
          <Button variant="outline">Middle</Button>
          <Button variant="outline">Bottom</Button>
        </ButtonGroup>
      </div>
      
      <div>
        <h4 className="text-sm font-medium mb-2">Action Group</h4>
        <ButtonGroup>
          <Button>Save</Button>
          <Button variant="outline">Cancel</Button>
          <Button variant="destructive">Delete</Button>
        </ButtonGroup>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Related buttons grouped together with proper borders and spacing.',
      },
    },
  },
};

// Full Width
export const FullWidth: Story = {
  render: () => (
    <div className="w-80">
      <Button fullWidth>Full Width Button</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Button that spans the full width of its container.',
      },
    },
  },
};

// States
export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Button>Normal</Button>
        <Button disabled>Disabled</Button>
        <Button loading>Loading</Button>
      </div>
      <div className="text-sm text-gray-600">
        Different button states with appropriate visual feedback.
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Normal, disabled, and loading button states.',
      },
    },
  },
};

// Accessibility Demo
export const Accessibility: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button>Keyboard Focusable</Button>
        <Button disabled>Properly Disabled</Button>
        <IconButton icon={<PlusIcon />} aria-label="Add item with descriptive label" />
      </div>
      <div className="text-sm text-gray-600 max-w-md">
        <strong>Accessibility Features:</strong>
        <ul className="mt-2 ml-4 list-disc">
          <li>Keyboard navigation with Tab and Enter/Space</li>
          <li>Clear focus indicators with ring styling</li>
          <li>Proper ARIA labels for icon buttons</li>
          <li>Disabled state prevents interaction</li>
          <li>Loading state announces to screen readers</li>
          <li>High contrast colors meet WCAG guidelines</li>
        </ul>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Accessibility features including keyboard navigation and screen reader support.',
      },
    },
  },
};
