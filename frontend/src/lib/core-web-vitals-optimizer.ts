/**
 * Core Web Vitals Optimization Utilities
 * Phase 3 Item 15: Performance testing with Core Web Vitals optimization
 *
 * ADHD-Optimized Performance Standards:
 * - LCP < 2.0s (vs standard 2.5s) - Faster visual feedback
 * - FID < 50ms (vs standard 100ms) - Immediate responsiveness (Note: Using INP as FID replacement)
 * - CLS < 0.05 (vs standard 0.1) - Stable visual experience
 * - TTI < 3.0s - Cognitive load management
 */

import { onCLS, onLCP, onINP, onTTFB, type Metric } from 'web-vitals';

export interface ADHDPerformanceConfig {
  thresholds: {
    lcp: { good: number; needsImprovement: number; poor: number };
    fid: { good: number; needsImprovement: number; poor: number };
    cls: { good: number; needsImprovement: number; poor: number };
    ttfb: { good: number; needsImprovement: number; poor: number };
  };
  targets: {
    lcp: number;
    fid: number;
    cls: number;
    ttfb: number;
  };
}

export interface PerformanceReport {
  timestamp: string;
  metrics: {
    lcp: number | null;
    fid: number | null;
    cls: number | null;
    ttfb: number | null;
  };
  grades: {
    lcp: PerformanceGrade;
    fid: PerformanceGrade;
    cls: PerformanceGrade;
    overall: PerformanceGrade;
  };
  adhdOptimized: boolean;
  recommendations: string[];
}

export type PerformanceGrade = 'good' | 'needs-improvement' | 'poor';

// ADHD-optimized performance configuration
export const ADHD_PERFORMANCE_CONFIG: ADHDPerformanceConfig = {
  thresholds: {
    lcp: { good: 2000, needsImprovement: 3000, poor: 4000 }, // Stricter than standard
    fid: { good: 50, needsImprovement: 100, poor: 300 }, // Stricter than standard
    cls: { good: 0.05, needsImprovement: 0.1, poor: 0.25 }, // Stricter than standard
    ttfb: { good: 800, needsImprovement: 1200, poor: 1800 }, // Standard thresholds
  },
  targets: {
    lcp: 1500, // Target even stricter than good threshold
    fid: 30, // Target immediate responsiveness
    cls: 0.02, // Target near-zero layout shift
    ttfb: 600, // Target fast server response
  },
};

/**
 * Core Web Vitals monitoring class with ADHD optimizations
 */
export class CoreWebVitalsOptimizer {
  private metrics: PerformanceReport['metrics'] = {
    lcp: null,
    fid: null,
    cls: null,
    ttfb: null,
  };

  private observers: PerformanceObserver[] = [];
  private onReportCallback?: (report: PerformanceReport) => void;

  constructor(onReport?: (report: PerformanceReport) => void) {
    this.onReportCallback = onReport;
  }

  /**
   * Start monitoring Core Web Vitals with ADHD-optimized thresholds
   */
  startMonitoring(): void {
    // Monitor LCP (Largest Contentful Paint)
    onLCP((metric: Metric) => {
      this.metrics.lcp = metric.value;
      this.reportIfComplete();
    });

    // Monitor INP (Interaction to Next Paint) - replaces FID
    onINP((metric: Metric) => {
      this.metrics.fid = metric.value;
      this.reportIfComplete();
    });

    // Monitor CLS (Cumulative Layout Shift)
    onCLS((metric: Metric) => {
      this.metrics.cls = metric.value;
      this.reportIfComplete();
    });

    // Monitor TTFB (Time to First Byte)
    onTTFB((metric: Metric) => {
      this.metrics.ttfb = metric.value;
      this.reportIfComplete();
    });

    console.log('Core Web Vitals monitoring started with ADHD-optimized thresholds');
  }

  /**
   * Stop monitoring and cleanup observers
   */
  stopMonitoring(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    console.log('Core Web Vitals monitoring stopped');
  }

  /**
   * Get current performance report
   */
  getReport(): PerformanceReport {
    return this.generateReport();
  }

  /**
   * Generate performance grade for a metric
   */
  private getGrade(
    metric: number | null,
    thresholds: { good: number; needsImprovement: number }
  ): PerformanceGrade {
    if (metric === null) return 'poor';
    if (metric <= thresholds.good) return 'good';
    if (metric <= thresholds.needsImprovement) return 'needs-improvement';
    return 'poor';
  }

