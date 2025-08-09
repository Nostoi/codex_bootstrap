/**
 * Backend Performance Monitor Hook
 * Connects to backend performance API for comprehensive monitoring
 */

import { useState, useEffect, useCallback } from 'react';

interface DatabaseMetrics {
  averageQueryTime: number;
  slowQueries: Array<{
    query: string;
    duration: number;
    timestamp: string;
    table: string;
    type: string;
  }>;
  queryCount: number;
  connectionPoolUsage: number;
  cacheHitRatio: number;
  slowQueryThreshold: number;
}

interface PerformanceAlert {
  level: 'critical' | 'warning' | 'info';
  type: string;
  message: string;
  impact: string;
  action: string;
}

interface ADHDRecommendation {
  category: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actions: string[];
  expectedImprovement: string;
}

interface BackendPerformanceData {
  database: DatabaseMetrics;
  alerts: PerformanceAlert[];
  recommendations: ADHDRecommendation[];
  status: 'excellent' | 'good' | 'warning' | 'critical';
  lastUpdated: string;
}

export const useBackendPerformance = (updateInterval: number = 30000) => {
  const [data, setData] = useState<BackendPerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error'>(
    'disconnected'
  );

  const fetchPerformanceData = useCallback(async () => {
    try {
      setConnectionStatus('connected');

      // Fetch all performance data in parallel
      const [overviewResponse, alertsResponse, recommendationsResponse] = await Promise.all([
        fetch('/api/performance/overview'),
        fetch('/api/performance/alerts'),
        fetch('/api/performance/adhd-recommendations'),
      ]);

      if (!overviewResponse.ok || !alertsResponse.ok || !recommendationsResponse.ok) {
        throw new Error('Failed to fetch performance data');
      }

      const [overview, alerts, recommendations] = await Promise.all([
        overviewResponse.json(),
        alertsResponse.json(),
        recommendationsResponse.json(),
      ]);

      const combinedData: BackendPerformanceData = {
        database: overview.database,
        alerts: alerts.alerts,
        recommendations: recommendations.recommendations,
        status: overview.status,
        lastUpdated: new Date().toISOString(),
      };

      setData(combinedData);
      setError(null);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch backend performance data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setConnectionStatus('error');
      setLoading(false);
    }
  }, []);

  // Real-time status check
  const checkStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/performance/status');
      if (response.ok) {
        const status = await response.json();
        setConnectionStatus('connected');
        return status;
      }
      setConnectionStatus('error');
      return null;
    } catch {
      setConnectionStatus('error');
      return null;
    }
  }, []);

  // Reset performance metrics
  const resetMetrics = useCallback(async () => {
    try {
      const response = await fetch('/api/performance/reset', {
        method: 'POST',
      });
      if (response.ok) {
        await fetchPerformanceData(); // Refresh data after reset
        return { success: true };
      }
      return { success: false, error: 'Failed to reset metrics' };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }, [fetchPerformanceData]);

  // Setup periodic data fetching
  useEffect(() => {
    fetchPerformanceData();

    const interval = setInterval(fetchPerformanceData, updateInterval);

    return () => clearInterval(interval);
  }, [fetchPerformanceData, updateInterval]);

  // Setup status monitoring
  useEffect(() => {
    const statusInterval = setInterval(checkStatus, 5000); // Check every 5 seconds

    return () => clearInterval(statusInterval);
  }, [checkStatus]);

  // Derived values for easy access
  const criticalAlerts = data?.alerts.filter(alert => alert.level === 'critical') || [];
  const highPriorityRecommendations =
    data?.recommendations.filter(rec => rec.priority === 'high') || [];
  const isHealthy = data?.status === 'excellent' || data?.status === 'good';

  // ADHD-specific metrics
  const adhdMetrics = {
    queryTimeAcceptable: (data?.database.averageQueryTime || 0) <= 30,
    lowSlowQueries: (data?.database.slowQueries.length || 0) <= 3,
    goodCacheRatio: (data?.database.cacheHitRatio || 0) >= 80,
    connectionHealthy: (data?.database.connectionPoolUsage || 0) <= 80,
  };

  const adhdScore =
    (Object.values(adhdMetrics).filter(Boolean).length / Object.keys(adhdMetrics).length) * 100;

  return {
    // Core data
    data,
    loading,
    error,
    connectionStatus,

    // Actions
    refresh: fetchPerformanceData,
    checkStatus,
    resetMetrics,

    // Derived values
    criticalAlerts,
    highPriorityRecommendations,
    isHealthy,

    // ADHD-specific
    adhdMetrics,
    adhdScore,

    // Quick access to key metrics
    averageQueryTime: data?.database.averageQueryTime || 0,
    slowQueriesCount: data?.database.slowQueries.length || 0,
    cacheHitRatio: data?.database.cacheHitRatio || 0,
    alertsCount: data?.alerts.length || 0,
    recommendationsCount: data?.recommendations.length || 0,
  };
};

/**
 * Hook for real-time performance alerts
 */
export const usePerformanceAlerts = () => {
  const { data, criticalAlerts } = useBackendPerformance(10000); // Check every 10 seconds
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState<Set<string>>(new Set());

  const unacknowledgedAlerts = criticalAlerts.filter(
    alert => !acknowledgedAlerts.has(`${alert.type}-${alert.level}`)
  );

  const acknowledgeAlert = useCallback((alert: PerformanceAlert) => {
    setAcknowledgedAlerts(prev => new Set([...prev, `${alert.type}-${alert.level}`]));
  }, []);

  const clearAcknowledged = useCallback(() => {
    setAcknowledgedAlerts(new Set());
  }, []);

  return {
    allAlerts: data?.alerts || [],
    criticalAlerts,
    unacknowledgedAlerts,
    acknowledgeAlert,
    clearAcknowledged,
    hasUnacknowledged: unacknowledgedAlerts.length > 0,
  };
};

/**
 * Hook for ADHD-specific performance insights
 */
export const useADHDPerformanceInsights = () => {
  const { data, adhdMetrics, adhdScore } = useBackendPerformance();

  const insights = {
    // Performance insights specific to ADHD users
    focusImpact: adhdScore >= 80 ? 'low' : adhdScore >= 60 ? 'medium' : 'high',
    taskCompletionRisk: adhdScore < 70 ? 'high' : 'low',
    cognitiveLoad: adhdMetrics.queryTimeAcceptable ? 'optimal' : 'high',

    // Actionable recommendations
    immediateActions:
      data?.recommendations.filter(rec => rec.priority === 'high').map(rec => rec.title) || [],

    userExperienceImpact: {
      attention: adhdMetrics.queryTimeAcceptable ? 'maintained' : 'at-risk',
      taskFlow: adhdMetrics.lowSlowQueries ? 'smooth' : 'interrupted',
      frustration: adhdScore >= 70 ? 'low' : 'high',
    },
  };

  return {
    adhdMetrics,
    adhdScore,
    insights,
    recommendations: data?.recommendations || [],
  };
};
