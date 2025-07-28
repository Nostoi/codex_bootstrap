// ChatGPT integration utilities and constants

import { ChatMessage, ExtractedTask } from '@/components/ui/ChatGPTIntegration';

export const AI_CONNECTION_STATES = {
  connected: { label: 'Connected', color: 'success', icon: '🟢' },
  connecting: { label: 'Connecting', color: 'warning', icon: '🟡' },
  disconnected: { label: 'Disconnected', color: 'error', icon: '🔴' },
  error: { label: 'Error', color: 'error', icon: '❌' },
} as const;

export const SUGGESTED_PROMPTS = [
  "Help me prioritize my tasks for today",
  "Break down this large project into smaller tasks",
  "Suggest time estimates for my tasks",
  "What should I focus on next?",
  "Help me plan my week",
  "Review my completed tasks and suggest improvements",
] as const;

export const QUICK_ACTIONS = [
  { label: "Add Task", icon: "➕", action: "add_task" },
  { label: "Set Priority", icon: "⭐", action: "set_priority" },
  { label: "Estimate Time", icon: "⏱️", action: "estimate_time" },
  { label: "Plan Day", icon: "📅", action: "plan_day" },
] as const;

/**
 * Generates a new message ID
 */
export function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Creates a user message
 */
export function createUserMessage(content: string): ChatMessage {
  return {
    id: generateMessageId(),
    content: content.trim(),
    role: 'user',
    timestamp: new Date(),
  };
}

/**
 * Creates an assistant message
 */
export function createAssistantMessage(content: string): ChatMessage {
  return {
    id: generateMessageId(),
    content: content.trim(),
    role: 'assistant',
    timestamp: new Date(),
  };
}

/**
 * Extracts potential tasks from AI response text
 */
export function extractTasksFromText(text: string): ExtractedTask[] {
  const tasks: ExtractedTask[] = [];
  
  // Look for numbered lists, bullet points, or task-like patterns
  const taskPatterns = [
    /(?:^|\n)\d+\.\s*(.+)$/gm, // 1. Task item
    /(?:^|\n)[-*•]\s*(.+)$/gm, // - Task item or * Task item
    /(?:^|\n)(?:TODO|Task|Action):\s*(.+)$/gmi, // TODO: Task item
  ];

  taskPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const title = match[1].trim();
      if (title.length > 3 && title.length < 200) { // Reasonable task title length
        // Determine priority based on keywords
        const priority = getPriorityFromText(title);
        
        tasks.push({
          title,
          priority,
        });
      }
    }
  });

  // Remove duplicates
  const uniqueTasks = tasks.filter((task, index, self) => 
    index === self.findIndex(t => t.title.toLowerCase() === task.title.toLowerCase())
  );

  return uniqueTasks.slice(0, 10); // Limit to 10 tasks to avoid overwhelming
}

/**
 * Determines task priority based on text content
 */
function getPriorityFromText(text: string): ExtractedTask['priority'] {
  const lowercaseText = text.toLowerCase();
  
  const highPriorityKeywords = ['urgent', 'asap', 'critical', 'important', 'deadline', 'emergency'];
  const lowPriorityKeywords = ['later', 'eventually', 'maybe', 'consider', 'nice to have'];
  
  if (highPriorityKeywords.some(keyword => lowercaseText.includes(keyword))) {
    return 'high';
  }
  
  if (lowPriorityKeywords.some(keyword => lowercaseText.includes(keyword))) {
    return 'low';
  }
  
  return 'medium';
}

/**
 * Formats chat message timestamp
 */
export function formatMessageTime(timestamp: Date): string {
  const now = new Date();
  const diff = now.getTime() - timestamp.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return timestamp.toLocaleDateString();
}

/**
 * Validates message content
 */
export function validateMessage(content: string): { isValid: boolean; error?: string } {
  if (!content.trim()) {
    return { isValid: false, error: 'Message cannot be empty' };
  }
  
  if (content.length > 2000) {
    return { isValid: false, error: 'Message is too long (max 2000 characters)' };
  }
  
  return { isValid: true };
}