  /**
   * Generate performance recommendations based on metrics
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const { lcp, fid, cls } = this.metrics;
    const { thresholds } = ADHD_PERFORMANCE_CONFIG;

    if (lcp && lcp > thresholds.lcp.good) {
      recommendations.push(
        `LCP is ${lcp}ms (target: ${ADHD_PERFORMANCE_CONFIG.targets.lcp}ms). ` +
          'Optimize images, reduce server response time, and eliminate render-blocking resources.'
      );
    }

    if (fid && fid > thresholds.fid.good) {
      recommendations.push(
        `FID is ${fid}ms (target: ${ADHD_PERFORMANCE_CONFIG.targets.fid}ms). ` +
          'Reduce JavaScript execution time, break up long tasks, and optimize event handlers.'
      );
    }

    if (cls && cls > thresholds.cls.good) {
      recommendations.push(
        `CLS is ${cls.toFixed(3)} (target: ${ADHD_PERFORMANCE_CONFIG.targets.cls}). ` +
          'Set dimensions for images and embeds, avoid inserting content above existing content.'
      );
    }

    // ADHD-specific recommendations
    if (recommendations.length > 0) {
      recommendations.push(
        'Performance issues can significantly impact ADHD users who rely on predictable, fast interactions.'
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('Excellent! All Core Web Vitals meet ADHD-optimized standards.');
    }

    return recommendations;
  }

  /**
   * Generate complete performance report
   */
  private generateReport(): PerformanceReport {
    const { thresholds } = ADHD_PERFORMANCE_CONFIG;
    const { lcp, fid, cls, ttfb } = this.metrics;

    const grades = {
      lcp: this.getGrade(lcp, thresholds.lcp),
      fid: this.getGrade(fid, thresholds.fid),
      cls: this.getGrade(cls, thresholds.cls),
      overall: 'good' as PerformanceGrade,
    };

    // Calculate overall grade (worst of the three core metrics)
    const coreGrades = [grades.lcp, grades.fid, grades.cls];
    if (coreGrades.includes('poor')) {
      grades.overall = 'poor';
    } else if (coreGrades.includes('needs-improvement')) {
      grades.overall = 'needs-improvement';
    }

    return {
      timestamp: new Date().toISOString(),
      metrics: { ...this.metrics },
      grades,
      adhdOptimized: true,
      recommendations: this.generateRecommendations(),
    };
  }

  /**
   * Report if all metrics are collected
   */
  private reportIfComplete(): void {
    const { lcp, fid, cls } = this.metrics;

    // Report when we have the core metrics (TTFB is supplementary)
    if (lcp !== null && fid !== null && cls !== null && this.onReportCallback) {
      const report = this.generateReport();
      this.onReportCallback(report);
    }
  }
}

/**
 * Utility function to measure Core Web Vitals once
 */
export function measureCoreWebVitals(): Promise<PerformanceReport> {
  return new Promise(resolve => {
    const optimizer = new CoreWebVitalsOptimizer(report => {
      optimizer.stopMonitoring();
      resolve(report);
    });

    optimizer.startMonitoring();

    // Timeout after 30 seconds if not all metrics are collected
    setTimeout(() => {
      const report = optimizer.getReport();
      optimizer.stopMonitoring();
      resolve(report);
    }, 30000);
  });
}

/**
 * Performance optimization recommendations for ADHD users
 */
export const ADHD_PERFORMANCE_TIPS = {
  lcp: [
    'Optimize images with WebP format and appropriate sizing',
    'Use CDN for faster content delivery',
    'Implement critical CSS and defer non-critical styles',
    'Preload key resources above the fold',
    'Minimize server response time',
  ],
  fid: [
    'Break up long JavaScript tasks using setTimeout or requestIdleCallback',
    'Use code splitting to reduce main thread blocking',
    'Defer non-essential JavaScript',
    'Optimize event handlers for immediate response',
    'Implement service worker for caching',
  ],
  cls: [
    'Set explicit dimensions for images and videos',
    'Reserve space for ads and embeds',
    'Avoid inserting content above existing content',
    'Use CSS aspect-ratio for responsive media',
    'Load fonts with font-display: swap',
  ],
  general: [
    'ADHD users benefit from predictable, fast interactions',
    'Avoid sudden layout changes that can be disorienting',
    'Provide immediate visual feedback for all interactions',
    'Consider reduced motion preferences',
    'Test performance on mobile devices and slower networks',
  ],
};

/**
 * Export performance budget for use in bundler configuration
 */
export const PERFORMANCE_BUDGET = {
  maxAssetSize: 400 * 1024, // 400KB (stricter than default 500KB)
  maxEntrypointSize: 400 * 1024, // 400KB
  maxChunkSize: 200 * 1024, // 200KB
  hints: 'error' as const, // Fail build on budget violations
};
