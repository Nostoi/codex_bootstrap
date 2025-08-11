'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Brain,
  Clock,
  Target,
  Activity,
  Calendar,
  Bell,
  Users,
  Download,
  RefreshCw,
  BarChart3,
  PieChart,
  LineChart,
  AlertCircle,
  CheckCircle,
  Lightbulb,
} from 'lucide-react';
import { useDashboardAnalytics } from '../../hooks/useAnalytics';
import { ProductivityInsights } from './ProductivityInsights';
import { FocusSessionTracker } from './FocusSessionTracker';
import {
  AnalyticsWidget,
  FocusTimeWidget,
  ProductivityScoreWidget,
  EnergyLevelWidget,
  TaskCompletionWidget,
  InterruptionWidget,
  ADHDInsightWidget,
  CalendarSyncWidget,
} from './AnalyticsWidget';

interface DashboardAnalytics {
  adhdInsights: {
    optimalFocusTime: string;
    averageSessionLength: number;
    hyperfocusFrequency: number;
    energyPattern: string;
    interruptionTolerance: string;
    recommendedBreakFrequency: number;
    cognitiveLoadRecommendation: string;
  };
  focusSessionAnalytics: {
    totalSessions: number;
    averageDuration: number;
    qualityDistribution: Record<string, number>;
    activityTypeBreakdown: Record<string, number>;
    hyperfocusSessions: number;
    interruptionsTrend: number[];
    energyLevelCorrelation: Record<string, { duration: number; quality: number }>;
  };
  notificationAnalytics: {
    totalNotifications: number;
    responseRate: number;
    optimalDeliveryTimes: string[];
    conflictsPrevented: number;
    energyAwareDeliveries: number;
    hyperfocusProtections: number;
    batchingEffectiveness: number;
  };
  calendarAnalytics: {
    adherenceRate: number;
    timeEstimationAccuracy: number;
    meetingVsFocusBalance: { meetings: number; focus: number };
    scheduleOptimizationScore: number;
    conflictResolutionSuccess: number;
    energyAlignmentScore: number;
  };
  recommendations: {
    productivity: string[];
    focus: string[];
    energy: string[];
    timeManagement: string[];
    notifications: string[];
  };
  generatedAt: string;
}

interface AnalyticsDashboardProps {
  className?: string;
}

