import React, { useState, useCallback } from "react";
import FocusView from "./FocusView";
import ChatGPTIntegration, { ChatMessage, ExtractedTask } from "./ChatGPTIntegration";

export interface Task {
  id: string;
  title: string;
  status: "todo" | "in-progress" | "done";
  dueDate?: string;
  priority: "high" | "medium" | "low";
  estimatedMinutes?: number;
  aiSuggestion?: string;
  project?: string;
}

export interface AIRecommendation {
  id: string;
  type: "priority" | "suggestion" | "reminder";
  message: string;
  action?: string;
}

export interface DashboardProps {
  initialTasks?: Task[];
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void;
  onTaskAdd?: (task: Omit<Task, "id">) => void;
  onTaskDelete?: (taskId: string) => void;
  className?: string;
  layout?: "horizontal" | "vertical";
  chatPosition?: "left" | "right" | "bottom";
}

const Dashboard: React.FC<DashboardProps> = ({
  initialTasks = [
    {
      id: "sample-1",
      title: "Complete project proposal",
      status: "in-progress",
      priority: "high",
      dueDate: "2025-07-28",
      estimatedMinutes: 120,
    },
    {
      id: "sample-2", 
      title: "Review team feedback",
      status: "todo",
      priority: "medium",
      estimatedMinutes: 45,
    },
    {
      id: "sample-3",
      title: "Update documentation",
      status: "todo", 
      priority: "low",
      estimatedMinutes: 30,
    },
  ],
  onTaskUpdate,
  onTaskAdd,
  onTaskDelete,
  className = "",
  layout = "horizontal",
  chatPosition = "right",
}) => {
  // Layout and positioning configurations (for future implementation)
  console.debug('Dashboard layout:', layout, 'chat position:', chatPosition);
  // onTaskDelete callback reserved for future delete functionality
  console.debug('Task delete handler available:', !!onTaskDelete);
  
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Welcome to Helmsman! I'm your AI productivity assistant. I can help you plan your day, extract tasks from your thoughts, and optimize your workflow. What would you like to work on today?",
      timestamp: new Date(),
      metadata: {
        suggestedActions: [
          "Help me plan my day",
          "Extract tasks from my notes",
          "Suggest task priorities",
        ],
      },
    },
  ]);
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendation[]>([
    {
      id: "ai-welcome",
      type: "suggestion",
      message: "Start with your highest priority tasks this morning",
      action: "Review high-priority tasks",
    },
  ]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isAiConnected] = useState(true); // Removed setIsAiConnected as it's not used

  // Generate unique ID for new tasks
  const generateTaskId = () => `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Handle task updates
  const handleTaskUpdate = useCallback((taskId: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, ...updates } : task
    ));
    
    onTaskUpdate?.(taskId, updates);

    // Add AI suggestion based on task completion
    if (updates.status === "done") {
      const completedTask = tasks.find(t => t.id === taskId);
      if (completedTask) {
        setAiRecommendations(prev => [...prev, {
          id: `ai-completion-${Date.now()}`,
          type: "suggestion",
          message: `Great job completing "${completedTask.title}"! Consider taking a short break before your next task.`,
        }]);
      }
    }
  }, [tasks, onTaskUpdate]);

  // Handle task click from FocusView
  const handleTaskClick = useCallback((taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      const nextStatus = task.status === "todo" ? "in-progress" : 
                        task.status === "in-progress" ? "done" : "todo";
      handleTaskUpdate(taskId, { status: nextStatus });
    }
  }, [tasks, handleTaskUpdate]);

  // Handle AI suggestions request
  const handleRequestAISuggestions = useCallback(() => {
    setIsAiLoading(true);
    
    setTimeout(() => {
      const todoTasks = tasks.filter(t => t.status === "todo");
      const newRecommendations: AIRecommendation[] = [];

      if (todoTasks.length > 3) {
        newRecommendations.push({
          id: `ai-priority-${Date.now()}`,
          type: "priority",
          message: `You have ${todoTasks.length} pending tasks. Consider focusing on the top 3 most important ones first.`,
          action: "Sort by priority",
        });
      }

      if (todoTasks.some(t => t.dueDate && new Date(t.dueDate) <= new Date())) {
        newRecommendations.push({
          id: `ai-deadline-${Date.now()}`,
          type: "reminder",
          message: "You have tasks due today. Consider tackling time-sensitive items first.",
          action: "Review due dates",
        });
      }

      setAiRecommendations(prev => [...prev, ...newRecommendations]);
      setIsAiLoading(false);
    }, 1500);
  }, [tasks]);

  // Handle messages from ChatGPT Integration
  const handleSendMessage = useCallback((content: string) => {
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsAiLoading(true);

    setTimeout(() => {
      let aiResponse: ChatMessage;
      
      if (content.toLowerCase().includes("plan my day") || content.toLowerCase().includes("schedule")) {
        aiResponse = {
          id: `msg-${Date.now() + 1}`,
          role: "assistant",
          content: `I can help you plan your day! I see you currently have ${tasks.length} tasks. Let me suggest an optimal schedule based on priorities and estimated time.`,
          timestamp: new Date(),
          metadata: {
            suggestedActions: [
              "Extract tasks from my thoughts",
              "Prioritize my existing tasks",
              "Suggest a daily schedule",
            ],
          },
        };
      } else {
        aiResponse = {
          id: `msg-${Date.now() + 1}`,
          role: "assistant",
          content: `I understand you need help with: "${content}"\n\nI can assist you with planning, task extraction, and productivity optimization. What would you like to focus on?`,
          timestamp: new Date(),
          metadata: {
            suggestedActions: [
              "Help me plan my schedule",
              "Extract tasks from my notes",
              "Prioritize my workload",
            ],
          },
        };
      }

      setMessages(prev => [...prev, aiResponse]);
      setIsAiLoading(false);
    }, 1000 + Math.random() * 1000);
  }, [tasks]);

  // Handle task extraction from chat
  const handleExtractTasks = useCallback((extractedTasks: ExtractedTask[]) => {
    const newTasks: Task[] = extractedTasks.map(extracted => ({
      id: generateTaskId(),
      title: extracted.title,
      status: "todo" as const,
      dueDate: extracted.dueDate,
      priority: extracted.priority,
      project: extracted.project,
      estimatedMinutes: extracted.estimatedDuration,
    }));

    setTasks(prev => [...prev, ...newTasks]);
    
    newTasks.forEach(task => {
      onTaskAdd?.(task);
    });

    const confirmationMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "assistant",
      content: `Perfect! I've extracted ${newTasks.length} tasks and added them to your focus list. You can see them in your daily view.`,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, confirmationMessage]);
  }, [onTaskAdd]);

  // Handle clearing chat
  const handleClearChat = useCallback(() => {
    setMessages([{
      id: "welcome-new",
      role: "assistant",
      content: "Chat cleared! How can I help you stay productive today?",
      timestamp: new Date(),
      metadata: {
        suggestedActions: [
          "Help me plan my day",
          "Extract tasks from my notes",
          "Review my priorities",
        ],
      },
    }]);
  }, []);

  return (
    <div className={`min-h-screen bg-base-100 p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-base-content">Helmsman Dashboard</h1>
          <p className="text-base-content/70 mt-1">
            AI-powered productivity workspace
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="stats stats-horizontal shadow">
            <div className="stat">
              <div className="stat-title">Tasks</div>
              <div className="stat-value text-lg">{tasks.length}</div>
            </div>
            <div className="stat">
              <div className="stat-title">Today</div>
              <div className="stat-value text-lg">
                {tasks.filter(t => t.dueDate === new Date().toISOString().split('T')[0]).length}
              </div>
            </div>
            <div className="stat">
              <div className="stat-title">Done</div>
              <div className="stat-value text-lg text-success">
                {tasks.filter(t => t.status === "done").length}
              </div>
            </div>
          </div>
          <div className={`badge gap-2 ${isAiConnected ? 'badge-success' : 'badge-error'}`}>
            <div className={`w-2 h-2 rounded-full ${isAiConnected ? 'bg-success-content' : 'bg-error-content'}`} />
            AI {isAiConnected ? 'Connected' : 'Offline'}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Focus View */}
        <div className="w-full lg:w-2/3">
          <FocusView
            todaysTasks={tasks}
            focusGoal="AI-optimized daily productivity"
            aiRecommendation={aiRecommendations[0]?.message}
            onTaskClick={handleTaskClick}
            onRefreshAI={handleRequestAISuggestions}
            isLoadingAI={isAiLoading}
          />
        </div>

        {/* Chat Integration */}
        <div className="w-full lg:w-1/3">
          <ChatGPTIntegration
            messages={messages}
            onSendMessage={handleSendMessage}
            onExtractTasks={handleExtractTasks}
            onClearChat={handleClearChat}
            isLoading={isAiLoading}
            isConnected={isAiConnected}
            placeholder="Ask AI to help plan your day, extract tasks, or optimize your workflow..."
            maxHeight="600px"
            showTaskExtraction={true}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 text-center text-base-content/50 text-sm">
        <p>Helmsman AI Productivity Dashboard • Built with React + TypeScript + Tailwind</p>
      </div>
    </div>
  );
};

export default Dashboard;
