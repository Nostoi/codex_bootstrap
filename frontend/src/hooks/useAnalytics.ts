import { useState, useEffect } from 'react';

export interface FocusSessionData {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  activityType: 'CREATIVE' | 'TECHNICAL' | 'ADMINISTRATIVE' | 'SOCIAL' | 'BREAK';
  energyLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  quality: 'poor' | 'fair' | 'good' | 'excellent';
  interruptions: number;
  tasksCompleted: number;
  source: 'manual' | 'calendar' | 'automatic';
}

export interface ProductivityMetrics {
  date: Date;
  focusMinutes: number;
  tasksCompleted: number;
  averageEnergyLevel: number;
  interruptionsCount: number;
  calendarAdherence: number;
  notificationResponseRate: number;
}

export interface ADHDInsights {
  optimalFocusTime: string;
  averageSessionLength: number;
  hyperfocusFrequency: number;
  energyPattern: 'morning' | 'afternoon' | 'evening' | 'mixed';
  interruptionTolerance: 'low' | 'medium' | 'high';
  recommendedBreakFrequency: number;
  cognitiveLoadRecommendation: 'reduce' | 'maintain' | 'increase';
}

export interface WeeklyAnalytics {
  weekStart: Date;
  totalFocusMinutes: number;
  tasksCompleted: number;
  averageSessionQuality: number;
  bestProductivityDay: string;
  improvementAreas: string[];
  achievements: string[];
}

export interface NotificationAnalytics {
  totalNotifications: number;
  responseRate: number;
  optimalDeliveryTimes: string[];
  conflictsPrevented: number;
  energyAwareDeliveries: number;
  hyperfocusProtections: number;
  batchingEffectiveness: number;
}

export interface CalendarAnalytics {
  adherenceRate: number;
  timeEstimationAccuracy: number;
  meetingVsFocusBalance: { meetings: number; focus: number };
  scheduleOptimizationScore: number;
  conflictResolutionSuccess: number;
  energyAlignmentScore: number;
}

export interface FocusSessionAnalytics {
  totalSessions: number;
  averageDuration: number;
  qualityDistribution: Record<string, number>;
  activityTypeBreakdown: Record<string, number>;
  hyperfocusSessions: number;
  interruptionsTrend: number[];
  energyLevelCorrelation: Record<string, { duration: number; quality: number }>;
}

export interface PersonalizedRecommendations {
  productivity: string[];
  focus: string[];
  energy: string[];
  timeManagement: string[];
  notifications: string[];
}

/**
 * Analytics API Hook
 *
 * Provides easy access to all analytics endpoints with loading states and error handling.
 */
