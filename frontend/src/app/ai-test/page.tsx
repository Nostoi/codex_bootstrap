'use client';

import React, { useState } from 'react';
import ChatGPTIntegration, { ChatMessage, ExtractedTask } from '@/components/ui/ChatGPTIntegration';
import { aiService } from '@/lib/aiService';

export default function AITestPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'system',
      content:
        'Welcome! I can help you extract tasks from your conversations. Try typing something like "I need to call the doctor, buy groceries, and finish the project presentation by Friday."',
      timestamp: new Date(),
    },
  ]);

  const [extractedTasks, setExtractedTasks] = useState<ExtractedTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error'>(
    'disconnected'
  );

  React.useEffect(() => {
    // Check AI service health on component mount
    aiService
      .healthCheck()
      .then(isHealthy => {
        setConnectionStatus(isHealthy ? 'connected' : 'error');
      })
      .catch(() => {
        setConnectionStatus('error');
      });
  }, []);

  const handleSendMessage = async (content: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Send message to AI service
      const response = await aiService.sendChatMessage({
        messages: [...messages, userMessage],
        temperature: 0.7,
        maxTokens: 1000,
      });

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
      setConnectionStatus('connected');
    } catch (error) {
      console.error('AI Service Error:', error);

      // Fallback to a mock response for testing
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I understand you said: "${content}". I'm currently running in demo mode since the AI service is not fully configured. However, I can still help you extract tasks from your text!`,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
      setConnectionStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExtractTasks = (tasks: ExtractedTask[]) => {
    setExtractedTasks(prev => [...prev, ...tasks]);
    console.log('Tasks extracted:', tasks);

    // Show success message
    alert(`Successfully extracted ${tasks.length} task(s)!`);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: '1',
        role: 'system',
        content: 'Chat cleared. How can I help you today?',
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">🤖 AI Integration Test Page</h1>
        <p className="text-base-content/70">
          Test the ChatGPT integration and task extraction functionality.
        </p>

        {/* Connection Status */}
        <div className="mt-4 p-3 rounded-lg border">
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                connectionStatus === 'connected'
                  ? 'bg-green-500'
                  : connectionStatus === 'error'
                    ? 'bg-red-500'
                    : 'bg-yellow-500'
              }`}
            />
            <span className="font-medium">
              AI Service:{' '}
              {connectionStatus === 'connected'
                ? 'Connected'
                : connectionStatus === 'error'
                  ? 'Error (Demo Mode)'
                  : 'Connecting...'}
            </span>
          </div>
          {connectionStatus === 'error' && (
            <p className="text-sm text-base-content/60 mt-1">
              AI service is not available. Task extraction will work, but chat responses are mocked.
            </p>
          )}
        </div>
      </div>

      {/* Main AI Chat Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body p-4">
              <h2 className="card-title text-lg mb-4">💬 AI Assistant</h2>

              <ChatGPTIntegration
                messages={messages}
                onSendMessage={handleSendMessage}
                onExtractTasks={handleExtractTasks}
                isLoading={isLoading}
                isConnected={connectionStatus !== 'error'}
                placeholder="Try: 'I need to call the dentist, buy groceries, and submit my report by Thursday.'"
                maxHeight="500px"
                showTaskExtraction={true}
                onClearChat={handleClearChat}
              />
            </div>
          </div>
        </div>

        {/* Extracted Tasks Panel */}
        <div className="lg:col-span-1">
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body p-4">
              <h2 className="card-title text-lg mb-4">📋 Extracted Tasks</h2>

              {extractedTasks.length === 0 ? (
                <div className="text-center text-base-content/60 py-8">
                  <div className="text-4xl mb-2">🎯</div>
                  <p>No tasks extracted yet.</p>
                  <p className="text-sm mt-1">
                    Use the "Extract Tasks" button in the chat to get started!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {extractedTasks.map((task, index) => (
                    <div key={index} className="p-3 border border-base-300 rounded-lg">
                      <h3 className="font-medium text-sm">{task.title}</h3>
                      <div className="flex gap-2 mt-2">
                        <span
                          className={`badge badge-xs ${
                            task.priority === 'high'
                              ? 'badge-error'
                              : task.priority === 'medium'
                                ? 'badge-warning'
                                : 'badge-info'
                          }`}
                        >
                          {task.priority}
                        </span>
                        {task.energyLevel && (
                          <span className="badge badge-xs badge-outline">
                            ⚡ {task.energyLevel}
                          </span>
                        )}
                        {task.focusType && (
                          <span className="badge badge-xs badge-outline">🎯 {task.focusType}</span>
                        )}
                      </div>
                      {task.estimatedDuration && (
                        <p className="text-xs text-base-content/60 mt-1">
                          ⏱️ {task.estimatedDuration} min
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Test Buttons */}
          <div className="card bg-base-100 shadow-sm border border-base-300 mt-4">
            <div className="card-body p-4">
              <h3 className="font-medium mb-3">🧪 Quick Tests</h3>
              <div className="space-y-2">
                <button
                  className="btn btn-outline btn-sm w-full"
                  onClick={() =>
                    handleSendMessage(
                      'I need to call the doctor tomorrow, buy groceries, and finish my presentation by Friday'
                    )
                  }
                >
                  Test Task Extraction
                </button>
                <button
                  className="btn btn-outline btn-sm w-full"
                  onClick={() => handleSendMessage('Help me prioritize my tasks for today')}
                >
                  Test AI Assistance
                </button>
                <button
                  className="btn btn-outline btn-sm w-full"
                  onClick={() =>
                    handleSendMessage('What should I focus on next based on my energy level?')
                  }
                >
                  Test ADHD Optimization
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* API Integration Status */}
      <div className="mt-6 p-4 bg-base-200 rounded-lg">
        <h3 className="font-medium mb-2">🔧 Integration Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Frontend API URL:</strong>{' '}
            {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3501'}
          </div>
          <div>
            <strong>AI Service Status:</strong> {connectionStatus}
          </div>
          <div>
            <strong>WebSocket URL:</strong>{' '}
            {process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8001'}
          </div>
          <div>
            <strong>Task Extraction:</strong>{' '}
            {extractedTasks.length > 0 ? '✅ Working' : '⏳ Not tested'}
          </div>
        </div>
      </div>
    </div>
  );
}
