import { faker } from '@faker-js/faker';
import { EnergyLevel, FocusType, TaskSource } from '@prisma/client';

/**
 * Mock OpenAI Service for testing AI-powered task management features
 * Provides deterministic responses for task extraction, classification, and suggestions
 */
export class MockOpenAIService {
  private static instance: MockOpenAIService;
  private responses: Map<string, any> = new Map();

  static getInstance(): MockOpenAIService {
    if (!MockOpenAIService.instance) {
      MockOpenAIService.instance = new MockOpenAIService();
    }
    return MockOpenAIService.instance;
  }

  /**
   * Mock task extraction from text
   */
  async extractTasks(text: string, context?: string): Promise<ExtractedTask[]> {
    // Return predefined response if set, otherwise generate realistic response
    const cacheKey = `extract:${text}`;
    if (this.responses.has(cacheKey)) {
      return this.responses.get(cacheKey);
    }

    const extractedTasks = this.generateExtractedTasks(text, context);
    this.responses.set(cacheKey, extractedTasks);
    return extractedTasks;
  }

  /**
   * Mock task classification and ADHD optimization
   */
  async classifyTask(title: string, description?: string): Promise<TaskClassification> {
    const cacheKey = `classify:${title}:${description || ''}`;
    if (this.responses.has(cacheKey)) {
      return this.responses.get(cacheKey);
    }

    const classification = this.generateTaskClassification(title, description);
    this.responses.set(cacheKey, classification);
    return classification;
  }

  /**
   * Mock AI suggestions for task optimization
   */
  async generateSuggestions(
    tasks: any[],
    userPreferences: any,
    context?: any
  ): Promise<AISuggestion[]> {
    const cacheKey = `suggestions:${tasks.length}:${JSON.stringify(userPreferences)}`;
    if (this.responses.has(cacheKey)) {
      return this.responses.get(cacheKey);
    }

    const suggestions = this.generateAdhSuggestions(tasks, userPreferences);
    this.responses.set(cacheKey, suggestions);
    return suggestions;
  }

  /**
   * Mock daily planning optimization
   */
  async optimizeDailyPlan(
    tasks: any[],
    availableHours: number,
    energyPattern: string,
    preferences: any
  ): Promise<DailyPlan> {
    const plan = this.generateOptimizedDailyPlan(tasks, availableHours, energyPattern, preferences);
    return plan;
  }

  /**
   * Set predefined response for testing specific scenarios
   */
  setMockResponse(key: string, response: any): void {
    this.responses.set(key, response);
  }

  /**
   * Clear all cached responses
   */
  clearMockResponses(): void {
    this.responses.clear();
  }

  /**
   * Get usage statistics for testing
   */
  getUsageStats(): { calls: number; tokens: number } {
    return {
      calls: this.responses.size,
      tokens: faker.number.int({ min: 1000, max: 5000 }),
    };
  }

  // Private helper methods

  private generateExtractedTasks(text: string, context?: string): ExtractedTask[] {
    const taskCount = this.estimateTaskCount(text);
    const tasks: ExtractedTask[] = [];

    for (let i = 0; i < taskCount; i++) {
      tasks.push({
        title: this.extractTaskTitle(text, i),
        description: this.extractTaskDescription(text, i),
        energyLevel: this.predictEnergyLevel(text),
        focusType: this.predictFocusType(text),
        estimatedMinutes: this.predictDuration(text),
        priority: this.predictPriority(text, context),
        source: this.detectTaskSource(context),
        confidence: faker.number.float({ min: 0.7, max: 0.95 }),
        originalText: text,
      });
    }

    return tasks;
  }

  private generateTaskClassification(title: string, description?: string): TaskClassification {
    const combinedText = `${title} ${description || ''}`.toLowerCase();

    return {
      energyLevel: this.predictEnergyLevel(combinedText),
      focusType: this.predictFocusType(combinedText),
      estimatedMinutes: this.predictDuration(combinedText),
      priority: this.predictPriority(combinedText),
      complexity: this.predictComplexity(combinedText),
      tags: this.generateTags(combinedText),
      aiSuggestion: this.generateTaskSuggestion(title, description),
      confidence: faker.number.float({ min: 0.8, max: 0.95 }),
    };
  }

