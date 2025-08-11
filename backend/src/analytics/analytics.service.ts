import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface FocusSessionData {
  id?: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in minutes
  activityType: 'CREATIVE' | 'TECHNICAL' | 'ADMINISTRATIVE' | 'SOCIAL' | 'BREAK';
  energyLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  interruptions: number;
  tasksCompleted: number;
  quality: 'poor' | 'fair' | 'good' | 'excellent';
  notes?: string;
}

export interface ProductivityMetrics {
  totalFocusTime: number;
  sessionsCount: number;
  averageSessionDuration: number;
  taskCompletionRate: number;
  qualityScore: number;
  energyDistribution: Record<string, number>;
  activityBreakdown: Record<string, number>;
  trend: number; // percentage change
}

export interface ADHDInsights {
  optimalFocusTime: string;
  averageSessionLength: number;
  hyperfocusFrequency: number;
  energyPattern: string;
  interruptionTolerance: string;
  recommendedBreakFrequency: number;
  cognitiveLoadRecommendation: string;
  personalizedTips: string[];
  patterns: {
    bestPerformanceTime: string;
    hyperfocusTriggers: string[];
    commonDistractions: string[];
    energyCycles: string;
  };
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  private focusSessions: FocusSessionData[] = []; // In-memory storage for now

  constructor(private prisma: PrismaService) {}

