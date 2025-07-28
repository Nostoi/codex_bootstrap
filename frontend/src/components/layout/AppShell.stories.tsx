import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { AppShell } from './AppShell';

// Mock user data
const mockUser = {
  id: '1',
  name: 'Sarah Chen',
  email: 'sarah.chen@example.com',
  avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b1fd?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facepad&facepad=2&w=256&h=256&q=80',
};

const mockUserWithoutAvatar = {
  id: '2',
  name: 'Alex Morgan',
  email: 'alex.morgan@example.com',
};

// Sample content component
const SampleContent = () => (
  <div className="p-6 space-y-6">
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-2">
        Dashboard Overview
      </h1>
      <p className="text-text-secondary">
        Welcome to your personal productivity dashboard. Here you can manage tasks, 
        projects, and track your daily progress with ADHD-friendly tools.
      </p>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((item) => (
        <div
          key={item}
          className="p-4 bg-background-secondary rounded-lg border border-border-primary"
        >
          <h3 className="font-semibold text-text-primary mb-2">
            Task Card {item}
          </h3>
          <p className="text-sm text-text-secondary">
            Sample task content with priority indicators and time estimates.
          </p>
          <div className="mt-3 flex gap-2">
            <span className="px-2 py-1 text-xs rounded bg-status-success/10 text-status-success">
              In Progress
            </span>
            <span className="px-2 py-1 text-xs rounded bg-status-warning/10 text-status-warning">
              High Priority
            </span>
          </div>
        </div>
      ))}
    </div>
    
    <div className="h-96 bg-background-muted rounded-lg flex items-center justify-center">
      <p className="text-text-secondary">Sample content area for testing scroll behavior</p>
    </div>
  </div>
);