/**
 * Simulates AI response (for demo purposes)
 */
export function generateMockAIResponse(userMessage: string): string {
  const lowercaseMessage = userMessage.toLowerCase();
  
  if (lowercaseMessage.includes('help') && lowercaseMessage.includes('prioritize')) {
    return `I'd be happy to help you prioritize your tasks! Here's what I suggest:

1. **High Priority**: Complete urgent deadline items first
2. **Medium Priority**: Focus on important but not urgent tasks
3. **Low Priority**: Handle routine tasks when you have extra time

Would you like me to look at your specific tasks and suggest priorities?`;
  }
  
  if (lowercaseMessage.includes('break down') || lowercaseMessage.includes('project')) {
    return `Great idea to break down large projects! Here's a suggested approach:

1. **Define the end goal** - What does "done" look like?
2. **Identify major milestones** - What are the key phases?
3. **Break into actionable tasks** - Each task should take 2-4 hours max
4. **Set dependencies** - Which tasks need to be done first?
5. **Estimate time** - How long will each task take?

What project would you like help breaking down?`;
  }
  
  if (lowercaseMessage.includes('time') && lowercaseMessage.includes('estimate')) {
    return `Time estimation is crucial for planning! Here are some tips:

• **Break tasks into 1-4 hour chunks** for better accuracy
• **Add buffer time** (20-30% extra) for unexpected issues
• **Use historical data** from similar tasks you've done
• **Consider your energy levels** at different times of day

Would you like help estimating time for specific tasks?`;
  }
  
  if (lowercaseMessage.includes('focus') || lowercaseMessage.includes('next')) {
    return `To determine what to focus on next, consider:

1. **Deadlines** - What's most time-sensitive?
2. **Impact** - What will make the biggest difference?
3. **Energy** - What matches your current energy level?
4. **Dependencies** - What's blocking other tasks?

Based on these factors, I'd recommend tackling your highest-priority item that matches your current energy level. What tasks are you considering?`;
  }
  
  // Default response
  return `I understand you'd like assistance with task management. I can help you with:

• Prioritizing tasks based on urgency and importance
• Breaking down large projects into manageable steps
• Estimating time for various activities
• Planning your day or week effectively
• Reviewing and optimizing your workflow

What specific area would you like to work on today?`;
}

/**
 * Gets connection status color class
 */
export function getConnectionStatusColor(status: keyof typeof AI_CONNECTION_STATES): string {
  return AI_CONNECTION_STATES[status].color;
}

/**
 * Checks if a message contains task-related content
 */
export function isTaskRelatedMessage(content: string): boolean {
  const taskKeywords = [
    'task', 'todo', 'deadline', 'priority', 'project', 'work', 'complete',
    'finish', 'do', 'schedule', 'plan', 'organize', 'manage', 'focus'
  ];
  
  const lowercaseContent = content.toLowerCase();
  return taskKeywords.some(keyword => lowercaseContent.includes(keyword));
}

/**
 * Suggests follow-up questions based on conversation context
 */
export function generateFollowUpSuggestions(messages: ChatMessage[]): string[] {
  const recentMessages = messages.slice(-3);
  const combinedText = recentMessages.map(m => m.content).join(' ').toLowerCase();
  
  const suggestions: string[] = [];
  
  if (combinedText.includes('priority')) {
    suggestions.push("How do you determine task priority?");
    suggestions.push("Can you help prioritize my other tasks?");
  }
  
  if (combinedText.includes('time') || combinedText.includes('estimate')) {
    suggestions.push("How can I improve my time estimation?");
    suggestions.push("What about time for breaks and interruptions?");
  }
  
  if (combinedText.includes('project') || combinedText.includes('break down')) {
    suggestions.push("How do I track project progress?");
    suggestions.push("What if the project scope changes?");
  }
  
  if (suggestions.length === 0) {
    // Default suggestions
    suggestions.push("What should I focus on next?");
    suggestions.push("Help me plan my day");
    suggestions.push("How can I be more productive?");
  }
  
  return suggestions.slice(0, 3); // Limit to 3 suggestions
}
