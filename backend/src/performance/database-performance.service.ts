/**
 * Database Performance Monitor for ADHD-optimized query optimization
 * Provides real-time monitoring and optimization suggestions
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface QueryMetrics {
  query: string;
  duration: number;
  timestamp: Date;
  table: string;
  type: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
  rowsAffected?: number;
}

interface DatabasePerformanceMetrics {
  averageQueryTime: number;
  slowQueries: QueryMetrics[];
  queryCount: number;
  connectionPoolUsage: number;
  cacheHitRatio: number;
  slowQueryThreshold: number;
}

@Injectable()
export class DatabasePerformanceMonitor {
  private readonly logger = new Logger(DatabasePerformanceMonitor.name);
  private queryMetrics: QueryMetrics[] = [];
  private readonly maxMetricsSize = 1000;
  private readonly slowQueryThreshold = 100; // 100ms threshold for ADHD users

  constructor(private prisma: PrismaService) {
    this.setupQueryLogging();
  }

  private setupQueryLogging() {
    // Extend Prisma to log query performance
    this.prisma.$use(async (params, next) => {
      const before = Date.now();
      const result = await next(params);
      const after = Date.now();
      const duration = after - before;

      // Log query metrics
      const queryMetric: QueryMetrics = {
        query: `${params.action} ${params.model || 'unknown'}`,
        duration,
        timestamp: new Date(),
        table: params.model || 'unknown',
        type: this.getQueryType(params.action),
        rowsAffected: Array.isArray(result) ? result.length : 1,
      };

      this.addQueryMetric(queryMetric);

      // Log slow queries
      if (duration > this.slowQueryThreshold) {
        this.logger.warn(`Slow query detected: ${queryMetric.query} took ${duration}ms`);
      }

      return result;
    });
  }

  private getQueryType(action: string): 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' {
    switch (action.toLowerCase()) {
      case 'findmany':
      case 'findfirst':
      case 'findunique':
      case 'count':
      case 'aggregate':
        return 'SELECT';
      case 'create':
      case 'createmany':
        return 'INSERT';
      case 'update':
      case 'updatemany':
      case 'upsert':
        return 'UPDATE';
      case 'delete':
      case 'deletemany':
        return 'DELETE';
      default:
        return 'SELECT';
    }
  }

  private addQueryMetric(metric: QueryMetrics) {
    this.queryMetrics.push(metric);

    // Keep only recent metrics to prevent memory bloat
    if (this.queryMetrics.length > this.maxMetricsSize) {
      this.queryMetrics = this.queryMetrics.slice(-this.maxMetricsSize);
    }
  }

  /**
   * Get current database performance metrics
   */
  getMetrics(): DatabasePerformanceMetrics {
    const recentMetrics = this.queryMetrics.filter(
      metric => Date.now() - metric.timestamp.getTime() < 300000 // Last 5 minutes
    );

    const averageQueryTime =
      recentMetrics.length > 0
        ? recentMetrics.reduce((sum, metric) => sum + metric.duration, 0) / recentMetrics.length
        : 0;

    const slowQueries = recentMetrics.filter(metric => metric.duration > this.slowQueryThreshold);

    return {
      averageQueryTime: Math.round(averageQueryTime * 100) / 100,
      slowQueries: slowQueries.slice(-10), // Last 10 slow queries
      queryCount: recentMetrics.length,
      connectionPoolUsage: this.getConnectionPoolUsage(),
      cacheHitRatio: this.getCacheHitRatio(),
      slowQueryThreshold: this.slowQueryThreshold,
    };
  }

  /**
   * Get optimization suggestions based on current metrics
   */
  getOptimizationSuggestions(): string[] {
    const metrics = this.getMetrics();
    const suggestions: string[] = [];

    if (metrics.averageQueryTime > 50) {
      suggestions.push('Consider adding database indexes for frequently queried fields');
    }

    if (metrics.slowQueries.length > 5) {
      suggestions.push('Multiple slow queries detected - review query optimization');
    }

    if (metrics.connectionPoolUsage > 80) {
      suggestions.push('High connection pool usage - consider increasing pool size');
    }

    if (metrics.cacheHitRatio < 80) {
      suggestions.push('Low cache hit ratio - review caching strategy');
    }

    if (metrics.queryCount > 100) {
      suggestions.push('High query volume - consider implementing query batching');
    }

    return suggestions;
  }

  /**
   * Analyze query patterns for ADHD-specific optimizations
   */
  getADHDOptimizations(): string[] {
    const metrics = this.getMetrics();
    const suggestions: string[] = [];

    // Fast response times are critical for ADHD users
    if (metrics.averageQueryTime > 30) {
      suggestions.push('⚡ Reduce query response time below 30ms for better ADHD user experience');
    }

    // Predictable performance helps with focus
    const queryTimes = this.queryMetrics.slice(-50).map(m => m.duration);
    const standardDeviation = this.calculateStandardDeviation(queryTimes);
    if (standardDeviation > 20) {
      suggestions.push(
        '📊 High query time variance detected - implement query result caching for consistent performance'
      );
    }

    // Frequent small queries are better than large ones
    const largeQueries = this.queryMetrics.filter(m => m.rowsAffected && m.rowsAffected > 100);
    if (largeQueries.length > 5) {
      suggestions.push('🔍 Consider pagination for large result sets to maintain responsive UI');
    }

    return suggestions;
  }

  private calculateStandardDeviation(values: number[]): number {
    if (values.length === 0) return 0;

    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    const squaredDifferences = values.map(value => Math.pow(value - mean, 2));
    const avgSquaredDiff =
      squaredDifferences.reduce((sum, value) => sum + value, 0) / values.length;

    return Math.sqrt(avgSquaredDiff);
  }

  private getConnectionPoolUsage(): number {
    // This would typically integrate with your database connection pool
    // For now, return a simulated value
    return Math.random() * 100;
  }

  private getCacheHitRatio(): number {
    // This would typically integrate with your caching layer (Redis, etc.)
    // For now, return a simulated value
    return 85 + Math.random() * 15;
  }

  /**
   * Reset metrics (useful for testing or periodic cleanup)
   */
  resetMetrics() {
    this.queryMetrics = [];
    this.logger.log('Database performance metrics reset');
  }

  /**
   * Get detailed query analysis
   */
  getQueryAnalysis() {
    const metrics = this.queryMetrics.slice(-100); // Last 100 queries

    const queryTypeDistribution = metrics.reduce(
      (acc, metric) => {
        acc[metric.type] = (acc[metric.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const tableUsage = metrics.reduce(
      (acc, metric) => {
        acc[metric.table] = (acc[metric.table] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const hourlyDistribution = metrics.reduce(
      (acc, metric) => {
        const hour = metric.timestamp.getHours();
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      },
      {} as Record<number, number>
    );

    return {
      queryTypeDistribution,
      tableUsage,
      hourlyDistribution,
      totalQueries: metrics.length,
    };
  }
}