  private generateAdhSuggestions(tasks: any[], userPreferences: any): AISuggestion[] {
    const suggestions: AISuggestion[] = [];

    // Energy optimization suggestions
    const highEnergyTasks = tasks.filter(t => t.energyLevel === 'HIGH');
    if (highEnergyTasks.length > 0) {
      suggestions.push({
        type: 'ENERGY_OPTIMIZATION',
        title: 'Optimize High-Energy Tasks',
        description: `Schedule ${highEnergyTasks.length} high-energy tasks during your peak hours (${userPreferences.peakEnergyHours || 'morning'}).`,
        priority: 'HIGH',
        actionable: true,
        relatedTaskIds: highEnergyTasks.map(t => t.id),
      });
    }

    // Focus batching suggestions
    const focusGroups = this.groupTasksByFocus(tasks);
    Object.entries(focusGroups).forEach(([focusType, groupTasks]) => {
      if (groupTasks.length > 2) {
        suggestions.push({
          type: 'FOCUS_BATCHING',
          title: `Batch ${focusType} Tasks`,
          description: `Consider batching ${groupTasks.length} ${focusType.toLowerCase()} tasks together for better flow.`,
          priority: 'MEDIUM',
          actionable: true,
          relatedTaskIds: groupTasks.map(t => t.id),
        });
      }
    });

    // Deadline management
    const urgentTasks = tasks.filter(
      t =>
        t.priority >= 8 ||
        (t.dueDate && new Date(t.dueDate) <= new Date(Date.now() + 24 * 60 * 60 * 1000))
    );
    if (urgentTasks.length > 0) {
      suggestions.push({
        type: 'DEADLINE_MANAGEMENT',
        title: 'Urgent Tasks Need Attention',
        description: `${urgentTasks.length} tasks need immediate attention due to high priority or approaching deadlines.`,
        priority: 'HIGH',
        actionable: true,
        relatedTaskIds: urgentTasks.map(t => t.id),
      });
    }

    return suggestions;
  }

  private generateOptimizedDailyPlan(
    tasks: any[],
    availableHours: number,
    energyPattern: string,
    preferences: any
  ): DailyPlan {
    const planSlots: PlanSlot[] = [];
    const totalMinutes = availableHours * 60;
    let scheduledMinutes = 0;

    // Sort tasks by ADHD optimization criteria
    const sortedTasks = tasks
      .filter(t => !t.completed)
      .sort((a, b) => {
        // Prioritize by energy level match and urgency
        const aScore = this.calculateTaskScore(a, energyPattern, preferences);
        const bScore = this.calculateTaskScore(b, energyPattern, preferences);
        return bScore - aScore;
      });

    for (const task of sortedTasks) {
      if (scheduledMinutes + task.estimatedMinutes <= totalMinutes) {
        const startTime = this.calculateOptimalStartTime(task, energyPattern, scheduledMinutes);

        planSlots.push({
          taskId: task.id,
          title: task.title,
          startTime,
          duration: task.estimatedMinutes,
          energyLevel: task.energyLevel,
          focusType: task.focusType,
          reasoning: this.generateSchedulingReasoning(task, energyPattern),
        });

        scheduledMinutes += task.estimatedMinutes;
      }
    }

    return {
      date: new Date().toISOString().split('T')[0],
      totalPlannedHours: scheduledMinutes / 60,
      energyPattern,
      slots: planSlots,
      optimization: {
        energyAlignment: this.calculateEnergyAlignment(planSlots, energyPattern),
        focusBatching: this.calculateFocusBatching(planSlots),
        workloadBalance: this.calculateWorkloadBalance(planSlots),
      },
    };
  }

  // Helper methods for realistic AI predictions

  private estimateTaskCount(text: string): number {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    const actionWords = (
      text.match(/\b(do|make|create|write|fix|update|implement|design|plan)\b/gi) || []
    ).length;
    return Math.min(Math.max(1, Math.floor(actionWords * 0.7)), 5);
  }

