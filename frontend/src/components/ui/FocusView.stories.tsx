import { Meta, StoryObj } from "@storybook/react";
import FocusView from "./FocusView";
import { EnhancedTask as Task } from "./TaskCard";

const meta: Meta<typeof FocusView> = {
  title: "UI/FocusView",
  component: FocusView,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "The FocusView component displays today's tasks with AI-powered prioritization and focus goal setting. Central to the Helmsman daily productivity workflow."
      }
    },
    a11y: { 
      config: { 
        rules: [
          { id: 'color-contrast', enabled: true },
          { id: 'keyboard-navigation', enabled: true },
          { id: 'focus-management', enabled: true }
        ] 
      } 
    },
  },
  argTypes: {
    onTaskClick: { action: 'task-clicked' },
    onFocusGoalChange: { action: 'focus-goal-changed' },
    onRefreshAI: { action: 'ai-refreshed' },
    isLoadingAI: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof FocusView>;

// Sample task data
const sampleTasks: Task[] = [
  {
    id: "1",
    title: "Complete user onboarding flow design",
    status: "IN_PROGRESS",
    priority: 5,
    dueDate: "2025-07-27",
    estimatedMinutes: 120,
    aiSuggestion: "Break this into smaller UI components for better testability"
  },
  {
    id: "2",
    title: "Review AI integration specs",
    status: "TODO",
    priority: 5,
    estimatedMinutes: 45,
    aiSuggestion: "Focus on the ChatGPT API integration first"
  },
  {
    id: "3",
    title: "Update project documentation",
    status: "TODO",
    priority: 3,
    estimatedMinutes: 60
  },
  {
    id: "4",
    title: "Team standup meeting",
    status: "DONE",
    priority: 3,
    estimatedMinutes: 30
  },
  {
    id: "5",
    title: "Fix accessibility issues in TaskCard",
    status: "TODO",
    priority: 2,
    estimatedMinutes: 90
  }
];

export const Default: Story = {
  args: {
    todaysTasks: sampleTasks,
    focusGoal: "Launch the MVP user onboarding experience",
    aiRecommendation: "Based on your current priorities, I suggest focusing on the high-priority design tasks first. The onboarding flow is blocking other team members, so completing that would unblock 3 other developers.",
  },
};

export const EmptyState: Story = {
  args: {
    todaysTasks: [],
    focusGoal: "",
    aiRecommendation: "",
  },
};

export const LoadingAI: Story = {
  args: {
    todaysTasks: sampleTasks.slice(0, 3),
    focusGoal: "Focus on high-impact deliverables",
    isLoadingAI: true,
  },
};

export const HighWorkload: Story = {
  args: {
    todaysTasks: [
      ...sampleTasks,
      {
        id: "6",
        title: "Code review for authentication module",
        status: "TODO",
        priority: 5,
        estimatedMinutes: 75,
        aiSuggestion: "This is urgent - authentication is needed for user testing"
      },
      {
        id: "7",
        title: "Database migration testing",
        status: "IN_PROGRESS",
        priority: 5,
        estimatedMinutes: 180
      },
      {
        id: "8",
        title: "Update API documentation",
        status: "TODO",
        priority: 3,
        estimatedMinutes: 45
      }
    ],
    focusGoal: "Complete all high-priority items before EOD",
    aiRecommendation: "You have 8 hours of work scheduled but only 6 hours available. I recommend moving 2 medium-priority tasks to tomorrow and focusing on the authentication work first.",
  },
};

export const MostlyCompleted: Story = {
  args: {
    todaysTasks: [
      { ...sampleTasks[0], status: "DONE" },
      { ...sampleTasks[1], status: "DONE" },
      { ...sampleTasks[2], status: "DONE" },
      { ...sampleTasks[3], status: "DONE" },
      {
        id: "9",
        title: "Final review and deployment",
        status: "IN_PROGRESS",
        priority: 3,
        estimatedMinutes: 30
      }
    ],
    focusGoal: "Ship the onboarding feature to production",
    aiRecommendation: "Great progress! You're 80% complete with today's goals. The final review should take about 30 minutes, putting you ahead of schedule.",
  },
};

export const NoFocusGoal: Story = {
  args: {
    todaysTasks: sampleTasks.slice(0, 3),
    focusGoal: "",
    aiRecommendation: "Setting a daily focus goal can increase productivity by 25%. Try identifying your most important outcome for today.",
  },
};

export const Accessible: Story = {
  args: {
    todaysTasks: sampleTasks,
    focusGoal: "Complete accessibility audit and fixes",
    aiRecommendation: "Focus on keyboard navigation and screen reader compatibility first - these impact the most users.",
  },
  parameters: {
    a11y: {
      config: {
        rules: [
          { id: 'color-contrast', enabled: true },
          { id: 'keyboard-navigation', enabled: true },
          { id: 'focus-management', enabled: true },
          { id: 'aria-labels', enabled: true },
        ],
      },
    },
  },
};

// Interactive story for testing user interactions
export const Interactive: Story = {
  args: {
    todaysTasks: sampleTasks,
    focusGoal: "",
    aiRecommendation: "Try setting a focus goal and clicking on tasks to see interactions!",
  },
  play: async ({ canvasElement: _canvasElement }) => {
    // This would be used for automated testing of interactions
    // const canvas = within(canvasElement);
    // await userEvent.click(canvas.getByRole('button', { name: /set focus/i }));
  },
};
