import { Injectable, Logger } from '@nestjs/common';
import * as Handlebars from 'handlebars';
import { PrismaService } from '../prisma/prisma.service';
import { EnergyLevel, FocusType, TaskStatus } from '@prisma/client';

// Template context interfaces
export interface UserContext {
  id: string;
  name?: string;
  email: string;
  currentEnergyLevel?: EnergyLevel;
  morningEnergyLevel?: EnergyLevel;
  afternoonEnergyLevel?: EnergyLevel;
  workStartTime?: string;
  workEndTime?: string;
  completedTasksToday?: number;
  totalTasksToday?: number;
  preferredFocusTypes?: FocusType[];
}

export interface TaskContext {
  id: string;
  title: string;
  status?: TaskStatus;
  priority?: number;
  energyLevel?: EnergyLevel;
  focusType?: FocusType;
  estimatedMinutes?: number;
  dueDate?: Date;
  softDeadline?: Date;
  hardDeadline?: Date;
  aiSuggestion?: string;
  updatedBy?: string;
}

export interface CalendarContext {
  events: any[];
  conflicts: any[];
  source: 'google' | 'outlook';
  lastSyncTime: Date;
  eventCount: number;
  conflictCount: number;
}

export interface TemplateContext {
  user: UserContext;
  task?: TaskContext;
  calendar?: CalendarContext;
  currentTime: Date;
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  urgencyLevel?: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, any>;
  encouragement?: string;
  motivation?: string;
  suggestion?: string;
}

// Template definitions
const NOTIFICATION_TEMPLATES = {
  'task-update': {
    subject: '{{greeting}} {{user.name}}! 📝 Task "{{task.title}}" was {{actionPast}}',
    body: `{{greeting}} {{user.name}}! 

Your {{priorityEmoji}} task "{{task.title}}" was {{actionPast}}.

{{#if task.dueDate}}⏰ Due: {{formatDate task.dueDate}}{{/if}}
{{#if task.energyLevel}}⚡ Energy: {{formatEnergyLevel task.energyLevel}}{{/if}}
{{#if task.focusType}}🎯 Focus: {{formatFocusType task.focusType}}{{/if}}

{{#if encouragement}}✨ {{encouragement}}{{/if}}`,
    fallback: 'Task "{{task.title}}" was updated',
  },

  'task-created': {
    subject: '{{greeting}} {{user.name}}! ✨ New task "{{task.title}}" is ready',
    body: `{{greeting}} {{user.name}}! 

A new {{priorityEmoji}} task has been created: "{{task.title}}"

{{#if task.dueDate}}⏰ Due: {{formatDate task.dueDate}}{{/if}}
{{#if task.energyLevel}}⚡ Energy: {{formatEnergyLevel task.energyLevel}}{{/if}}
{{#if task.focusType}}🎯 Focus: {{formatFocusType task.focusType}}{{/if}}
{{#if task.estimatedMinutes}}⏱️ Estimated: {{task.estimatedMinutes}} minutes{{/if}}

{{#if task.aiSuggestion}}🤖 AI Suggestion: {{task.aiSuggestion}}{{/if}}

{{#if motivation}}💪 {{motivation}}{{/if}}`,
    fallback: 'New task "{{task.title}}" was created',
  },

  'deadline-reminder': {
    subject: '⏰ {{urgencyEmoji}} {{user.name}}, "{{task.title}}" is due {{relativeTime}}',
    body: `{{urgencyEmoji}} {{urgencyGreeting}} {{user.name}}!

Your {{priorityEmoji}} task "{{task.title}}" is due {{relativeTime}}.

{{#if task.estimatedMinutes}}⏱️ Estimated time: {{task.estimatedMinutes}} minutes{{/if}}
{{#if task.energyLevel}}⚡ Energy required: {{formatEnergyLevel task.energyLevel}}{{/if}}

{{#if encouragement}}{{encouragement}}{{/if}}

{{#if suggestion}}💡 Suggestion: {{suggestion}}{{/if}}`,
    fallback: 'Task "{{task.title}}" is due {{relativeTime}}',
  },

  'calendar-sync': {
    subject: '📅 {{user.name}}, calendar sync completed ({{calendar.eventCount}} events)',
    body: `{{greeting}} {{user.name}}!

Your {{calendar.source}} calendar has been synchronized successfully.

📊 Summary:
• {{calendar.eventCount}} events synced
{{#if calendar.conflictCount}}• {{calendar.conflictCount}} conflicts detected{{/if}}
• Last sync: {{formatDate calendar.lastSyncTime}}

{{#if calendar.conflictCount}}⚠️ Please review conflicts in your dashboard{{/if}}`,
    fallback: 'Calendar sync completed: {{calendar.eventCount}} events from {{calendar.source}}',
  },

  'conflict-alert': {
    subject: '⚠️ {{user.name}}, scheduling conflicts detected!',
    body: `{{greeting}} {{user.name}},

We detected {{conflictCount}} scheduling conflicts that need your attention.

{{#each conflicts}}
• {{this.description}} at {{formatTime this.timeSlot}}
{{/each}}

Please review and resolve these conflicts in your dashboard to maintain your optimal schedule.

{{#if suggestion}}💡 {{suggestion}}{{/if}}`,
    fallback: '{{conflictCount}} scheduling conflicts detected',
  },
};

