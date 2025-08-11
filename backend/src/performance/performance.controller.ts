/**
 * Performance Controller for exposing performance metrics and optimization data
 * Provides ADHD-optimized performance insights
 */

import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { DatabasePerformanceMonitor } from './database-performance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/performance')
@UseGuards(JwtAuthGuard)
export class PerformanceController {
  constructor(private readonly dbPerformance: DatabasePerformanceMonitor) {}

  /**
   * Get current database performance metrics
   */
  @Get('database')
  getDatabaseMetrics() {
    return {
      metrics: this.dbPerformance.getMetrics(),
      suggestions: this.dbPerformance.getOptimizationSuggestions(),
      adhdOptimizations: this.dbPerformance.getADHDOptimizations(),
      analysis: this.dbPerformance.getQueryAnalysis(),
    };
  }

  /**
   * Get comprehensive performance overview
   */
  @Get('overview')
  getPerformanceOverview() {
    const dbMetrics = this.dbPerformance.getMetrics();

    return {
      status: this.getOverallStatus(dbMetrics),
      database: {
        averageQueryTime: dbMetrics.averageQueryTime,
        slowQueries: dbMetrics.slowQueries.length,
        connectionPoolUsage: dbMetrics.connectionPoolUsage,
        cacheHitRatio: dbMetrics.cacheHitRatio,
      },
      suggestions: this.dbPerformance.getOptimizationSuggestions(),
      adhdOptimizations: this.dbPerformance.getADHDOptimizations(),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get performance alerts for ADHD users
   */
  @Get('alerts')
  getPerformanceAlerts() {
    const dbMetrics = this.dbPerformance.getMetrics();
    const alerts = [];

    // Critical alerts for ADHD users (need immediate attention)
    if (dbMetrics.averageQueryTime > 100) {
      alerts.push({
        level: 'critical',
        type: 'slow_queries',
        message: '🚨 Critical: Database queries are too slow for ADHD users',
        impact: 'High - May cause user frustration and task abandonment',
        action: 'Optimize slow queries immediately',
      });
    }

    // Warning alerts
    if (dbMetrics.averageQueryTime > 50) {
      alerts.push({
        level: 'warning',
        type: 'performance_degradation',
        message: '⚠️ Warning: Query performance is degrading',
        impact: 'Medium - May affect user focus and productivity',
        action: 'Review and optimize database queries',
      });
    }

    if (dbMetrics.connectionPoolUsage > 80) {
      alerts.push({
        level: 'warning',
        type: 'high_connection_usage',
        message: '⚠️ Warning: High database connection usage',
        impact: 'Medium - May cause connection timeouts',
        action: 'Consider increasing connection pool size',
      });
    }

    // Info alerts
    if (dbMetrics.cacheHitRatio < 80) {
      alerts.push({
        level: 'info',
        type: 'low_cache_hit',
        message: 'ℹ️ Info: Cache hit ratio could be improved',
        impact: 'Low - Minor performance optimization opportunity',
        action: 'Review caching strategy',
      });
    }

    return {
      alerts,
      totalAlerts: alerts.length,
      criticalAlerts: alerts.filter(a => a.level === 'critical').length,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get performance recommendations specifically for ADHD users
   */
  @Get('adhd-recommendations')
  getADHDRecommendations() {
    const dbMetrics = this.dbPerformance.getMetrics();
    const recommendations = [];

    // Fast response recommendations
    if (dbMetrics.averageQueryTime > 30) {
      recommendations.push({
        category: 'response_time',
        priority: 'high',
        title: 'Optimize for ADHD Response Times',
        description: 'ADHD users benefit from sub-30ms query response times to maintain focus',
        actions: [
          'Add indexes to frequently queried columns',
          'Implement query result caching',
          'Consider database query optimization',
          'Use database connection pooling',
        ],
        expectedImprovement: 'Reduce cognitive load and improve task completion rates',
      });
    }

    // Predictable performance
    const recentQueries = this.dbPerformance.getMetrics().slowQueries;
    if (recentQueries.length > 3) {
      recommendations.push({
        category: 'consistency',
        priority: 'medium',
        title: 'Improve Performance Consistency',
        description: 'Consistent performance helps ADHD users maintain focus and reduces anxiety',
        actions: [
          'Implement query performance monitoring',
          'Add database query caching',
          'Optimize variable query performance',
          'Set up performance alerts',
        ],
        expectedImprovement: 'More predictable user experience with reduced frustration',
      });
    }

    // Data loading strategies
    recommendations.push({
      category: 'data_loading',
      priority: 'medium',
      title: 'ADHD-Friendly Data Loading',
      description: 'Progressive data loading reduces cognitive overload for ADHD users',
      actions: [
        'Implement pagination for large datasets',
        'Add loading states with progress indicators',
        'Use skeleton loading patterns',
        'Implement infinite scroll for long lists',
      ],
      expectedImprovement: 'Reduced cognitive load and improved task focus',
    });

    return {
      recommendations,
      totalRecommendations: recommendations.length,
      implementationPriority: recommendations.sort((a, b) => {
        const priority: Record<string, number> = { high: 3, medium: 2, low: 1 };
        return priority[b.priority] - priority[a.priority];
      }),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Reset performance metrics (admin only)
   */
  @Post('reset')
  resetMetrics() {
    this.dbPerformance.resetMetrics();
    return {
      message: 'Performance metrics reset successfully',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get real-time performance status
   */
  @Get('status')
  getPerformanceStatus() {
    const dbMetrics = this.dbPerformance.getMetrics();
    const status = this.getOverallStatus(dbMetrics);

    return {
      status,
      healthy: status === 'excellent' || status === 'good',
      metrics: {
        queryTime: dbMetrics.averageQueryTime,
        slowQueries: dbMetrics.slowQueries.length,
        cacheHit: dbMetrics.cacheHitRatio,
      },
      timestamp: new Date().toISOString(),
    };
  }

  private getOverallStatus(dbMetrics: any): string {
    if (dbMetrics.averageQueryTime > 100) return 'critical';
    if (dbMetrics.averageQueryTime > 50) return 'warning';
    if (dbMetrics.averageQueryTime > 30) return 'good';
    return 'excellent';
  }
}
