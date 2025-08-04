import { Meta, StoryObj } from '@storybook/react';
import ReflectionPrompt from './ReflectionPrompt';

const meta: Meta<typeof ReflectionPrompt> = {
  title: 'UI/ReflectionPrompt',
  component: ReflectionPrompt,
  parameters: {
    a11y: { config: { rules: [{ id: 'color-contrast', enabled: true }] } },
  },
};
export default meta;

type Story = StoryObj<typeof ReflectionPrompt>;

export const Default: Story = {
  args: {
    question: 'Was your work today aligned with your priorities?',
    onSubmit: (answer: string) => alert(`Answer submitted: ${answer}`),
  },
};

export const Empty: Story = {
  args: {
    question: 'What did you learn today?',
    onSubmit: (answer: string) => alert(`Answer submitted: ${answer}`),
  },
};
