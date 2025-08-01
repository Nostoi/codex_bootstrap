import React, { useState, useCallback, useMemo } from "react";
import FocusView from "./FocusView";
import ChatGPTIntegration, { ChatMessage, ExtractedTask } from "./ChatGPTIntegration";
import CalendarEvents from "./CalendarEvents";
import FilterBar, { FilterValues } from "./FilterBar";
import TaskCard, { EnhancedTask } from "./TaskCard";
import { useDailyPlan, useRefreshDailyPlan } from "../../hooks/useApi";
import { aiService } from "../../lib/aiService";

// Enhanced Task interface matching TaskCard component
export interface Task extends EnhancedTask {}

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
  initialTasks = [],
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
  
  // Use planning API for real data
  const { data: dailyPlan, isLoading: isPlanLoading, error: planError } = useDailyPlan();
  const refreshPlanMutation = useRefreshDailyPlan();
  
  // Convert planning API data to Task format
  const tasksFromAPI: Task[] = React.useMemo(() => {
    if (!dailyPlan) return [];
    
    const allTasks: Task[] = [];
    
    // Add tasks from schedule blocks
    dailyPlan.scheduleBlocks.forEach(block => {
      allTasks.push({
        id: block.task.id,
        title: block.task.title,
        description: block.task.description,
        status: "TODO", // Default status since TaskSummary doesn't include status
        dueDate: block.task.hardDeadline,
        priority: block.task.priority,
        estimatedMinutes: block.task.estimatedMinutes,
        energyLevel: block.task.energyLevel as Task["energyLevel"],
        focusType: block.task.focusType as Task["focusType"],
        hardDeadline: block.task.hardDeadline,
        // Default values for fields not in TaskSummary
        source: "AI_GENERATED",
        isOverdue: false,
        isBlocked: false,
        dependencyCount: 0,
      });
    });
    
    // Add unscheduled tasks
    dailyPlan.unscheduledTasks.forEach(task => {
      allTasks.push({
        id: task.id,
        title: task.title,
        description: task.description,
        status: "TODO", // Default status since TaskSummary doesn't include status
        dueDate: task.hardDeadline,
        priority: task.priority,
        estimatedMinutes: task.estimatedMinutes,
        energyLevel: task.energyLevel as Task["energyLevel"],
        focusType: task.focusType as Task["focusType"],
        hardDeadline: task.hardDeadline,
        // Default values for fields not in TaskSummary
        source: "AI_GENERATED",
        isOverdue: false,
        isBlocked: false,
        dependencyCount: 0,
      });
    });
    
    return allTasks;
  }, [dailyPlan]);
  
  // Use API data if available, otherwise fall back to initial tasks
  const [tasks, setTasks] = useState<Task[]>(tasksFromAPI.length > 0 ? tasksFromAPI : initialTasks);
  
  // Update tasks when API data changes
  React.useEffect(() => {
    if (tasksFromAPI.length > 0) {
      setTasks(tasksFromAPI);
    }
  }, [tasksFromAPI]);

  // Filter state management
  const [filters, setFilters] = useState<FilterValues>({
    search: '',
    energyLevels: [],
    focusTypes: [],
    statuses: [],
    priorityRange: [1, 5],
    dateRange: undefined,
  });

  // View mode state
  const [viewMode, setViewMode] = useState<'grid' | 'focus'>('grid');

  // Filtered tasks based on current filter state
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Search filter
      if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase()) &&
          !task.description?.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }

      // Energy level filter
      if (filters.energyLevels.length > 0 && task.energyLevel && 
          !filters.energyLevels.includes(task.energyLevel)) {
        return false;
      }

      // Focus type filter
      if (filters.focusTypes.length > 0 && task.focusType && 
          !filters.focusTypes.includes(task.focusType)) {
        return false;
      }

      // Status filter
      if (filters.statuses.length > 0 && !filters.statuses.includes(task.status)) {
        return false;
      }

      // Priority range filter
      const taskPriority = task.priority || 3;
      if (taskPriority < filters.priorityRange[0] || taskPriority > filters.priorityRange[1]) {
        return false;
      }

      // Date range filter (if implemented)
      // This would require additional logic based on your date field structure

      return true;
    });
  }, [tasks, filters]);

  // Sort filtered tasks by priority and status
  const sortedFilteredTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      // Sort by priority (high -> low), then by status (in-progress -> todo -> blocked -> done)
      const priorityA = a.priority || 3;
      const priorityB = b.priority || 3;
      const statusOrder = { "IN_PROGRESS": 0, "TODO": 1, "BLOCKED": 2, "DONE": 3 };
      
      if (priorityA !== priorityB) {
        return priorityB - priorityA; // Higher priority first
      }
      return statusOrder[a.status] - statusOrder[b.status];
    });
  }, [filteredTasks]);
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
    if (updates.status === "DONE") {
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

  // Handle task status change from TaskCard
  const handleTaskStatusChange = useCallback((taskId: string, status: Task["status"]) => {
    handleTaskUpdate(taskId, { status });
  }, [handleTaskUpdate]);

  // Handle task click from FocusView
  const handleTaskClick = useCallback((taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      const nextStatus = task.status === "TODO" ? "IN_PROGRESS" : 
                        task.status === "IN_PROGRESS" ? "DONE" : "TODO";
      handleTaskUpdate(taskId, { status: nextStatus });
    }
  }, [tasks, handleTaskUpdate]);

  // Handle AI suggestions request
  const handleRequestAISuggestions = useCallback(() => {
    setIsAiLoading(true);
    
    setTimeout(() => {
      const todoTasks = tasks.filter(t => t.status === "TODO");
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
  const handleSendMessage = useCallback(async (content: string) => {
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsAiLoading(true);

    try {
      // Get AI response using real service
      const response = await aiService.sendChatMessage({
        messages: [...messages, userMessage].map(msg => ({
          role: msg.role,
          content: msg.content,
          id: msg.id,
          timestamp: msg.timestamp,
          metadata: msg.metadata
        })),
        temperature: 0.7,
        maxTokens: 1000
      });

      const aiResponse: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: "assistant",
        content: response.data,
        timestamp: new Date(),
        metadata: {
          suggestedActions: [
            "Extract tasks from this conversation",
            "Help me plan my schedule", 
            "Prioritize my workload",
          ],
        },
      };

      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('AI service error:', error);
      
      // Fallback to helpful error message
      const errorResponse: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: "assistant",
        content: "I'm having trouble connecting to my AI service right now. Please try again in a moment, or use the task extraction feature to work with your existing conversation.",
        timestamp: new Date(),
        metadata: {
          suggestedActions: [
            "Try again",
            "Extract tasks from conversation",
            "Refresh the page",
          ],
        },
      };

      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsAiLoading(false);
    }
  }, [messages, tasks]);

  // Helper function to convert priority
  const convertPriority = (priority: "high" | "medium" | "low"): number => {
    const priorityMap = { high: 5, medium: 3, low: 1 };
    return priorityMap[priority];
  };

  // Handle task extraction from chat
  const handleExtractTasks = useCallback((extractedTasks: ExtractedTask[]) => {
    const newTasks: Task[] = extractedTasks.map(extracted => ({
      id: generateTaskId(),
      title: extracted.title,
      status: "TODO" as const,
      dueDate: extracted.dueDate,
      priority: extracted.priority ? convertPriority(extracted.priority) : 3,
      estimatedMinutes: extracted.estimatedDuration,
      energyLevel: "MEDIUM", // Default values
      focusType: "ADMINISTRATIVE",
      source: "AI_GENERATED",
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
    <div className={`min-h-screen bg-base-100 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-base-300">
        <div>
          <h1 className="text-3xl font-bold text-base-content">Helmsman Dashboard</h1>
          <p className="text-base-content/70 mt-1">
            AI-powered productivity workspace
            {dailyPlan && (
              <span className="ml-2 text-sm">
                • Plan for {new Date(dailyPlan.date).toLocaleDateString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="join">
            <button 
              className={`btn btn-sm join-item ${viewMode === 'grid' ? 'btn-active' : 'btn-outline'}`}
              onClick={() => setViewMode('grid')}
            >
              📋 Grid
            </button>
            <button 
              className={`btn btn-sm join-item ${viewMode === 'focus' ? 'btn-active' : 'btn-outline'}`}
              onClick={() => setViewMode('focus')}
            >
              🎯 Focus
            </button>
          </div>

          {/* Refresh Plan Button */}
          <button 
            className={`btn btn-outline btn-sm ${refreshPlanMutation.isPending ? 'loading' : ''}`}
            onClick={() => refreshPlanMutation.mutate(undefined)}
            disabled={refreshPlanMutation.isPending}
          >
            {refreshPlanMutation.isPending ? 'Refreshing...' : '🔄 Refresh Plan'}
          </button>
          
          <div className="stats stats-horizontal shadow">
            <div className="stat">
              <div className="stat-title">Tasks</div>
              <div className="stat-value text-lg">{tasks.length}</div>
            </div>
            <div className="stat">
              <div className="stat-title">Filtered</div>
              <div className="stat-value text-lg text-info">{sortedFilteredTasks.length}</div>
            </div>
            <div className="stat">
              <div className="stat-title">Scheduled</div>
              <div className="stat-value text-lg">
                {dailyPlan?.scheduleBlocks?.length || 0}
              </div>
            </div>
            <div className="stat">
              <div className="stat-title">Done</div>
              <div className="stat-value text-lg text-success">
                {tasks.filter(t => t.status === "DONE").length}
              </div>
            </div>
          </div>
          <div className={`badge gap-2 ${isAiConnected ? 'badge-success' : 'badge-error'}`}>
            <div className={`w-2 h-2 rounded-full ${isAiConnected ? 'bg-success-content' : 'bg-error-content'}`} />
            AI {isAiConnected ? 'Connected' : 'Offline'}
          </div>
        </div>
      </div>

      {/* FilterBar */}
      <FilterBar
        filters={filters}
        onFiltersChange={setFilters}
        onClear={() => setFilters({
          search: '',
          energyLevels: [],
          focusTypes: [],
          statuses: [],
          priorityRange: [1, 5],
          dateRange: undefined,
        })}
        onReset={() => setFilters({
          search: '',
          energyLevels: [],
          focusTypes: [],
          statuses: [],
          priorityRange: [1, 5],
          dateRange: undefined,
        })}
        loading={isPlanLoading}
      />

      {/* Loading State */}
      {isPlanLoading && (
        <div className="alert alert-info mx-6 mt-6">
          <span className="loading loading-spinner loading-sm"></span>
          Loading your daily plan...
        </div>
      )}

      {/* Error State */}
      {planError && (
        <div className="alert alert-warning mx-6 mt-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span>Could not load daily plan. Using fallback data.</span>
          <button 
            className="btn btn-sm btn-outline"
            onClick={() => refreshPlanMutation.mutate(undefined)}
          >
            Retry
          </button>
        </div>
      )}

      {/* Planning Optimization Info */}
      {dailyPlan && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mx-6 mt-6">
          <div className="stat bg-base-200 rounded-lg">
            <div className="stat-title">Energy Optimization</div>
            <div className="stat-value text-lg">
              {Math.round(dailyPlan.energyOptimization * 100)}%
            </div>
            <div className="stat-desc">Task-energy alignment</div>
          </div>
          <div className="stat bg-base-200 rounded-lg">
            <div className="stat-title">Focus Optimization</div>
            <div className="stat-value text-lg">
              {Math.round(dailyPlan.focusOptimization * 100)}%
            </div>
            <div className="stat-desc">Task-focus alignment</div>
          </div>
          <div className="stat bg-base-200 rounded-lg">
            <div className="stat-title">Deadline Risk</div>
            <div className={`stat-value text-lg ${dailyPlan.deadlineRisk > 0.7 ? 'text-error' : dailyPlan.deadlineRisk > 0.4 ? 'text-warning' : 'text-success'}`}>
              {Math.round(dailyPlan.deadlineRisk * 100)}%
            </div>
            <div className="stat-desc">Risk of missing deadlines</div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="p-6">
        {viewMode === 'focus' ? (
          /* Focus View - Traditional layout */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6">
              <FocusView
                todaysTasks={sortedFilteredTasks}
                focusGoal="AI-optimized daily productivity"
                aiRecommendation={aiRecommendations[0]?.message}
                onTaskClick={handleTaskClick}
                onRefreshAI={handleRequestAISuggestions}
                isLoadingAI={isAiLoading}
              />
            </div>

            <div className="lg:col-span-3">
              <CalendarEvents 
                date={dailyPlan?.date}
                maxEvents={5}
                className="h-fit"
              />
            </div>

            <div className="lg:col-span-3">
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
        ) : (
          /* Grid View - Enhanced layout with TaskCards */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Main Tasks Grid */}
            <div className="lg:col-span-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-base-content">
                    Tasks ({sortedFilteredTasks.length})
                  </h2>
                  {filters.search || filters.energyLevels.length > 0 || filters.focusTypes.length > 0 || 
                   filters.statuses.length > 0 || filters.priorityRange[0] > 1 || filters.priorityRange[1] < 5 ? (
                    <span className="text-sm text-base-content/60">
                      Filtered from {tasks.length} total tasks
                    </span>
                  ) : null}
                </div>

                {/* Task Grid */}
                {sortedFilteredTasks.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📋</div>
                    <h3 className="text-xl font-semibold text-base-content mb-2">
                      {tasks.length === 0 ? 'No tasks yet' : 'No tasks match your filters'}
                    </h3>
                    <p className="text-base-content/60 mb-4">
                      {tasks.length === 0 
                        ? 'Start by adding some tasks or ask AI to help plan your day.'
                        : 'Try adjusting your filters to see more tasks.'
                      }
                    </p>
                    {tasks.length > 0 && (
                      <button 
                        className="btn btn-outline btn-sm"
                        onClick={() => setFilters({
                          search: '',
                          energyLevels: [],
                          focusTypes: [],
                          statuses: [],
                          priorityRange: [1, 5],
                          dateRange: undefined,
                        })}
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sortedFilteredTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onClick={() => handleTaskClick(task.id)}
                        onStatusChange={(status) => handleTaskStatusChange(task.id, status)}
                        onEdit={() => {
                          // TODO: Implement edit functionality
                          console.log('Edit task:', task.id);
                        }}
                        interactive={true}
                        className="h-fit"
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-4 space-y-6">
              {/* Calendar Events */}
              <CalendarEvents 
                date={dailyPlan?.date}
                maxEvents={5}
                className="h-fit"
              />

              {/* AI Recommendations */}
              {aiRecommendations.length > 0 && (
                <div className="card bg-base-100 shadow-lg">
                  <div className="card-body">
                    <h3 className="card-title text-lg">🤖 AI Recommendations</h3>
                    <div className="space-y-3">
                      {aiRecommendations.slice(0, 3).map((rec) => (
                        <div key={rec.id} className="alert alert-info">
                          <div className="flex-1">
                            <p className="text-sm">{rec.message}</p>
                            {rec.action && (
                              <button className="btn btn-xs btn-primary mt-2">
                                {rec.action}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="card-actions justify-end">
                      <button 
                        className={`btn btn-sm btn-outline ${isAiLoading ? 'loading' : ''}`}
                        onClick={handleRequestAISuggestions}
                        disabled={isAiLoading}
                      >
                        {isAiLoading ? 'Thinking...' : 'Get More Suggestions'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Chat Integration */}
              <ChatGPTIntegration
                messages={messages}
                onSendMessage={handleSendMessage}
                onExtractTasks={handleExtractTasks}
                onClearChat={handleClearChat}
                isLoading={isAiLoading}
                isConnected={isAiConnected}
                placeholder="Ask AI to help plan your day, extract tasks, or optimize your workflow..."
                maxHeight="400px"
                showTaskExtraction={true}
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-6 text-center text-base-content/50 text-sm pb-6">
        <p>Helmsman AI Productivity Dashboard • Built with React + TypeScript + Tailwind</p>
      </div>
    </div>
  );
};

export default Dashboard;
