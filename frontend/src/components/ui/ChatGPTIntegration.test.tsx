import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ChatGPTIntegration, { ChatMessage } from './ChatGPTIntegration';

// Mock scrollIntoView for test environment
Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  value: vi.fn(),
  writable: true,
});

describe('ChatGPTIntegration', () => {
  const mockMessages: ChatMessage[] = [
    {
      id: '1',
      role: 'user',
      content: 'Help me plan my day',
      timestamp: new Date('2025-07-27T10:00:00Z'),
    },
    {
      id: '2',
      role: 'assistant',
      content: 'I can help you plan your day! What are your main priorities?',
      timestamp: new Date('2025-07-27T10:01:00Z'),
    },
  ];

  const defaultProps = {
    messages: mockMessages,
    onSendMessage: vi.fn(),
    onExtractTasks: vi.fn(),
    isLoading: false,
    isConnected: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders chat interface with messages', () => {
    render(<ChatGPTIntegration {...defaultProps} />);
    
    expect(screen.getByText('AI Assistant')).toBeInTheDocument();
    expect(screen.getByText('Help me plan my day')).toBeInTheDocument();
    expect(screen.getByText('I can help you plan your day! What are your main priorities?')).toBeInTheDocument();
  });

  it('shows empty state when no messages', () => {
    render(<ChatGPTIntegration {...defaultProps} messages={[]} />);
    
    expect(screen.getByText('AI Assistant Ready')).toBeInTheDocument();
    expect(screen.getByText('Ask me to help plan your day, extract tasks, or organize your work!')).toBeInTheDocument();
  });

  it('sends message when user types and presses enter', async () => {
    const onSendMessage = vi.fn();
    render(<ChatGPTIntegration {...defaultProps} onSendMessage={onSendMessage} />);
    
    const input = screen.getByRole('textbox', { name: /type your message/i });
    const sendButton = screen.getByRole('button', { name: /send message/i });
    
    fireEvent.change(input, { target: { value: 'New message' } });
    fireEvent.click(sendButton);
    
    expect(onSendMessage).toHaveBeenCalledWith('New message');
  });

  it('sends message with Enter key', async () => {
    const onSendMessage = vi.fn();
    render(<ChatGPTIntegration {...defaultProps} onSendMessage={onSendMessage} />);
    
    const input = screen.getByRole('textbox', { name: /type your message/i });
    
    fireEvent.change(input, { target: { value: 'Enter key message' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    
    expect(onSendMessage).toHaveBeenCalledWith('Enter key message');
  });

  it('does not send message with Shift+Enter', () => {
    const onSendMessage = vi.fn();
    render(<ChatGPTIntegration {...defaultProps} onSendMessage={onSendMessage} />);
    
    const input = screen.getByRole('textbox', { name: /type your message/i });
    
    fireEvent.change(input, { target: { value: 'Shift enter message' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', shiftKey: true });
    
    expect(onSendMessage).not.toHaveBeenCalled();
  });

  it('displays loading state correctly', () => {
    render(<ChatGPTIntegration {...defaultProps} isLoading={true} />);
    
    expect(screen.getByRole('button', { name: /send message/i })).toBeDisabled();
    // Check for loading animation in the chat
    const loadingDots = document.querySelectorAll('.animate-bounce');
    expect(loadingDots.length).toBeGreaterThan(0);
  });

  it('shows disconnected state', () => {
    render(<ChatGPTIntegration {...defaultProps} isConnected={false} />);
    
    expect(screen.getByText('Disconnected')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeDisabled();
    expect(screen.getByRole('button', { name: /send message/i })).toBeDisabled();
  });

  it('extracts tasks when extract button is clicked', () => {
    const onExtractTasks = vi.fn();
    render(<ChatGPTIntegration {...defaultProps} onExtractTasks={onExtractTasks} />);
    
    const extractButton = screen.getByRole('button', { name: /extract tasks/i });
    fireEvent.click(extractButton);
    
    expect(onExtractTasks).toHaveBeenCalled();
  });

  it('clears chat when clear button is clicked', () => {
    const onClearChat = vi.fn();
    render(<ChatGPTIntegration {...defaultProps} onClearChat={onClearChat} />);
    
    const clearButton = screen.getByRole('button', { name: /clear chat history/i });
    fireEvent.click(clearButton);
    
    expect(onClearChat).toHaveBeenCalled();
  });

  it('does not show task extraction button when disabled', () => {
    render(<ChatGPTIntegration {...defaultProps} showTaskExtraction={false} />);
    
    expect(screen.queryByRole('button', { name: /extract tasks/i })).not.toBeInTheDocument();
  });

  it('displays custom placeholder', () => {
    const customPlaceholder = 'Custom placeholder text';
    render(<ChatGPTIntegration {...defaultProps} placeholder={customPlaceholder} />);
    
    expect(screen.getByPlaceholderText(customPlaceholder)).toBeInTheDocument();
  });

  it('shows message timestamps', () => {
    render(<ChatGPTIntegration {...defaultProps} />);
    
    // Check that timestamps are rendered (check for time format pattern)
    const timestampElements = screen.getAllByText(/\d{1,2}:\d{2}/);
    expect(timestampElements.length).toBeGreaterThan(0);
  });

  it('renders different message types with correct styling', () => {
    const messagesWithTypes: ChatMessage[] = [
      {
        id: '1',
        role: 'user',
        content: 'User message',
        timestamp: new Date(),
      },
      {
        id: '2',
        role: 'assistant',
        content: 'Assistant message',
        timestamp: new Date(),
      },
      {
        id: '3',
        role: 'system',
        content: 'System message',
        timestamp: new Date(),
      },
    ];

    render(<ChatGPTIntegration {...defaultProps} messages={messagesWithTypes} />);
    
    expect(screen.getByText('User message')).toBeInTheDocument();
    expect(screen.getByText('Assistant message')).toBeInTheDocument();
    expect(screen.getByText('System message')).toBeInTheDocument();
  });

  it('renders suggested actions when provided', () => {
    const messageWithActions: ChatMessage[] = [
      {
        id: '1',
        role: 'assistant',
        content: 'Here are some suggestions',
        timestamp: new Date(),
        metadata: {
          suggestedActions: ['Action 1', 'Action 2', 'Action 3'],
        },
      },
    ];

    const onSendMessage = vi.fn();
    render(<ChatGPTIntegration {...defaultProps} messages={messageWithActions} onSendMessage={onSendMessage} />);
    
    expect(screen.getByText('Suggested actions:')).toBeInTheDocument();
    expect(screen.getByText('Action 1')).toBeInTheDocument();
    expect(screen.getByText('Action 2')).toBeInTheDocument();
    expect(screen.getByText('Action 3')).toBeInTheDocument();

    // Test clicking suggested action
    fireEvent.click(screen.getByText('Action 1'));
    expect(onSendMessage).toHaveBeenCalledWith('Action 1');
  });

  it('prevents sending empty messages', () => {
    const onSendMessage = vi.fn();
    render(<ChatGPTIntegration {...defaultProps} onSendMessage={onSendMessage} />);
    
    const sendButton = screen.getByRole('button', { name: /send message/i });
    
    // Try to send empty message
    fireEvent.click(sendButton);
    expect(onSendMessage).not.toHaveBeenCalled();

    // Try to send whitespace-only message
    const input = screen.getByRole('textbox', { name: /type your message/i });
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.click(sendButton);
    expect(onSendMessage).not.toHaveBeenCalled();
  });

  it('displays character count', () => {
    render(<ChatGPTIntegration {...defaultProps} />);
    
    const input = screen.getByRole('textbox', { name: /type your message/i });
    fireEvent.change(input, { target: { value: 'Test message' } });
    
    expect(screen.getByText('12/500')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<ChatGPTIntegration {...defaultProps} />);
    
    expect(screen.getByRole('log', { name: /chat messages/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /type your message/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
  });
});