  private extractTaskTitle(text: string, index: number): string {
    const taskPatterns = [
      'Implement user authentication system',
      'Create project documentation',
      'Fix database performance issues',
      'Design new dashboard layout',
      'Update API endpoints',
      'Review code changes',
      'Plan next sprint goals',
      'Conduct team meeting',
    ];

    return faker.helpers.arrayElement(taskPatterns);
  }

  private extractTaskDescription(text: string, index: number): string {
    return `Task extracted from: "${text.substring(0, 100)}..." - Requires focused attention and proper planning.`;
  }

  private predictEnergyLevel(text: string): EnergyLevel {
    const highEnergyKeywords = [
      'urgent',
      'critical',
      'important',
      'deploy',
      'launch',
      'deadline',
      'implement',
      'create',
    ];
    const lowEnergyKeywords = ['review', 'read', 'organize', 'update', 'check', 'simple', 'quick'];

    const textLower = text.toLowerCase();
    const highScore = highEnergyKeywords.filter(keyword => textLower.includes(keyword)).length;
    const lowScore = lowEnergyKeywords.filter(keyword => textLower.includes(keyword)).length;

    if (highScore > lowScore) return 'HIGH';
    if (lowScore > highScore) return 'LOW';
    return 'MEDIUM';
  }

  private predictFocusType(text: string): FocusType {
    const textLower = text.toLowerCase();

    if (/\b(code|debug|implement|api|database|technical)\b/.test(textLower)) return 'TECHNICAL';
    if (/\b(design|create|write|brainstorm|plan)\b/.test(textLower)) return 'CREATIVE';
    if (/\b(meeting|call|discuss|present|collaborate)\b/.test(textLower)) return 'SOCIAL';
    return 'ADMINISTRATIVE';
  }

  private predictDuration(text: string): number {
    const complexity = this.predictComplexity(text);
    const baseMinutes = 30;
    const complexityMultiplier = 1 + (complexity - 5) * 0.2;
    return Math.round(baseMinutes * complexityMultiplier);
  }

  private predictPriority(text: string, context?: string): number {
    const urgencyKeywords = ['urgent', 'asap', 'critical', 'immediate', 'deadline'];
    const textLower = `${text} ${context || ''}`.toLowerCase();
    const urgencyScore = urgencyKeywords.filter(keyword => textLower.includes(keyword)).length;

    return Math.min(10, Math.max(1, 5 + urgencyScore * 2));
  }

  private predictComplexity(text: string): number {
    const complexityKeywords = [
      'system',
      'architecture',
      'integration',
      'algorithm',
      'optimization',
    ];
    const simpleKeywords = ['update', 'fix', 'simple', 'quick', 'minor'];

    const textLower = text.toLowerCase();
    const complexityScore = complexityKeywords.filter(keyword =>
      textLower.includes(keyword)
    ).length;
    const simplicityScore = simpleKeywords.filter(keyword => textLower.includes(keyword)).length;

    return Math.max(1, Math.min(10, 5 + complexityScore * 2 - simplicityScore));
  }

  private detectTaskSource(context?: string): TaskSource {
    if (!context) return 'MANUAL';

    const contextLower = context.toLowerCase();
    if (contextLower.includes('email')) return 'EMAIL';
    if (contextLower.includes('calendar')) return 'CALENDAR';
    if (contextLower.includes('ai') || contextLower.includes('extract')) return 'AI_EXTRACTED';
    return 'MANUAL';
  }

  private generateTags(text: string): string[] {
    const allTags = [
      'urgent',
      'creative',
      'technical',
      'meeting',
      'review',
      'implementation',
      'bug',
      'feature',
    ];
    return faker.helpers.arrayElements(allTags, { min: 1, max: 3 });
  }

  private generateTaskSuggestion(title: string, description?: string): string {
    const suggestions = [
      'Consider breaking this task into smaller, manageable subtasks.',
      'This task pairs well with similar work - consider batching.',
      'Schedule during your peak energy hours for best results.',
      'Use time-blocking to maintain focus on this task.',
      'Set up environment and tools before starting to reduce friction.',
    ];

    return faker.helpers.arrayElement(suggestions);
  }

