import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import TaskCard, { TaskCardProps } from './TaskCard';

const meta: Meta<typeof TaskCard> = {
  title: 'UI/TaskCard',
  component: TaskCard,
  parameters: {
    a11y: { config: { rules: [{ id: 'color-contrast', enabled: true }] } },
  },
};
export default meta;

type Story = StoryObj<typeof TaskCard>;

export const Default: Story = {
  args: {
    id: '1',
    title: 'Finish onboarding flow',
    status: 'in-progress',
    dueDate: '2025-07-28',
  },
};

export const Loading: Story = {
  render: () => <div className="animate-pulse bg-neutral h-24 rounded-md" />,
};

export const Error: Story = {
  render: () => <div className="text-error">Could not load task.</div>,
};

export const Hovered: Story = {
  args: {
    id: '2',
    title: 'Review AI suggestions',
    status: 'todo',
  },
  parameters: {
    pseudo: { hover: true },
  },
};