const meta: Meta<typeof AppShell> = {
  title: 'Layout/AppShell',
  component: AppShell,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
The AppShell component provides the foundational layout structure for the Helmsman application,
featuring ADHD-friendly navigation patterns and comprehensive accessibility support.

## Features

- **Responsive Design**: Adapts to mobile and desktop viewports with collapsible sidebar
- **Accessibility**: Full ARIA landmarks, skip links, and keyboard navigation
- **ADHD-Friendly**: Clear visual hierarchy, consistent patterns, and reduced cognitive load
- **AI Integration**: Dedicated panel for AI assistant with focus management
- **Keyboard Shortcuts**: Ctrl/Cmd+B (sidebar), Ctrl/Cmd+I (AI panel), Escape (close AI)
- **Focus Management**: Proper focus handling for panels and skip links

## Design Tokens

Uses the application's design token system for consistent theming:
- Color tokens for text, backgrounds, and interactive elements
- Spacing tokens for consistent layout rhythm
- Focus rings and interactive states for accessibility

## Accessibility

- **Skip Links**: Quick navigation to main content, sidebar, and AI panel
- **ARIA Landmarks**: Proper semantic structure with banner, navigation, main, and complementary roles
- **Keyboard Navigation**: Full keyboard support with logical tab order
- **Screen Reader Support**: Descriptive labels and state announcements
- **Focus Management**: Automatic focus handling for panel opening/closing
        `,
      },
    },
  },
  argTypes: {
    sidebarCollapsed: {
      control: 'boolean',
      description: 'Whether the sidebar is collapsed',
    },
    aiPanelOpen: {
      control: 'boolean',
      description: 'Whether the AI panel is open',
    },
    onSidebarToggle: {
      action: 'sidebar-toggled',
      description: 'Callback when sidebar toggle is requested',
    },
    onAIPanelToggle: {
      action: 'ai-panel-toggled',
      description: 'Callback when AI panel toggle is requested',
    },
    user: {
      control: 'object',
      description: 'Current user information',
    },
    children: {
      control: false,
      description: 'Main content to render',
    },
  },
  args: {
    onSidebarToggle: fn(),
    onAIPanelToggle: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default state showing the AppShell with expanded sidebar and no AI panel
 */
export const Default: Story = {
  args: {
    children: <SampleContent />,
    sidebarCollapsed: false,
    aiPanelOpen: false,
    user: mockUser,
  },
};

/**
 * Collapsed sidebar state for focused work mode
 */
export const CollapsedSidebar: Story = {
  args: {
    children: <SampleContent />,
    sidebarCollapsed: true,
    aiPanelOpen: false,
    user: mockUser,
  },
};

/**
 * AI panel open state showing the assistant interface
 */
export const WithAIPanel: Story = {
  args: {
    children: <SampleContent />,
    sidebarCollapsed: false,
    aiPanelOpen: true,
    user: mockUser,
  },
};

/**
 * Both sidebar collapsed and AI panel open for maximum content space
 */
export const CollapsedWithAI: Story = {
  args: {
    children: <SampleContent />,
    sidebarCollapsed: true,
    aiPanelOpen: true,
    user: mockUser,
  },
};

/**
 * User without avatar showing fallback initial display
 */
export const UserWithoutAvatar: Story = {
  args: {
    children: <SampleContent />,
    sidebarCollapsed: false,
    aiPanelOpen: false,
    user: mockUserWithoutAvatar,
  },
};

/**
 * No user state (logged out or loading)
 */
export const NoUser: Story = {
  args: {
    children: <SampleContent />,
    sidebarCollapsed: false,
    aiPanelOpen: false,
    user: undefined,
  },
};

/**
 * Mobile-like viewport demonstration
 */
export const MobileView: Story = {
  args: {
    children: <SampleContent />,
    sidebarCollapsed: false,
    aiPanelOpen: false,
    user: mockUser,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

/**
 * Tablet viewport demonstration
 */
export const TabletView: Story = {
  args: {
    children: <SampleContent />,
    sidebarCollapsed: false,
    aiPanelOpen: false,
    user: mockUser,
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};

/**
 * Minimal content for testing empty states
 */
export const MinimalContent: Story = {
  args: {
    children: (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-text-primary mb-4">
          Minimal Content
        </h1>
        <p className="text-text-secondary">
          This story demonstrates the AppShell with minimal content to test
          the layout behavior when there&apos;s not much to display.
        </p>
      </div>
    ),
    sidebarCollapsed: false,
    aiPanelOpen: false,
    user: mockUser,
  },
};

/**
 * All panels open for testing complex layout interactions
 */
export const AllPanelsOpen: Story = {
  args: {
    children: <SampleContent />,
    sidebarCollapsed: false,
    aiPanelOpen: true,
    user: mockUser,
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests the layout when all panels are visible, useful for checking spacing and interaction patterns.',
      },
    },
  },
};

/**
 * Focus and accessibility testing story
 */
export const AccessibilityTest: Story = {
  args: {
    children: (
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-bold text-text-primary">
          Accessibility Testing
        </h1>
        <p className="text-text-secondary">
          Use Tab to navigate through the interface. Try these keyboard shortcuts:
        </p>
        <ul className="list-disc list-inside space-y-2 text-text-secondary">
          <li><kbd className="bg-background-muted px-2 py-1 rounded text-sm">Ctrl/Cmd + B</kbd> - Toggle sidebar</li>
          <li><kbd className="bg-background-muted px-2 py-1 rounded text-sm">Ctrl/Cmd + I</kbd> - Toggle AI panel</li>
          <li><kbd className="bg-background-muted px-2 py-1 rounded text-sm">Escape</kbd> - Close AI panel</li>
          <li><kbd className="bg-background-muted px-2 py-1 rounded text-sm">Tab</kbd> - Navigate between elements</li>
        </ul>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <button className="p-4 text-left bg-background-secondary rounded-lg border border-border-primary hover:bg-background-muted transition-colors focus:outline-none focus:ring-2 focus:ring-focus">
            <h3 className="font-semibold text-text-primary">Focusable Element 1</h3>
            <p className="text-sm text-text-secondary">Test focus ring visibility</p>
          </button>
          <button className="p-4 text-left bg-background-secondary rounded-lg border border-border-primary hover:bg-background-muted transition-colors focus:outline-none focus:ring-2 focus:ring-focus">
            <h3 className="font-semibold text-text-primary">Focusable Element 2</h3>
            <p className="text-sm text-text-secondary">Test keyboard navigation</p>
          </button>
        </div>
      </div>
    ),
    sidebarCollapsed: false,
    aiPanelOpen: false,
    user: mockUser,
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive story for testing accessibility features including keyboard navigation, focus management, and screen reader compatibility.',
      },
    },
  },
};