  private groupTasksByFocus(tasks: any[]): Record<string, any[]> {
    return tasks.reduce((groups, task) => {
      const focus = task.focusType || 'ADMINISTRATIVE';
      if (!groups[focus]) groups[focus] = [];
      groups[focus].push(task);
      return groups;
    }, {});
  }

  private calculateTaskScore(task: any, energyPattern: string, preferences: any): number {
    let score = task.priority || 5;

    // Energy alignment bonus
    if (this.isEnergyAligned(task.energyLevel, energyPattern)) {
      score += 3;
    }

    // Focus preference bonus
    if (preferences.preferredFocusTypes?.includes(task.focusType)) {
      score += 2;
    }

    // Deadline urgency
    if (task.dueDate) {
      const daysUntilDue = (new Date(task.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      if (daysUntilDue <= 1) score += 5;
      else if (daysUntilDue <= 3) score += 3;
    }

    return score;
  }

  private isEnergyAligned(taskEnergy: string, pattern: string): boolean {
    const alignments = {
      MORNING: ['HIGH', 'MEDIUM'],
      AFTERNOON: ['MEDIUM', 'LOW'],
      EVENING: ['CREATIVE', 'LOW'],
      NIGHT: ['TECHNICAL', 'HIGH'],
    };

    return alignments[pattern]?.includes(taskEnergy) || false;
  }

  private calculateOptimalStartTime(
    task: any,
    energyPattern: string,
    currentMinutes: number
  ): string {
    const baseHour = 9; // 9 AM start
    const hours = Math.floor(currentMinutes / 60);
    const minutes = currentMinutes % 60;

    const startHour = baseHour + hours;
    return `${startHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  private generateSchedulingReasoning(task: any, energyPattern: string): string {
    const reasons = [
      `Scheduled during ${energyPattern} hours for optimal ${task.energyLevel} energy alignment`,
      `Batched with other ${task.focusType} tasks for better focus`,
      `Prioritized due to ${task.priority >= 8 ? 'high priority' : 'approaching deadline'}`,
      'Positioned for minimal context switching',
    ];

    return faker.helpers.arrayElement(reasons);
  }

  private calculateEnergyAlignment(slots: PlanSlot[], pattern: string): number {
    return faker.number.float({ min: 0.7, max: 0.95 });
  }

  private calculateFocusBatching(slots: PlanSlot[]): number {
    return faker.number.float({ min: 0.6, max: 0.9 });
  }

  private calculateWorkloadBalance(slots: PlanSlot[]): number {
    return faker.number.float({ min: 0.75, max: 0.95 });
  }
}

// Type definitions for mock responses

export interface ExtractedTask {
  title: string;
  description?: string;
  energyLevel: EnergyLevel;
  focusType: FocusType;
  estimatedMinutes: number;
  priority: number;
  source: TaskSource;
  confidence: number;
  originalText: string;
}

export interface TaskClassification {
  energyLevel: EnergyLevel;
  focusType: FocusType;
  estimatedMinutes: number;
  priority: number;
  complexity: number;
  tags: string[];
  aiSuggestion: string;
  confidence: number;
}

export interface AISuggestion {
  type: 'ENERGY_OPTIMIZATION' | 'FOCUS_BATCHING' | 'DEADLINE_MANAGEMENT' | 'PRODUCTIVITY_TIP';
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  actionable: boolean;
  relatedTaskIds: string[];
}

export interface PlanSlot {
  taskId: string;
  title: string;
  startTime: string;
  duration: number;
  energyLevel: EnergyLevel;
  focusType: FocusType;
  reasoning: string;
}

export interface DailyPlan {
  date: string;
  totalPlannedHours: number;
  energyPattern: string;
  slots: PlanSlot[];
  optimization: {
    energyAlignment: number;
    focusBatching: number;
    workloadBalance: number;
  };
}
