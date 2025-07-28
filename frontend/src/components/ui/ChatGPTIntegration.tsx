import React, { useState, useRef, useEffect } from "react";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  metadata?: {
    taskExtracted?: boolean;
    suggestedActions?: string[];
  };
}

export interface ExtractedTask {
  title: string;
  priority: "low" | "medium" | "high";
  dueDate?: string;
  project?: string;
  estimatedDuration?: number;
}

export interface ChatGPTIntegrationProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  onExtractTasks: (tasks: ExtractedTask[]) => void;
  isLoading?: boolean;
  isConnected?: boolean;
  placeholder?: string;
  maxHeight?: string;
  showTaskExtraction?: boolean;
  onClearChat?: () => void;
}

const ChatGPTIntegration: React.FC<ChatGPTIntegrationProps> = ({
  messages,
  onSendMessage,
  onExtractTasks,
  isLoading = false,
  isConnected = true,
  placeholder = "Ask AI to help plan your day or extract tasks...",
  maxHeight = "400px",
  showTaskExtraction = true,
  onClearChat,
}) => {
  const [inputMessage, setInputMessage] = useState("");
  const [extractedTasks, setExtractedTasks] = useState<ExtractedTask[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (inputMessage.trim() && !isLoading && isConnected) {
      onSendMessage(inputMessage.trim());
      setInputMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTaskExtraction = () => {
    // Mock extracted tasks from conversation
    const mockTasks: ExtractedTask[] = [
      {
        title: "Review project proposal",
        priority: "high",
        dueDate: "2025-07-28",
        project: "Client Work",
        estimatedDuration: 60,
      },
      {
        title: "Update team on progress",
        priority: "medium",
        dueDate: "2025-07-27",
        estimatedDuration: 30,
      },
    ];
    setExtractedTasks(mockTasks);
    onExtractTasks(mockTasks);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getMessageIcon = (role: string) => {
    switch (role) {
      case "user":
        return "👤";
      case "assistant":
        return "🤖";
      case "system":
        return "⚙️";
      default:
        return "💬";
    }
  };

  return (
    <div className="flex flex-col bg-base-100 border border-base-300 rounded-lg shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-base-300">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-success' : 'bg-error'}`} />
            <h3 className="font-semibold text-lg">AI Assistant</h3>
          </div>
          {!isConnected && (
            <span className="text-xs text-error">Disconnected</span>
          )}
        </div>
        <div className="flex gap-2">
          {showTaskExtraction && messages.length > 0 && (
            <button
              onClick={handleTaskExtraction}
              className="btn btn-sm btn-outline btn-primary"
              disabled={isLoading}
              aria-label="Extract tasks from conversation"
            >
              📋 Extract Tasks
            </button>
          )}
          {onClearChat && messages.length > 0 && (
            <button
              onClick={onClearChat}
              className="btn btn-sm btn-ghost"
              aria-label="Clear chat history"
            >
              🗑️
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-4"
        style={{ maxHeight }}
        role="log"
        aria-label="Chat messages"
      >
        {messages.length === 0 ? (
          <div className="text-center text-base-content/60 py-8">
            <div className="text-4xl mb-2">🤖</div>
            <p className="font-medium">AI Assistant Ready</p>
            <p className="text-sm mt-1">Ask me to help plan your day, extract tasks, or organize your work!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.role === "user"
                    ? "bg-primary text-primary-content"
                    : message.role === "system"
                    ? "bg-base-200 text-base-content/80"
                    : "bg-base-200 text-base-content"
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-lg leading-none">
                    {getMessageIcon(message.role)}
                  </span>
                  <div className="flex-1">
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    {message.metadata?.suggestedActions && (
                      <div className="mt-2 space-y-1">
                        <p className="text-xs opacity-75">Suggested actions:</p>
                        {message.metadata.suggestedActions.map((action, index) => (
                          <button
                            key={index}
                            className="block text-xs bg-base-content/10 px-2 py-1 rounded hover:bg-base-content/20 transition-colors"
                            onClick={() => onSendMessage(action)}
                          >
                            {action}
                          </button>
                        ))}
                      </div>
                    )}
                    <p className="text-xs opacity-60 mt-1">
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-base-200 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-lg">🤖</span>
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Task Extraction Results */}
      {extractedTasks.length > 0 && (
        <div className="border-t border-base-300 p-4 bg-base-50">
          <h4 className="font-medium text-sm mb-2">📋 Extracted Tasks</h4>
          <div className="space-y-2">
            {extractedTasks.map((task, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-base-100 p-2 rounded border"
              >
                <div className="flex-1">
                  <p className="font-medium text-sm">{task.title}</p>
                  <div className="flex gap-2 text-xs text-base-content/60">
                    <span className={`badge badge-xs ${
                      task.priority === 'high' ? 'badge-error' :
                      task.priority === 'medium' ? 'badge-warning' : 'badge-info'
                    }`}>
                      {task.priority}
                    </span>
                    {task.dueDate && <span>Due: {task.dueDate}</span>}
                    {task.estimatedDuration && <span>{task.estimatedDuration}min</span>}
                  </div>
                </div>
                <button
                  className="btn btn-xs btn-primary"
                  onClick={() => {
                    // Remove this task from extracted list
                    setExtractedTasks(prev => prev.filter((_, i) => i !== index));
                  }}
                  aria-label={`Add task: ${task.title}`}
                >
                  ➕ Add
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-base-300 p-4">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={isConnected ? placeholder : "AI Assistant is disconnected..."}
            disabled={!isConnected || isLoading}
            className="textarea textarea-bordered flex-1 resize-none"
            rows={1}
            style={{
              minHeight: '2.5rem',
              maxHeight: '6rem'
            }}
            aria-label="Type your message"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || !isConnected || isLoading}
            className="btn btn-primary"
            aria-label="Send message"
          >
            {isLoading ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              "📤"
            )}
          </button>
        </div>
        <div className="flex justify-between items-center mt-2 text-xs text-base-content/60">
          <span>Press Enter to send, Shift+Enter for new line</span>
          <span>{inputMessage.length}/500</span>
        </div>
      </div>
    </div>
  );
};

export default ChatGPTIntegration;