export function useAnalytics() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiCall = async <T>(endpoint: string, options?: RequestInit): Promise<T> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/analytics${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`Analytics API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Analytics request failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Record a focus session
   */
  const recordFocusSession = async (sessionData: Omit<FocusSessionData, 'id'>) => {
    return apiCall('/focus-session', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });
  };

  /**
   * Get productivity metrics for a date range
   */
  const getProductivityMetrics = async (
    startDate: Date,
    endDate: Date
  ): Promise<ProductivityMetrics[]> => {
    const start = startDate.toISOString().split('T')[0];
    const end = endDate.toISOString().split('T')[0];
    return apiCall(`/productivity-metrics?startDate=${start}&endDate=${end}`);
  };

  /**
   * Get ADHD-specific insights
   */
  const getADHDInsights = async (): Promise<ADHDInsights> => {
    return apiCall('/adhd-insights');
  };

  /**
   * Get weekly analytics
   */
  const getWeeklyAnalytics = async (weekStart: Date): Promise<WeeklyAnalytics> => {
    const start = weekStart.toISOString().split('T')[0];
    return apiCall(`/weekly/${start}`);
  };

  /**
   * Get focus session analytics
   */
  const getFocusSessionAnalytics = async (days?: number): Promise<FocusSessionAnalytics> => {
    const query = days ? `?days=${days}` : '';
    return apiCall(`/focus-sessions${query}`);
  };

  /**
   * Get notification analytics
   */
  const getNotificationAnalytics = async (): Promise<NotificationAnalytics> => {
    return apiCall('/notifications');
  };

  /**
   * Get calendar analytics
   */
  const getCalendarAnalytics = async (): Promise<CalendarAnalytics> => {
    return apiCall('/calendar');
  };

  /**
   * Get personalized recommendations
   */
  const getPersonalizedRecommendations = async (): Promise<PersonalizedRecommendations> => {
    return apiCall('/recommendations');
  };

  /**
   * Get comparative analytics
   */
  const getComparativeAnalytics = async () => {
    return apiCall('/comparative');
  };

  /**
   * Get dashboard analytics (all data for dashboard)
   */
  const getDashboardAnalytics = async () => {
    return apiCall('/dashboard');
  };

  /**
   * Export analytics data
   */
  const exportAnalyticsData = async (
    format: 'json' | 'csv' = 'json',
    startDate?: Date,
    endDate?: Date
  ) => {
    const params = new URLSearchParams({ format });
    if (startDate) params.set('startDate', startDate.toISOString().split('T')[0]);
    if (endDate) params.set('endDate', endDate.toISOString().split('T')[0]);

    return apiCall(`/export?${params.toString()}`);
  };

  return {
    loading,
    error,
    recordFocusSession,
    getProductivityMetrics,
    getADHDInsights,
    getWeeklyAnalytics,
    getFocusSessionAnalytics,
    getNotificationAnalytics,
    getCalendarAnalytics,
    getPersonalizedRecommendations,
    getComparativeAnalytics,
    getDashboardAnalytics,
    exportAnalyticsData,
  };
}

/**
 * Hook for dashboard analytics with automatic loading
 */
export function useDashboardAnalytics() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getDashboardAnalytics } = useAnalytics();

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDashboardAnalytics();
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const refreshAnalytics = async () => {
    await loadAnalytics();
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  return {
    analytics,
    loading,
    error,
    refreshAnalytics,
  };
}

/**
 * Hook for focus session tracking with automatic recording
 */
export function useFocusSessionTracking() {
  const [currentSession, setCurrentSession] = useState<FocusSessionData | null>(null);
  const { recordFocusSession } = useAnalytics();

  const startSession = (
    activityType: FocusSessionData['activityType'],
    energyLevel: FocusSessionData['energyLevel']
  ) => {
    const session: FocusSessionData = {
      id: `session-${Date.now()}`,
      startTime: new Date(),
      activityType,
      energyLevel,
      quality: 'fair',
      interruptions: 0,
      tasksCompleted: 0,
      source: 'manual',
    };

    setCurrentSession(session);
    return session;
  };

  const endSession = async (quality?: FocusSessionData['quality']) => {
    if (!currentSession) return null;

    const endedSession = {
      ...currentSession,
      endTime: new Date(),
      duration: Math.round((Date.now() - currentSession.startTime.getTime()) / 60000),
      quality: quality || currentSession.quality,
    };

    try {
      await recordFocusSession(endedSession);
      setCurrentSession(null);
      return endedSession;
    } catch (error) {
      console.error('Failed to record focus session:', error);
      throw error;
    }
  };

  const addInterruption = () => {
    if (currentSession) {
      setCurrentSession({
        ...currentSession,
        interruptions: currentSession.interruptions + 1,
      });
    }
  };

  const addTaskCompleted = () => {
    if (currentSession) {
      setCurrentSession({
        ...currentSession,
        tasksCompleted: currentSession.tasksCompleted + 1,
      });
    }
  };

  return {
    currentSession,
    startSession,
    endSession,
    addInterruption,
    addTaskCompleted,
  };
}

/**
 * Hook for weekly productivity tracking
 */
export function useWeeklyProductivity() {
  const [weeklyData, setWeeklyData] = useState<WeeklyAnalytics[]>([]);
  const [loading, setLoading] = useState(false);
  const { getWeeklyAnalytics } = useAnalytics();

  const loadWeeklyData = async (weeksBack: number = 4) => {
    try {
      setLoading(true);
      const weeks: WeeklyAnalytics[] = [];

      for (let i = 0; i < weeksBack; i++) {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - i * 7);
        // Set to Monday of the week
        weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);

        const data = await getWeeklyAnalytics(weekStart);
        weeks.push(data);
      }

      setWeeklyData(weeks);
    } catch (error) {
      console.error('Failed to load weekly data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWeeklyData();
  }, []);

  return {
    weeklyData,
    loading,
    refreshData: loadWeeklyData,
  };
}

/**
 * Hook for ADHD-specific insights with recommendations
 */
export function useADHDInsights() {
  const [insights, setInsights] = useState<ADHDInsights | null>(null);
  const [recommendations, setRecommendations] = useState<PersonalizedRecommendations | null>(null);
  const [loading, setLoading] = useState(false);
  const { getADHDInsights, getPersonalizedRecommendations } = useAnalytics();

  const loadInsights = async () => {
    try {
      setLoading(true);
      const [insightsData, recommendationsData] = await Promise.all([
        getADHDInsights(),
        getPersonalizedRecommendations(),
      ]);

      setInsights(insightsData);
      setRecommendations(recommendationsData);
    } catch (error) {
      console.error('Failed to load ADHD insights:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInsights();
  }, []);

  return {
    insights,
    recommendations,
    loading,
    refreshInsights: loadInsights,
  };
}