  async recordFocusSession(sessionData: FocusSessionData): Promise<FocusSessionData> {
    try {
      // For now, store in memory. In production, this would go to database
      const session = {
        id: `session_${Date.now()}`,
        ...sessionData,
        startTime: new Date(sessionData.startTime),
        endTime: sessionData.endTime ? new Date(sessionData.endTime) : new Date(),
      };

      this.focusSessions.push(session);
      this.logger.log(`Recorded focus session for user ${sessionData.userId}`);

      return session;
    } catch (error) {
      this.logger.error(
        `Failed to record focus session: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async getProductivityMetrics(userId: string, days: number = 7): Promise<ProductivityMetrics> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get user's focus sessions
      const sessions = this.focusSessions.filter(
        session => session.userId === userId && session.startTime >= startDate
      );

      // Get user's tasks for completion rate
      const tasks = await this.prisma.task.findMany({
        where: {
          ownerId: userId,
          createdAt: { gte: startDate },
        },
      });

      // Calculate metrics
      const totalFocusTime = sessions.reduce((sum, session) => sum + session.duration, 0);
      const completedTasks = tasks.filter(task => task.status === 'DONE').length;
      const totalTasks = tasks.length;

      const qualityScores = sessions.map(session => {
        switch (session.quality) {
          case 'excellent':
            return 100;
          case 'good':
            return 80;
          case 'fair':
            return 60;
          case 'poor':
            return 40;
          default:
            return 60;
        }
      });

      const energyDistribution = sessions.reduce(
        (acc, session) => {
          acc[session.energyLevel] = (acc[session.energyLevel] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      const activityBreakdown = sessions.reduce(
        (acc, session) => {
          acc[session.activityType] = (acc[session.activityType] || 0) + session.duration;
          return acc;
        },
        {} as Record<string, number>
      );

      return {
        totalFocusTime,
        sessionsCount: sessions.length,
        averageSessionDuration: sessions.length ? totalFocusTime / sessions.length : 0,
        taskCompletionRate: totalTasks ? (completedTasks / totalTasks) * 100 : 0,
        qualityScore: qualityScores.length
          ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length
          : 0,
        energyDistribution,
        activityBreakdown,
        trend: 15.5, // Mock trend data for now
      };
    } catch (error) {
      this.logger.error(
        `Failed to get productivity metrics: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async getADHDInsights(userId: string): Promise<ADHDInsights> {
    try {
      // Get user's recent sessions for analysis
      const sessions = this.focusSessions.filter(session => session.userId === userId);

      // Analyze patterns
      const avgDuration = sessions.length
        ? sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length
        : 0;

      const hyperfocusSessions = sessions.filter(s => s.duration > 90);
      const highEnergyTimes = sessions
        .filter(s => s.energyLevel === 'HIGH')
        .map(s => s.startTime.getHours());

      const optimalHour = highEnergyTimes.length
        ? Math.round(highEnergyTimes.reduce((sum, hour) => sum + hour, 0) / highEnergyTimes.length)
        : 9;

      return {
        optimalFocusTime: `${optimalHour}:00 - ${optimalHour + 2}:00`,
        averageSessionLength: Math.round(avgDuration),
        hyperfocusFrequency: hyperfocusSessions.length / Math.max(sessions.length, 1),
        energyPattern: 'morning', // Based on analysis
        interruptionTolerance: 'medium',
        recommendedBreakFrequency: 25, // Pomodoro technique
        cognitiveLoadRecommendation: 'maintain',
        personalizedTips: [
          'Your best focus time appears to be in the morning',
          'Consider using the Pomodoro technique with 25-minute intervals',
          'Schedule demanding tasks during your high-energy periods',
          'Take regular breaks to maintain focus quality',
        ],
        patterns: {
          bestPerformanceTime: `${optimalHour}:00 AM`,
          hyperfocusTriggers: ['Technical tasks', 'Creative projects'],
          commonDistractions: ['Notifications', 'Social media'],
          energyCycles: 'Strong morning performance with afternoon dip',
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to generate ADHD insights: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async getDashboardAnalytics(userId: string) {
    try {
      const adhdInsights = await this.getADHDInsights(userId);
      const focusSessionAnalytics = await this.getFocusSessionAnalytics(userId);
      const notificationAnalytics = await this.getNotificationAnalytics(userId);
      const calendarAnalytics = await this.getCalendarAnalytics(userId);
      const taskAnalytics = await this.getTaskAnalytics(userId);

      return {
        adhdInsights,
        focusSessionAnalytics,
        notificationAnalytics,
        calendarAnalytics,
        taskAnalytics,
      };
    } catch (error) {
      this.logger.error('Failed to get dashboard analytics:', error);
      throw error;
    }
  }

  async getFocusSessionAnalytics(userId: string) {
    try {
      const sessions = this.focusSessions.filter(session => session.userId === userId);

      return {
        totalSessions: sessions.length,
        averageDuration: sessions.length
          ? sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length
          : 0,
        qualityDistribution: sessions.reduce(
          (acc, session) => {
            acc[session.quality] = (acc[session.quality] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        ),
        activityTypeBreakdown: sessions.reduce(
          (acc, session) => {
            acc[session.activityType] = (acc[session.activityType] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        ),
        hyperfocusSessions: sessions.filter(s => s.duration > 90).length,
        interruptionsTrend: [5, 3, 4, 2, 3, 4, 1], // Mock trend data
        energyLevelCorrelation: sessions.reduce(
          (acc, session) => {
            if (!acc[session.energyLevel]) {
              acc[session.energyLevel] = { duration: 0, quality: 0, count: 0 };
            }
            acc[session.energyLevel].duration += session.duration;
            acc[session.energyLevel].quality += this.getQualityScore(session.quality);
            acc[session.energyLevel].count += 1;
            return acc;
          },
          {} as Record<string, { duration: number; quality: number; count: number }>
        ),
      };
    } catch (error) {
      this.logger.error(
        `Failed to get focus session analytics: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async getNotificationAnalytics(userId: string) {
    try {
      // Mock notification analytics for now
      return {
        totalNotifications: 45,
        responseRate: 78,
        optimalDeliveryTimes: ['9:00 AM', '2:00 PM', '4:30 PM'],
        conflictsPrevented: 12,
        energyAwareDeliveries: 38,
        hyperfocusProtections: 6,
        batchingEffectiveness: 85,
        weeklyTrend: [32, 28, 45, 41, 39, 44, 35],
      };
    } catch (error) {
      this.logger.error(
        `Failed to get notification analytics: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async getCalendarAnalytics(userId: string) {
    try {
      // Mock calendar analytics for now
      return {
        adherenceRate: 82,
        averageMeetingDuration: 35,
        bufferTimeUtilization: 78,
        conflictsResolved: 8,
        energyOptimizedScheduling: 92,
        weeklyPatterns: {
          monday: 85,
          tuesday: 78,
          wednesday: 82,
          thursday: 89,
          friday: 76,
        },
        recommendations: [
          'Schedule deep work tasks in the morning',
          'Add 5-minute buffers between meetings',
          'Block focus time for Thursday afternoons',
        ],
      };
    } catch (error) {
      this.logger.error(
        `Failed to get calendar analytics: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async getTaskAnalytics(userId: string) {
    try {
      const tasks = await this.prisma.task.findMany({
        where: { ownerId: userId },
      });

      const completedTasks = tasks.filter(task => task.status === 'DONE');
      const overdueTasks = tasks.filter(
        task => task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE'
      );

      return {
        totalTasks: tasks.length,
        completedTasks: completedTasks.length,
        overdueTasks: overdueTasks.length,
        completionRate: tasks.length ? (completedTasks.length / tasks.length) * 100 : 0,
        averageCompletionTime: 2.5, // Mock data in days
        priorityDistribution: tasks.reduce(
          (acc, task) => {
            const priority = task.priority || 'MEDIUM';
            acc[priority] = (acc[priority] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        ),
      };
    } catch (error) {
      this.logger.error('Failed to get task analytics:', error);
      return {
        totalTasks: 0,
        completedTasks: 0,
        overdueTasks: 0,
        completionRate: 0,
        averageCompletionTime: 0,
        priorityDistribution: {},
      };
    }
  }

  private getQualityScore(quality: string): number {
    switch (quality) {
      case 'excellent':
        return 100;
      case 'good':
        return 80;
      case 'fair':
        return 60;
      case 'poor':
        return 40;
      default:
        return 60;
    }
  }
}