@Injectable()
export class NotificationTemplatesService {
  private readonly logger = new Logger(NotificationTemplatesService.name);
  private handlebars: typeof Handlebars;

  constructor(private readonly prisma: PrismaService) {
    this.initializeHandlebars();
  }

  private initializeHandlebars() {
    this.handlebars = Handlebars.create();

    // Register helper functions
    this.registerHelpers();

    // Precompile templates for performance
    this.precompileTemplates();
  }

  private registerHelpers() {
    // Format date helper
    this.handlebars.registerHelper('formatDate', (date: Date) => {
      if (!date) return '';
      return new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }).format(new Date(date));
    });

    // Format relative time helper
    this.handlebars.registerHelper('relativeTime', (date: Date) => {
      if (!date) return '';
      const now = new Date();
      const diffMs = new Date(date).getTime() - now.getTime();
      const diffHours = Math.round(diffMs / (1000 * 60 * 60));

      if (diffHours < 0) return 'overdue';
      if (diffHours === 0) return 'in less than an hour';
      if (diffHours === 1) return 'in 1 hour';
      if (diffHours < 24) return `in ${diffHours} hours`;

      const diffDays = Math.round(diffHours / 24);
      if (diffDays === 1) return 'tomorrow';
      return `in ${diffDays} days`;
    });

    // Format time helper
    this.handlebars.registerHelper('formatTime', (timeSlot: string) => {
      if (!timeSlot) return '';
      return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      }).format(new Date(timeSlot));
    });

    // Energy level formatting
    this.handlebars.registerHelper('formatEnergyLevel', (energyLevel: EnergyLevel) => {
      const energyMap = {
        LOW: '🔋 Low Energy',
        MEDIUM: '⚡ Medium Energy',
        HIGH: '🚀 High Energy',
      };
      return energyMap[energyLevel] || energyLevel;
    });

    // Focus type formatting
    this.handlebars.registerHelper('formatFocusType', (focusType: FocusType) => {
      const focusMap = {
        CREATIVE: '🎨 Creative Work',
        TECHNICAL: '⚙️ Technical Work',
        ADMINISTRATIVE: '📋 Administrative',
        SOCIAL: '👥 Social/Collaborative',
      };
      return focusMap[focusType] || focusType;
    });

    // Dynamic greeting based on time of day
    this.handlebars.registerHelper('greeting', (timeOfDay: string, energyLevel?: EnergyLevel) => {
      const baseGreetings = {
        morning: ['Good morning', 'Rise and shine', 'Morning'],
        afternoon: ['Good afternoon', 'Hope your day is going well', 'Afternoon'],
        evening: ['Good evening', 'Evening', 'Hope you had a productive day'],
      };

      const greetings = baseGreetings[timeOfDay] || baseGreetings.afternoon;

      // Add energy-aware variations
      if (energyLevel === 'HIGH') {
        return greetings[0]; // More formal for high energy
      } else if (energyLevel === 'LOW') {
        return greetings[2] || greetings[0]; // Gentler greeting
      }

      return greetings[0];
    });

    // Priority emoji helper
    this.handlebars.registerHelper('priorityEmoji', (priority: number) => {
      if (priority >= 8) return '🔥';
      if (priority >= 6) return '⭐';
      if (priority >= 4) return '📝';
      return '📌';
    });

    // Urgency emoji helper
    this.handlebars.registerHelper('urgencyEmoji', (urgencyLevel: string) => {
      const urgencyMap = {
        critical: '🚨',
        high: '⚠️',
        medium: '⏰',
        low: '📅',
      };
      return urgencyMap[urgencyLevel] || '📅';
    });

    // Urgency greeting helper
    this.handlebars.registerHelper('urgencyGreeting', (urgencyLevel: string) => {
      const urgencyGreetings = {
        critical: 'URGENT',
        high: 'Important reminder',
        medium: 'Friendly reminder',
        low: 'Just a heads up',
      };
      return urgencyGreetings[urgencyLevel] || 'Reminder';
    });

    // Action past tense helper
    this.handlebars.registerHelper('actionPast', (status: TaskStatus) => {
      const actionMap = {
        TODO: 'created',
        IN_PROGRESS: 'started',
        BLOCKED: 'blocked',
        DONE: 'completed',
      };
      return actionMap[status] || 'updated';
    });
  }

  private precompileTemplates() {
    // Precompile all templates for performance
    Object.keys(NOTIFICATION_TEMPLATES).forEach(type => {
      const templates = NOTIFICATION_TEMPLATES[type];
      templates.compiledSubject = this.handlebars.compile(templates.subject);
      templates.compiledBody = this.handlebars.compile(templates.body);
      templates.compiledFallback = this.handlebars.compile(templates.fallback);
    });
  }

  /**
   * Generate personalized notification message
   */
  async generateMessage(
    notificationType: string,
    context: TemplateContext,
    part: 'subject' | 'body' | 'fallback' = 'body'
  ): Promise<string> {
    try {
      const template = NOTIFICATION_TEMPLATES[notificationType];
      if (!template) {
        this.logger.warn(`Template not found for notification type: ${notificationType}`);
        return `Notification: ${notificationType}`;
      }

      // Enrich context with personalization data
      const enrichedContext = await this.enrichContext(context);

      // Select appropriate compiled template
      let compiledTemplate;
      switch (part) {
        case 'subject':
          compiledTemplate = template.compiledSubject;
          break;
        case 'fallback':
          compiledTemplate = template.compiledFallback;
          break;
        default:
          compiledTemplate = template.compiledBody;
      }

      if (!compiledTemplate) {
        this.logger.warn(`Compiled template not found for ${notificationType}.${part}`);
        return template.fallback || `${notificationType} notification`;
      }

      return compiledTemplate(enrichedContext);
    } catch (error) {
      this.logger.error(`Error generating template for ${notificationType}:`, error);

      // Fallback to basic template
      const template = NOTIFICATION_TEMPLATES[notificationType];
      if (template?.compiledFallback) {
        try {
          return template.compiledFallback(context);
        } catch (fallbackError) {
          this.logger.error(`Fallback template also failed:`, fallbackError);
        }
      }

      // Final fallback
      return `${notificationType} notification`;
    }
  }

  /**
   * Enrich context with personalization data
   */
  private async enrichContext(context: TemplateContext): Promise<any> {
    const enriched = { ...context };

    // Add time-based context
    const now = new Date();
    const hour = now.getHours();

    enriched.currentTime = now;
    enriched.timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

    // Add user activity context
    if (context.user?.id) {
      try {
        // Get today's task completion stats
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayStats = await this.prisma.task.aggregate({
          where: {
            ownerId: context.user.id,
            updatedAt: { gte: todayStart },
          },
          _count: {
            id: true,
          },
        });

        const completedStats = await this.prisma.task.aggregate({
          where: {
            ownerId: context.user.id,
            completed: true,
            updatedAt: { gte: todayStart },
          },
          _count: {
            id: true,
          },
        });

        enriched.user.completedTasksToday = completedStats._count.id;
        enriched.user.totalTasksToday = todayStats._count.id;

        // Add encouragement based on progress
        enriched.encouragement = this.generateEncouragement(
          completedStats._count.id,
          todayStats._count.id,
          context.user.currentEnergyLevel
        );

        // Add motivation for new tasks
        enriched.motivation = this.generateMotivation(
          context.user.currentEnergyLevel,
          enriched.timeOfDay
        );

        // Add contextual suggestions
        enriched.suggestion = await this.generateContextualSuggestion(context);
      } catch (error) {
        this.logger.error('Error enriching context with user stats:', error);
      }
    }

    return enriched;
  }

  /**
   * Generate encouraging messages based on user progress
   */
  private generateEncouragement(
    completed: number,
    total: number,
    energyLevel?: EnergyLevel
  ): string {
    const completionRate = total > 0 ? completed / total : 0;

    if (completionRate >= 0.8) {
      return "You're crushing it today! 🚀";
    } else if (completionRate >= 0.5) {
      return 'Great progress! Keep up the momentum! 💪';
    } else if (completed > 0) {
      return "Every step counts! You're making progress! ✨";
    } else if (energyLevel === 'LOW') {
      return "Take it one step at a time, you've got this! 🌱";
    } else {
      return "Ready to tackle your tasks! Let's go! 🎯";
    }
  }

  /**
   * Generate motivational messages for task creation
   */
  private generateMotivation(energyLevel?: EnergyLevel, timeOfDay?: string): string {
    if (energyLevel === 'HIGH') {
      return 'Perfect time to tackle this with your high energy! 🚀';
    } else if (energyLevel === 'LOW' && timeOfDay === 'morning') {
      return "Starting gentle today? That's perfectly fine! 🌅";
    } else if (timeOfDay === 'evening') {
      return 'Planning ahead for tomorrow? Smart thinking! 🌙';
    } else {
      return 'Another step towards your goals! 🎯';
    }
  }

  /**
   * Generate contextual suggestions
   */
  private async generateContextualSuggestion(context: TemplateContext): Promise<string> {
    if (context.urgencyLevel === 'critical') {
      return 'Consider breaking this into smaller steps if it feels overwhelming.';
    } else if (context.task?.energyLevel === 'HIGH' && context.user?.currentEnergyLevel === 'LOW') {
      return "This task requires high energy - maybe save it for when you're feeling more energized?";
    } else if (context.user?.completedTasksToday >= 5) {
      return "You've been productive today! Consider taking a break if needed.";
    } else {
      return 'You can adjust the priority or timing anytime in your dashboard.';
    }
  }
}
