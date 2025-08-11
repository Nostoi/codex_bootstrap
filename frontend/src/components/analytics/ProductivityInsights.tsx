'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  Target,
  Brain,
  Lightbulb,
  ChevronRight,
  Calendar,
  Bell,
} from 'lucide-react';
import { useADHDInsights } from '../../hooks/useAnalytics';

interface ProductivityInsightsProps {
  className?: string;
  compact?: boolean;
}

export function ProductivityInsights({
  className = '',
  compact = false,
}: ProductivityInsightsProps) {
  const { insights, recommendations, loading } = useADHDInsights();
  const [selectedCategory, setSelectedCategory] = useState<string>('productivity');

  if (loading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!insights || !recommendations) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <Brain className="w-8 h-8 mx-auto mb-2" />
          <p>Insights will appear as you use the app</p>
        </div>
      </div>
    );
  }

  const getEnergyIcon = (pattern: string) => {
    switch (pattern) {
      case 'morning':
        return '🌅';
      case 'afternoon':
        return '☀️';
      case 'evening':
        return '🌙';
      default:
        return '⚡';
    }
  };

  const getToleranceColor = (tolerance: string) => {
    switch (tolerance) {
      case 'low':
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'high':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'productivity':
        return TrendingUp;
      case 'focus':
        return Target;
      case 'energy':
        return Activity;
      case 'timeManagement':
        return Clock;
      case 'notifications':
        return Bell;
      default:
        return Lightbulb;
    }
  };

  if (compact) {
    return (
      <div
        className={`bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200 ${className}`}
      >
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Brain className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 mb-1">Today's Focus Insight</h3>
            <p className="text-sm text-gray-700 mb-2">
              Your optimal focus time is {insights.optimalFocusTime}. Energy peaks during{' '}
              {insights.energyPattern} hours.
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-600">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Avg session: {insights.averageSessionLength}m
              </span>
              <span className="flex items-center gap-1">
                <Activity className="w-3 h-3" />
                Break every {insights.recommendedBreakFrequency}m
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Brain className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">ADHD Insights</h2>
            <p className="text-sm text-gray-600">Personalized patterns and recommendations</p>
          </div>
        </div>
      </div>

      {/* Key Insights */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="font-medium text-gray-900 mb-4">Your Patterns</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Optimal Focus</span>
            </div>
            <div className="text-lg font-bold text-blue-900">{insights.optimalFocusTime}</div>
            <div className="text-xs text-blue-700">Peak productivity window</div>
          </div>

          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-900">Energy Pattern</span>
            </div>
            <div className="text-lg font-bold text-green-900 flex items-center gap-1">
              {getEnergyIcon(insights.energyPattern)} {insights.energyPattern}
            </div>
            <div className="text-xs text-green-700">Peak energy timing</div>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-900">Avg Session</span>
            </div>
            <div className="text-lg font-bold text-purple-900">
              {insights.averageSessionLength}m
            </div>
            <div className="text-xs text-purple-700">Focus duration</div>
          </div>

          <div className="p-4 bg-orange-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Bell className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-900">Interruption</span>
            </div>
            <div
              className={`text-sm font-medium px-2 py-1 rounded-full ${getToleranceColor(insights.interruptionTolerance)}`}
            >
              {insights.interruptionTolerance} tolerance
            </div>
            <div className="text-xs text-orange-700 mt-1">Distraction sensitivity</div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="p-6">
        <h3 className="font-medium text-gray-900 mb-4">Personalized Recommendations</h3>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mb-4">
          {Object.keys(recommendations).map(category => {
            const Icon = getCategoryIcon(category);
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {category.replace(/([A-Z])/g, ' $1').toLowerCase()}
              </button>
            );
          })}
        </div>

        {/* Selected Category Recommendations */}
        <div className="space-y-3">
          {recommendations[selectedCategory as keyof typeof recommendations]?.map(
            (recommendation, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="p-1 bg-blue-100 rounded-full mt-0.5">
                  <Lightbulb className="w-3 h-3 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-800">{recommendation}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            )
          )}
        </div>

        {/* Cognitive Load Recommendation */}
        <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-5 h-5 text-indigo-600" />
            <span className="font-medium text-indigo-900">Cognitive Load Recommendation</span>
          </div>
          <p className="text-sm text-indigo-800">
            Based on your patterns, we recommend you{' '}
            <span className="font-medium">{insights.cognitiveLoadRecommendation}</span> your current
            workload.
            {insights.cognitiveLoadRecommendation === 'reduce' &&
              ' Consider breaking tasks into smaller chunks.'}
            {insights.cognitiveLoadRecommendation === 'maintain' &&
              ' Your current pace seems sustainable.'}
            {insights.cognitiveLoadRecommendation === 'increase' &&
              ' You might be able to take on more challenging tasks.'}
          </p>
        </div>
      </div>
    </div>
  );
}
