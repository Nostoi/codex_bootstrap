'use client';

import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  Target,
  Zap,
  Brain,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Activity,
  Calendar,
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface MetricData {
  value: number | string;
  label: string;
  change?: number;
  changeLabel?: string;
  unit?: string;
  format?: 'number' | 'percentage' | 'duration' | 'currency';
}

interface AnalyticsWidgetProps {
  title: string;
  metric: MetricData;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  showTrend?: boolean;
  className?: string;
  onClick?: () => void;
}

export function AnalyticsWidget({
  title,
  metric,
  icon: Icon = BarChart3,
  variant = 'default',
  size = 'md',
  showTrend = true,
  className,
  onClick,
}: AnalyticsWidgetProps) {
  const formatValue = (value: number | string, format?: string, unit?: string) => {
    if (typeof value === 'string') return value;

    switch (format) {
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'duration':
        if (unit === 'minutes') {
          const hours = Math.floor(value / 60);
          const mins = value % 60;
          if (hours > 0) {
            return `${hours}h ${mins}m`;
          }
          return `${value}m`;
        }
        return `${value}${unit || ''}`;
      case 'currency':
        return `$${value.toLocaleString()}`;
      case 'number':
      default:
        return value.toLocaleString() + (unit || '');
    }
  };

  const getTrendIcon = (change?: number) => {
    if (!change || change === 0) return Minus;
    return change > 0 ? TrendingUp : TrendingDown;
  };

  const getTrendColor = (change?: number) => {
    if (!change || change === 0) return 'text-gray-400';
    return change > 0 ? 'text-green-500' : 'text-red-500';
  };

  const getVariantStyles = (variant: string) => {
    switch (variant) {
      case 'primary':
        return {
          background: 'bg-blue-50 border-blue-200',
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          titleColor: 'text-blue-900',
          valueColor: 'text-blue-800',
        };
      case 'success':
        return {
          background: 'bg-green-50 border-green-200',
          iconBg: 'bg-green-100',
          iconColor: 'text-green-600',
          titleColor: 'text-green-900',
          valueColor: 'text-green-800',
        };
      case 'warning':
        return {
          background: 'bg-yellow-50 border-yellow-200',
          iconBg: 'bg-yellow-100',
          iconColor: 'text-yellow-600',
          titleColor: 'text-yellow-900',
          valueColor: 'text-yellow-800',
        };
      case 'danger':
        return {
          background: 'bg-red-50 border-red-200',
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          titleColor: 'text-red-900',
          valueColor: 'text-red-800',
        };
      default:
        return {
          background: 'bg-white border-gray-200',
          iconBg: 'bg-gray-100',
          iconColor: 'text-gray-600',
          titleColor: 'text-gray-900',
          valueColor: 'text-gray-800',
        };
    }
  };

  const getSizeStyles = (size: string) => {
    switch (size) {
      case 'sm':
        return {
          container: 'p-3 sm:p-4',
          iconSize: 'w-4 h-4 sm:w-5 sm:h-5',
          iconContainer: 'p-2',
          titleSize: 'text-xs sm:text-sm',
          valueSize: 'text-base sm:text-lg',
          changeSize: 'text-xs',
        };
      case 'lg':
        return {
          container: 'p-4 sm:p-6 lg:p-8',
          iconSize: 'w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8',
          iconContainer: 'p-3 sm:p-4',
          titleSize: 'text-sm sm:text-base lg:text-lg',
          valueSize: 'text-xl sm:text-2xl lg:text-4xl',
          changeSize: 'text-xs sm:text-sm lg:text-base',
        };
      default: // md
        return {
          container: 'p-3 sm:p-4 lg:p-6',
          iconSize: 'w-5 h-5 sm:w-6 sm:h-6',
          iconContainer: 'p-2 sm:p-3',
          titleSize: 'text-xs sm:text-sm lg:text-base',
          valueSize: 'text-lg sm:text-xl lg:text-2xl',
          changeSize: 'text-xs sm:text-sm',
        };
    }
  };

  const styles = getVariantStyles(variant);
  const sizeStyles = getSizeStyles(size);
  const TrendIcon = getTrendIcon(metric.change);
  const trendColor = getTrendColor(metric.change);

  return (
    <div
      className={cn(
        'rounded-lg border transition-all duration-200',
        styles.background,
        onClick && 'cursor-pointer hover:shadow-md hover:scale-105',
        sizeStyles.container,
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className={cn('rounded-lg', styles.iconBg, sizeStyles.iconContainer)}>
              <Icon className={cn(sizeStyles.iconSize, styles.iconColor)} />
            </div>
            <h3 className={cn('font-medium', styles.titleColor, sizeStyles.titleSize)}>{title}</h3>
          </div>

          <div className="space-y-2">
            <div className={cn('font-bold', styles.valueColor, sizeStyles.valueSize)}>
              {formatValue(metric.value, metric.format, metric.unit)}
            </div>

            {showTrend && metric.change !== undefined && (
              <div className="flex items-center gap-1">
                <TrendIcon className={cn('w-3 h-3', trendColor)} />
                <span className={cn('font-medium', trendColor, sizeStyles.changeSize)}>
                  {Math.abs(metric.change).toFixed(1)}%
                </span>
                {metric.changeLabel && (
                  <span className={cn('text-gray-500', sizeStyles.changeSize)}>
                    {metric.changeLabel}
                  </span>
                )}
              </div>
            )}

            {metric.label && (
              <p className={cn('text-gray-600', sizeStyles.changeSize)}>{metric.label}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Specialized analytics widgets for common metrics
export function FocusTimeWidget({
  value,
  change,
  onClick,
}: {
  value: number;
  change?: number;
  onClick?: () => void;
}) {
  return (
    <AnalyticsWidget
      title="Focus Time Today"
      metric={{
        value,
        change,
        changeLabel: 'vs yesterday',
        format: 'duration',
        unit: 'minutes',
        label: 'Deep work sessions',
      }}
      icon={Clock}
      variant="primary"
      onClick={onClick}
    />
  );
}

export function ProductivityScoreWidget({
  value,
  change,
  onClick,
}: {
  value: number;
  change?: number;
  onClick?: () => void;
}) {
  const variant = value >= 80 ? 'success' : value >= 60 ? 'warning' : 'danger';

  return (
    <AnalyticsWidget
      title="Productivity Score"
      metric={{
        value,
        change,
        changeLabel: 'vs last week',
        format: 'percentage',
        label: 'Overall effectiveness',
      }}
      icon={Target}
      variant={variant}
      onClick={onClick}
    />
  );
}

export function EnergyLevelWidget({
  value,
  onClick,
}: {
  value: 'HIGH' | 'MEDIUM' | 'LOW';
  onClick?: () => void;
}) {
  const energyMap = {
    HIGH: { display: 'High Energy', variant: 'success' as const, emoji: '🚀' },
    MEDIUM: { display: 'Medium Energy', variant: 'warning' as const, emoji: '⚡' },
    LOW: { display: 'Low Energy', variant: 'danger' as const, emoji: '🔋' },
  };

  const energy = energyMap[value];

  return (
    <AnalyticsWidget
      title="Current Energy"
      metric={{
        value: energy.display,
        label: 'Based on recent activity',
      }}
      icon={Zap}
      variant={energy.variant}
      showTrend={false}
      onClick={onClick}
    />
  );
}

export function TaskCompletionWidget({
  completed,
  total,
  change,
  onClick,
}: {
  completed: number;
  total: number;
  change?: number;
  onClick?: () => void;
}) {
  const percentage = total > 0 ? (completed / total) * 100 : 0;
  const variant = percentage >= 80 ? 'success' : percentage >= 60 ? 'warning' : 'default';

  return (
    <AnalyticsWidget
      title="Tasks Completed"
      metric={{
        value: `${completed}/${total}`,
        change,
        changeLabel: 'completion rate',
        label: `${percentage.toFixed(0)}% completion rate`,
      }}
      icon={CheckCircle}
      variant={variant}
      onClick={onClick}
    />
  );
}

export function InterruptionWidget({
  count,
  change,
  onClick,
}: {
  count: number;
  change?: number;
  onClick?: () => void;
}) {
  const variant = count <= 3 ? 'success' : count <= 6 ? 'warning' : 'danger';

  return (
    <AnalyticsWidget
      title="Interruptions Today"
      metric={{
        value: count,
        change,
        changeLabel: 'vs yesterday',
        label: 'Focus breaks',
      }}
      icon={AlertTriangle}
      variant={variant}
      onClick={onClick}
    />
  );
}

export function ADHDInsightWidget({ insight, onClick }: { insight: string; onClick?: () => void }) {
  return (
    <AnalyticsWidget
      title="ADHD Insight"
      metric={{
        value: insight,
        label: 'Personalized recommendation',
      }}
      icon={Brain}
      variant="primary"
      showTrend={false}
      size="lg"
      onClick={onClick}
    />
  );
}

export function CalendarSyncWidget({
  syncStatus,
  nextEvent,
  onClick,
}: {
  syncStatus: 'connected' | 'disconnected' | 'syncing';
  nextEvent?: string;
  onClick?: () => void;
}) {
  const statusMap = {
    connected: { display: 'Connected', variant: 'success' as const },
    disconnected: { display: 'Disconnected', variant: 'danger' as const },
    syncing: { display: 'Syncing...', variant: 'warning' as const },
  };

  const status = statusMap[syncStatus];

  return (
    <AnalyticsWidget
      title="Calendar Status"
      metric={{
        value: status.display,
        label: nextEvent || 'No upcoming events',
      }}
      icon={Calendar}
      variant={status.variant}
      showTrend={false}
      onClick={onClick}
    />
  );
}
