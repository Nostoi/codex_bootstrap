import React from "react";
import { Meta, StoryObj } from "@storybook/react";
import TaskCard, { EnhancedTask } from "./TaskCard";

const meta: Meta<typeof TaskCard> = {
  title: "UI/TaskCard",
  component: TaskCard,
  parameters: {
    a11y: { 
      config: { 
        rules: [
          { id: 'color-contrast', enabled: true },
          { id: 'aria-allowed-attr', enabled: true },
          { id: 'aria-required-attr', enabled: true },
          { id: 'keyboard-navigation', enabled: true }
        ] 
      } 
    },
  },
  argTypes: {
    task: { control: 'object' },
    compact: { control: 'boolean' },
    interactive: { control: 'boolean' },
    onClick: { action: 'clicked' },
    onStatusChange: { action: 'status-changed' },
    onEdit: { action: 'edit' },
    onQuickStart: { action: 'quick-start' }
  }
};
export default meta;

type Story = StoryObj<typeof TaskCard>;

// Base task for reuse
const baseTask: EnhancedTask = {
  id: "1",
  title: "Implement user authentication flow",
  description: "Create login, signup, and password reset functionality with proper validation and error handling.",
  status: "IN_PROGRESS",
  energyLevel: "HIGH",
  focusType: "TECHNICAL",
  priority: 4,
  estimatedMinutes: 120,
  source: "SELF"
};

export const Default: Story = {
  args: {
    task: baseTask,
    interactive: true
  }
};

export const HighPriorityWithDeadline: Story = {
  args: {
    task: {
      ...baseTask,
      title: "Fix critical security vulnerability",
      status: "TODO",
      priority: 5,
      energyLevel: "HIGH",
      focusType: "TECHNICAL",
      hardDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      isOverdue: false,
      aiSuggestion: "This security issue affects user authentication. Prioritize this over other tasks."
    }
  }
};

export const CreativeTaskWithAISuggestion: Story = {
  args: {
    task: {
      ...baseTask,
      title: "Design new onboarding flow",
      description: "Create wireframes and mockups for an ADHD-friendly user onboarding experience.",
      status: "TODO",
      energyLevel: "MEDIUM",
      focusType: "CREATIVE",
      priority: 3,
      estimatedMinutes: 180,
      source: "AI_GENERATED",
      aiSuggestion: "Consider using progressive disclosure and clear visual hierarchy to reduce cognitive load for ADHD users."
    }
  }
};

export const BlockedTask: Story = {
  args: {
    task: {
      ...baseTask,
      title: "Deploy to production",
      status: "BLOCKED",
      isBlocked: true,
      dependencyCount: 2,
      energyLevel: "LOW",
      focusType: "ADMINISTRATIVE",
      priority: 3
    }
  }
};

export const CompletedTask: Story = {
  args: {
    task: {
      ...baseTask,
      title: "Set up CI/CD pipeline",
      status: "DONE",
      energyLevel: "MEDIUM",
      focusType: "TECHNICAL",
      priority: 2,
      estimatedMinutes: 90
    }
  }
};

export const SocialTaskFromBoss: Story = {
  args: {
    task: {
      ...baseTask,
      title: "Present quarterly results to stakeholders",
      description: "Prepare and deliver a comprehensive presentation on Q4 achievements and Q1 planning.",
      status: "TODO",
      energyLevel: "HIGH",
      focusType: "SOCIAL",
      priority: 4,
      estimatedMinutes: 240,
      source: "BOSS",
      softDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Next week
      hardDeadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString() // 10 days
    }
  }
};

export const OverdueAdminTask: Story = {
  args: {
    task: {
      ...baseTask,
      title: "Submit expense reports",
      status: "TODO",
      energyLevel: "LOW",
      focusType: "ADMINISTRATIVE",
      priority: 2,
      estimatedMinutes: 30,
      hardDeadline: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
      isOverdue: true
    }
  }
};

export const TeamTaskWithDependencies: Story = {
  args: {
    task: {
      ...baseTask,
      title: "Integrate payment gateway",
      description: "Add Stripe payment processing to the checkout flow with proper error handling.",
      status: "TODO",
      energyLevel: "MEDIUM",
      focusType: "TECHNICAL",
      priority: 3,
      estimatedMinutes: 300,
      source: "TEAM",
      dependencyCount: 3
    }
  }
};

export const MinimalTask: Story = {
  args: {
    task: {
      id: "minimal",
      title: "Quick bug fix",
      status: "TODO"
    }
  }
};

export const CompactMode: Story = {
  args: {
    task: {
      ...baseTask,
      title: "Code review for authentication PR",
      energyLevel: "MEDIUM",
      focusType: "TECHNICAL",
      priority: 2
    },
    compact: true
  }
};

export const NonInteractive: Story = {
  args: {
    task: baseTask,
    interactive: false
  }
};

export const Loading: Story = {
  render: () => (
    <div className="animate-pulse">
      <div className="rounded-lg border-2 border-gray-200 p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="h-6 bg-gray-200 rounded w-16"></div>
        </div>
        <div className="flex gap-2 mb-3">
          <div className="h-6 bg-gray-200 rounded w-20"></div>
          <div className="h-6 bg-gray-200 rounded w-16"></div>
        </div>
        <div className="h-4 bg-gray-200 rounded w-24"></div>
      </div>
    </div>
  )
};

export const Error: Story = {
  render: () => (
    <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4">
      <div className="flex items-center">
        <span className="text-red-500 mr-2">⚠️</span>
        <span className="text-red-700 font-medium">Failed to load task</span>
      </div>
      <p className="text-red-600 text-sm mt-1">Please try refreshing the page</p>
    </div>
  )
};

// Accessibility-focused stories
export const KeyboardNavigation: Story = {
  args: {
    task: {
      ...baseTask,
      title: "Test keyboard navigation (Press Tab, Enter, Space)"
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'Use Tab to focus, Enter or Space to activate. All interactive elements should be keyboard accessible.'
      }
    }
  }
};

export const ScreenReaderFriendly: Story = {
  args: {
    task: {
      ...baseTask,
      title: "Screen reader test task",
      description: "This task includes comprehensive metadata for screen reader testing.",
      energyLevel: "HIGH",
      focusType: "TECHNICAL", 
      priority: 4,
      estimatedMinutes: 90,
      dependencyCount: 2,
      isBlocked: false,
      aiSuggestion: "This suggestion will be announced to screen readers."
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'This story includes comprehensive ARIA labels and metadata for screen reader testing. Use a screen reader to verify all information is properly announced.'
      }
    }
  }
};

export const HighContrastMode: Story = {
  args: {
    task: {
      ...baseTask,
      title: "High contrast compatibility test",
      energyLevel: "HIGH",
      focusType: "CREATIVE",
      priority: 5
    }
  },
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        story: 'Test task card visibility and contrast in high contrast mode and dark backgrounds.'
      }
    }
  }
};