export function AnalyticsDashboard({ className = '' }: AnalyticsDashboardProps) {
  const {
    data: analyticsData,
    loading: analyticsLoading,
    error: analyticsError,
    refresh,
  } = useDashboardAnalytics();
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'focus' | 'productivity' | 'insights'>(
    'overview'
  );
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      // In a real implementation, this would call the API
      // const response = await fetch('/api/analytics/dashboard');
      // const data = await response.json();

      // For now, using mock data
      const mockData: DashboardAnalytics = {
        adhdInsights: {
          optimalFocusTime: '9:00 AM - 11:00 AM',
          averageSessionLength: 45,
          hyperfocusFrequency: 2.3,
          energyPattern: 'morning',
          interruptionTolerance: 'medium',
          recommendedBreakFrequency: 25,
          cognitiveLoadRecommendation: 'maintain',
        },
        focusSessionAnalytics: {
          totalSessions: 23,
          averageDuration: 42,
          qualityDistribution: { poor: 2, fair: 6, good: 11, excellent: 4 },
          activityTypeBreakdown: { TECHNICAL: 45, CREATIVE: 30, ADMINISTRATIVE: 15, SOCIAL: 10 },
          hyperfocusSessions: 3,
          interruptionsTrend: [5, 3, 4, 2, 3, 4, 1],
          energyLevelCorrelation: {
            HIGH: { duration: 58, quality: 3.8 },
            MEDIUM: { duration: 35, quality: 3.2 },
            LOW: { duration: 22, quality: 2.1 },
          },
        },
        notificationAnalytics: {
          totalNotifications: 156,
          responseRate: 78,
          optimalDeliveryTimes: ['9:00 AM', '2:00 PM', '7:00 PM'],
          conflictsPrevented: 23,
          energyAwareDeliveries: 142,
          hyperfocusProtections: 8,
          batchingEffectiveness: 85,
        },
        calendarAnalytics: {
          adherenceRate: 82,
          timeEstimationAccuracy: 68,
          meetingVsFocusBalance: { meetings: 35, focus: 65 },
          scheduleOptimizationScore: 76,
          conflictResolutionSuccess: 91,
          energyAlignmentScore: 73,
        },
        recommendations: {
          productivity: [
            'Schedule your most important tasks between 9-11 AM when your focus is strongest',
            'Take 15-minute breaks every 45 minutes to maintain cognitive performance',
            'Use the Pomodoro technique for administrative tasks to improve completion rates',
          ],
          focus: [
            'Enable hyperfocus protection to maintain deep work sessions longer than 90 minutes',
            'Reduce visual distractions in your workspace during high-concentration tasks',
            'Practice mindfulness techniques to improve session quality scores',
          ],
          energy: [
            'Your energy peaks in the morning - schedule creative work for 9-11 AM',
            'Consider a light snack around 2 PM to combat the afternoon energy dip',
            'Evening energy levels are suitable for planning and administrative tasks',
          ],
          timeManagement: [
            'Add 25% buffer time to task estimates based on your completion patterns',
            'Batch similar activities together to reduce context switching',
            'Review and adjust your calendar weekly to improve adherence rates',
          ],
          notifications: [
            'Your notification response rate is highest at 9 AM and 7 PM',
            'Enable energy-aware batching to reduce interruptions during focus sessions',
            'Consider reducing notification frequency during your 2-4 PM low-energy period',
          ],
        },
        generatedAt: new Date().toISOString(),
      };

      setAnalytics(mockData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshAnalytics = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  };

  const exportData = () => {
    if (!analytics) return;

    const dataStr = JSON.stringify(analytics, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load analytics</h3>
          <p className="text-gray-500 mb-4">Unable to retrieve your analytics data.</p>
          <button
            onClick={loadAnalytics}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">
            ADHD-optimized insights to improve your productivity and well-being
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={refreshAnalytics}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={exportData}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'focus', label: 'Focus Sessions', icon: Target },
            { id: 'productivity', label: 'Productivity', icon: TrendingUp },
            { id: 'insights', label: 'ADHD Insights', icon: Brain },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Key Metrics Widgets */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FocusTimeWidget
              value={analytics.focusSessionAnalytics.averageDuration}
              change={8.5}
              onClick={() => setActiveTab('focus')}
            />
            <ProductivityScoreWidget
              value={analytics.calendarAnalytics.adherenceRate}
              change={12.3}
              onClick={() => setActiveTab('productivity')}
            />
            <TaskCompletionWidget
              completed={analytics.taskAnalytics.completedTasks}
              total={analytics.taskAnalytics.totalTasks}
              change={5.7}
              onClick={() => setActiveTab('productivity')}
            />
            <InterruptionWidget
              count={analytics.focusSessionAnalytics.interruptionsTrend.slice(-1)[0] || 0}
              change={-15.2}
              onClick={() => setActiveTab('focus')}
            />
          </div>

          {/* Current Status Widgets */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <EnergyLevelWidget value="MEDIUM" onClick={() => setActiveTab('insights')} />
            <CalendarSyncWidget
              syncStatus="connected"
              nextEvent="Team meeting in 2 hours"
              onClick={() => setActiveTab('productivity')}
            />
            <AnalyticsWidget
              title="Hyperfocus Sessions"
              metric={{
                value: analytics.focusSessionAnalytics.hyperfocusSessions,
                label: 'This week',
                change: 25,
                changeLabel: 'vs last week',
              }}
              icon={Brain}
              variant="success"
              onClick={() => setActiveTab('insights')}
            />
          </div>

          {/* Focus Session Tracker */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <FocusSessionTracker />

            {/* Today's Insights */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Lightbulb className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Today's Key Insight</h3>
                  <p className="text-gray-700 mb-3">
                    Your focus sessions are 20% longer during morning hours (9-11 AM). Consider
                    scheduling your most important work during this peak period.
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Optimal focus time identified
                    </span>
                    <span className="flex items-center gap-1">
                      <Activity className="w-4 h-4 text-blue-500" />
                      Energy pattern: Morning peak
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'focus' && (
        <div className="space-y-8">
          {/* Focus Session Quality Distribution */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Session Quality Distribution
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(analytics.focusSessionAnalytics.qualityDistribution).map(
                ([quality, count]) => (
                  <div key={quality} className="text-center">
                    <div
                      className={`text-2xl font-bold ${
                        quality === 'excellent'
                          ? 'text-green-600'
                          : quality === 'good'
                            ? 'text-blue-600'
                            : quality === 'fair'
                              ? 'text-yellow-600'
                              : 'text-red-600'
                      }`}
                    >
                      {count}
                    </div>
                    <div className="text-sm text-gray-600 capitalize">{quality}</div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Activity Type Breakdown */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Type Distribution</h3>
            <div className="space-y-3">
              {Object.entries(analytics.focusSessionAnalytics.activityTypeBreakdown).map(
                ([type, percentage]) => (
                  <div key={type} className="flex items-center gap-3">
                    <div className="w-24 text-sm text-gray-600">{type}</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <div className="w-12 text-sm text-gray-900">{percentage}%</div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Energy Level Correlation */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Energy Level vs Performance
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(analytics.focusSessionAnalytics.energyLevelCorrelation).map(
                ([level, data]) => (
                  <div key={level} className="text-center p-4 border rounded-lg">
                    <div
                      className={`text-lg font-semibold ${
                        level === 'HIGH'
                          ? 'text-green-600'
                          : level === 'MEDIUM'
                            ? 'text-yellow-600'
                            : 'text-red-600'
                      }`}
                    >
                      {level} Energy
                    </div>
                    <div className="mt-2 space-y-1">
                      <div className="text-sm text-gray-600">Avg Duration: {data.duration}m</div>
                      <div className="text-sm text-gray-600">Quality Score: {data.quality}/5</div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'productivity' && (
        <div className="space-y-8">
          {/* Notification Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Notification Effectiveness
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Response Rate</span>
                  <span className="font-medium">
                    {analytics.notificationAnalytics.responseRate}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Conflicts Prevented</span>
                  <span className="font-medium">
                    {analytics.notificationAnalytics.conflictsPrevented}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Energy-Aware Deliveries</span>
                  <span className="font-medium">
                    {analytics.notificationAnalytics.energyAwareDeliveries}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Hyperfocus Protections</span>
                  <span className="font-medium">
                    {analytics.notificationAnalytics.hyperfocusProtections}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Calendar Management</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Adherence Rate</span>
                  <span className="font-medium">{analytics.calendarAnalytics.adherenceRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Time Estimation Accuracy</span>
                  <span className="font-medium">
                    {analytics.calendarAnalytics.timeEstimationAccuracy}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Schedule Optimization</span>
                  <span className="font-medium">
                    {analytics.calendarAnalytics.scheduleOptimizationScore}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Energy Alignment</span>
                  <span className="font-medium">
                    {analytics.calendarAnalytics.energyAlignmentScore}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Meeting vs Focus Balance */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Work Balance</h3>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Meetings</span>
                  <span>Focus Time</span>
                </div>
                <div className="flex bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-orange-500 rounded-l-full"
                    style={{
                      width: `${analytics.calendarAnalytics.meetingVsFocusBalance.meetings}%`,
                    }}
                  ></div>
                  <div
                    className="bg-blue-500 rounded-r-full"
                    style={{ width: `${analytics.calendarAnalytics.meetingVsFocusBalance.focus}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm text-gray-900 mt-2">
                  <span>{analytics.calendarAnalytics.meetingVsFocusBalance.meetings}%</span>
                  <span>{analytics.calendarAnalytics.meetingVsFocusBalance.focus}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'insights' && (
        <div className="space-y-8">
          {/* ADHD-Specific Insights */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">ADHD-Optimized Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="text-center p-4 border rounded-lg">
                <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="font-medium text-gray-900">Optimal Focus Time</div>
                <div className="text-sm text-gray-600 mt-1">
                  {analytics.adhdInsights.optimalFocusTime}
                </div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <Activity className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="font-medium text-gray-900">Energy Pattern</div>
                <div className="text-sm text-gray-600 mt-1 capitalize">
                  {analytics.adhdInsights.energyPattern} peak
                </div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <Target className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <div className="font-medium text-gray-900">Break Frequency</div>
                <div className="text-sm text-gray-600 mt-1">
                  Every {analytics.adhdInsights.recommendedBreakFrequency} minutes
                </div>
              </div>
            </div>
          </div>

          {/* Personalized Recommendations */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Personalized Recommendations</h3>
            {Object.entries(analytics.recommendations).map(([category, recommendations]) => (
              <div key={category} className="bg-white p-6 rounded-lg border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3 capitalize flex items-center gap-2">
                  {category === 'productivity' && <TrendingUp className="w-4 h-4" />}
                  {category === 'focus' && <Target className="w-4 h-4" />}
                  {category === 'energy' && <Activity className="w-4 h-4" />}
                  {category === 'timeManagement' && <Clock className="w-4 h-4" />}
                  {category === 'notifications' && <Bell className="w-4 h-4" />}
                  {category.replace(/([A-Z])/g, ' $1')}
                </h4>
                <ul className="space-y-2">
                  {recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      {recommendation}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
        Last updated: {new Date(analytics.generatedAt).toLocaleString()}
      </div>
    </div>
  );
}
