import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import ChatGPTIntegration, { ChatMessage, ExtractedTask } from './ChatGPTIntegration';

const meta: Meta<typeof ChatGPTIntegration> = {
  title: 'UI/ChatGPTIntegration',
  component: ChatGPTIntegration,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'AI-powered chat interface for task planning and intelligent suggestions. Supports message exchange, task extraction, and real-time AI assistance.',
      },
    },
    a11y: {
      config: {
        rules: [
          { id: 'color-contrast', enabled: true },
          { id: 'keyboard-navigation', enabled: true },
          { id: 'focus-management', enabled: true },
        ],
      },
    },
  },
  argTypes: {
    messages: {
      description: 'Array of chat messages between user and AI',
      control: { type: 'object' },
    },
    onSendMessage: {
      description: 'Callback when user sends a message',
      action: 'message sent',
    },
    onExtractTasks: {
      description: 'Callback when tasks are extracted from conversation',
      action: 'tasks extracted',
    },
    isLoading: {
      description: 'Whether AI is processing a request',
      control: { type: 'boolean' },
    },
    isConnected: {
      description: 'Whether AI service is connected',
      control: { type: 'boolean' },
    },
    placeholder: {
      description: 'Input placeholder text',
      control: { type: 'text' },
    },
    maxHeight: {
      description: 'Maximum height of message area',
      control: { type: 'text' },
    },
    showTaskExtraction: {
      description: 'Whether to show task extraction button',
      control: { type: 'boolean' },
    },
  },
  decorators: [
    Story => (
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ChatGPTIntegration>;

const sampleMessages: ChatMessage[] = [
  {
    id: '1',
    role: 'user',
    content:
      'Help me plan my day. I need to finish the project proposal, have a team meeting, and review some documents.',
    timestamp: new Date(Date.now() - 300000), // 5 minutes ago
  },
  {
    id: '2',
    role: 'assistant',
    content:
      "I'd be happy to help you plan your day! Based on what you've mentioned, here's a suggested structure:\n\n1. **Morning Focus**: Start with the project proposal (high energy task)\n2. **Mid-morning**: Team meeting (collaborative time)\n3. **Afternoon**: Document review (detailed work)\n\nWould you like me to break these down into more specific tasks with time estimates?",
    timestamp: new Date(Date.now() - 240000), // 4 minutes ago
    metadata: {
      suggestedActions: [
        'Yes, break down into specific tasks',
        'Add time estimates',
        'Set priorities for today',
      ],
    },
  },
  {
    id: '3',
    role: 'user',
    content: 'Yes, please break them down with time estimates.',
    timestamp: new Date(Date.now() - 180000), // 3 minutes ago
  },
  {
    id: '4',
    role: 'assistant',
    content:
      "Perfect! Here's a detailed breakdown:\n\n**Project Proposal (2-3 hours)**\n• Research competitor analysis (45 min)\n• Draft executive summary (30 min)\n• Create budget breakdown (45 min)\n• Review and polish (30 min)\n\n**Team Meeting (1 hour)**\n• Prepare agenda (15 min)\n• Conduct meeting (45 min)\n\n**Document Review (1-2 hours)**\n• Priority documents first (60 min)\n• Secondary documents (60 min)\n\nShall I extract these as actionable tasks for your task list?",
    timestamp: new Date(Date.now() - 120000), // 2 minutes ago
    metadata: {
      taskExtracted: true,
      suggestedActions: ['Extract as tasks', 'Set due dates', 'Add to calendar'],
    },
  },
];

const emptyMessages: ChatMessage[] = [];

const shortConversation: ChatMessage[] = [
  {
    id: '1',
    role: 'user',
    content: 'What should I focus on today?',
    timestamp: new Date(Date.now() - 60000),
  },
  {
    id: '2',
    role: 'assistant',
    content:
      'To give you the best recommendations, could you tell me:\n• What are your main goals this week?\n• Any urgent deadlines?\n• How much time do you have available today?',
    timestamp: new Date(Date.now() - 30000),
    metadata: {
      suggestedActions: [
        'I have 6 hours available',
        'My deadline is Friday',
        'Focus on client work',
      ],
    },
  },
];

const systemErrorMessages: ChatMessage[] = [
  {
    id: '1',
    role: 'user',
    content: 'Help me plan my tasks for the week.',
    timestamp: new Date(Date.now() - 120000),
  },
  {
    id: '2',
    role: 'system',
    content:
      'Connection to AI service temporarily unavailable. Your message has been queued and will be processed when the connection is restored.',
    timestamp: new Date(Date.now() - 60000),
  },
];

// Mock handlers
const mockHandlers = {
  onSendMessage: (message: string) => {
    console.log('Sending message:', message);
  },
  onExtractTasks: (tasks: ExtractedTask[]) => {
    console.log('Extracted tasks:', tasks);
  },
  onClearChat: () => {
    console.log('Clearing chat');
  },
};

export const Default: Story = {
  args: {
    messages: sampleMessages,
    isLoading: false,
    isConnected: true,
    showTaskExtraction: true,
    ...mockHandlers,
  },
};

export const EmptyState: Story = {
  args: {
    messages: emptyMessages,
    isLoading: false,
    isConnected: true,
    showTaskExtraction: true,
    ...mockHandlers,
  },
};

export const Loading: Story = {
  args: {
    messages: shortConversation,
    isLoading: true,
    isConnected: true,
    showTaskExtraction: true,
    ...mockHandlers,
  },
};

export const Disconnected: Story = {
  args: {
    messages: systemErrorMessages,
    isLoading: false,
    isConnected: false,
    showTaskExtraction: false,
    ...mockHandlers,
  },
};

export const ShortConversation: Story = {
  args: {
    messages: shortConversation,
    isLoading: false,
    isConnected: true,
    showTaskExtraction: true,
    ...mockHandlers,
  },
};

export const NoTaskExtraction: Story = {
  args: {
    messages: sampleMessages,
    isLoading: false,
    isConnected: true,
    showTaskExtraction: false,
    ...mockHandlers,
  },
};

export const CustomPlaceholder: Story = {
  args: {
    messages: emptyMessages,
    isLoading: false,
    isConnected: true,
    placeholder: 'Ask me anything about task management...',
    showTaskExtraction: true,
    ...mockHandlers,
  },
};

export const CompactHeight: Story = {
  args: {
    messages: sampleMessages,
    isLoading: false,
    isConnected: true,
    maxHeight: '200px',
    showTaskExtraction: true,
    ...mockHandlers,
  },
  parameters: {
    docs: {
      description: {
        story: 'Compact version with limited height for sidebar or modal usage.',
      },
    },
  },
};

export const Interactive: Story = {
  args: {
    messages: [],
    isLoading: false,
    isConnected: true,
    showTaskExtraction: true,
    ...mockHandlers,
  },
  render: function InteractiveStory(args) {
    const [messages, setMessages] = React.useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);

    const handleSendMessage = (content: string) => {
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, userMessage]);
      setIsLoading(true);

      // Simulate AI response
      setTimeout(() => {
        const aiResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `I understand you want to: "${content}". Let me help you break this down into actionable steps and provide some suggestions.`,
          timestamp: new Date(),
          metadata: {
            suggestedActions: ['Create a detailed plan', 'Set time estimates', 'Add to calendar'],
          },
        };
        setMessages(prev => [...prev, aiResponse]);
        setIsLoading(false);
      }, 1500);
    };

    const handleClearChat = () => {
      setMessages([]);
    };

    return (
      <ChatGPTIntegration
        {...args}
        messages={messages}
        isLoading={isLoading}
        onSendMessage={handleSendMessage}
        onClearChat={handleClearChat}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Fully interactive version - try sending messages to see the AI response simulation!',
      },
    },
  },
};
