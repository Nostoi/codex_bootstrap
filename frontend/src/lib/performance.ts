/**
 * Performance utilities and monitoring for ADHD-optimized user experience
 * Focuses on fast load times and smooth interactions to prevent user frustration
 */

import { useState, useEffect, useCallback } from 'react';

// Performance budget thresholds for ADHD-friendly experience
export const PERFORMANCE_BUDGET = {
  LCP: 2500, // Largest Contentful Paint < 2.5s
  FID: 100, // First Input Delay < 100ms
  CLS: 0.1, // Cumulative Layout Shift < 0.1
  BUNDLE_SIZE_INITIAL: 500 * 1024, // 500KB initial bundle
  BUNDLE_SIZE_TOTAL: 2 * 1024 * 1024, // 2MB total
} as const;

// Web Vitals interface
interface WebVitals {
  name: string;
  value: number;
  delta: number;
  id: string;
  rating: 'good' | 'needs-improvement' | 'poor';
}

// Performance metrics interface
interface PerformanceMetrics {
  lcp?: number;
  fid?: number;
  cls?: number;
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte
}

// Performance monitoring class
export class PerformanceMonitor {
  private metrics: PerformanceMetrics = {};
  private observers: Map<string, PerformanceObserver> = new Map();

  constructor() {
    // Only initialize observers on the client side
    if (typeof window !== 'undefined') {
      this.initializeObservers();
    }
  }

  private initializeObservers() {
    // Guard against SSR
    if (typeof window === 'undefined') return;

    // Largest Contentful Paint observer
    if (
      'PerformanceObserver' in window &&
      PerformanceObserver.supportedEntryTypes?.includes('largest-contentful-paint')
    ) {
      const lcpObserver = new PerformanceObserver(list => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry & { size?: number };
        this.metrics.lcp = lastEntry.startTime;
        this.checkPerformanceBudget('lcp', lastEntry.startTime);
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      this.observers.set('lcp', lcpObserver);
    }

    // First Input Delay observer
    if (
      'PerformanceObserver' in window &&
      PerformanceObserver.supportedEntryTypes?.includes('first-input')
    ) {
      const fidObserver = new PerformanceObserver(list => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          const fidEntry = entry as PerformanceEntry & { processingStart?: number };
          if (fidEntry.processingStart) {
            const fid = fidEntry.processingStart - entry.startTime;
            this.metrics.fid = fid;
            this.checkPerformanceBudget('fid', fid);
          }
        });
      });
      fidObserver.observe({ type: 'first-input', buffered: true });
      this.observers.set('fid', fidObserver);
    }

    // Layout Shift observer
    if (
      'PerformanceObserver' in window &&
      PerformanceObserver.supportedEntryTypes?.includes('layout-shift')
    ) {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver(list => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          const lsEntry = entry as PerformanceEntry & { value?: number; hadRecentInput?: boolean };
          if (lsEntry.value && !lsEntry.hadRecentInput) {
            clsValue += lsEntry.value;
            this.metrics.cls = clsValue;
            this.checkPerformanceBudget('cls', clsValue);
          }
        });
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
      this.observers.set('cls', clsObserver);
    }
  }

  private checkPerformanceBudget(metric: string, value: number) {
    const budgets = {
      lcp: PERFORMANCE_BUDGET.LCP,
      fid: PERFORMANCE_BUDGET.FID,
      cls: PERFORMANCE_BUDGET.CLS,
    };

    const budget = budgets[metric as keyof typeof budgets];
    if (budget && value > budget) {
      console.warn(`⚠️ Performance Budget Exceeded: ${metric.toUpperCase()} ${value} > ${budget}`);
      // Track performance budget violations for ADHD UX optimization
      this.trackPerformanceViolation(metric, value, budget);
    }
  }

  private trackPerformanceViolation(metric: string, value: number, budget: number) {
    // In production, this would send metrics to analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'performance_budget_violation', {
        metric_name: metric,
        metric_value: value,
        budget_value: budget,
        overage: value - budget,
      });
    }
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }
}

// Singleton performance monitor instance
let performanceMonitor: PerformanceMonitor | null = null;

export const getPerformanceMonitor = (): PerformanceMonitor => {
  if (!performanceMonitor && typeof window !== 'undefined') {
    performanceMonitor = new PerformanceMonitor();
  }
  return performanceMonitor!;
};

// React hook for performance monitoring
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({});

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const monitor = getPerformanceMonitor();

    // Update metrics periodically
    const interval = setInterval(() => {
      setMetrics(monitor.getMetrics());
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return metrics;
};

// Utility to measure component render time
export const measureRenderTime = <T extends any[]>(
  componentName: string,
  fn: (...args: T) => React.ReactElement
) => {
  return (...args: T): React.ReactElement => {
    const startTime = performance.now();
    const result = fn(...args);
    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Log slow renders (>16ms for 60fps)
    if (renderTime > 16) {
      console.warn(`🐌 Slow render: ${componentName} took ${renderTime.toFixed(2)}ms`);
    }

    return result;
  };
};

// Bundle size analysis utilities
export const analyzeBundleSize = async () => {
  if (typeof window === 'undefined') return null;

  try {
    // Get navigation timing for initial bundle size estimation
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

    const jsResources = resources.filter(
      resource => resource.name.includes('.js') && resource.transferSize
    );

    const totalJSSize = jsResources.reduce(
      (total, resource) => total + (resource.transferSize || 0),
      0
    );

    const analysis = {
      totalJSSize,
      initialBundleSize: jsResources
        .filter(resource => resource.name.includes('_app') || resource.name.includes('index'))
        .reduce((total, resource) => total + (resource.transferSize || 0), 0),
      exceedsBudget: {
        initial: totalJSSize > PERFORMANCE_BUDGET.BUNDLE_SIZE_INITIAL,
        total: totalJSSize > PERFORMANCE_BUDGET.BUNDLE_SIZE_TOTAL,
      },
      recommendations: [] as string[],
    };

    // Generate recommendations for ADHD-friendly performance
    if (analysis.exceedsBudget.initial) {
      analysis.recommendations.push('Consider code splitting to reduce initial bundle size');
    }
    if (analysis.exceedsBudget.total) {
      analysis.recommendations.push('Implement lazy loading for non-critical components');
    }

    return analysis;
  } catch (error) {
    console.error('Bundle size analysis failed:', error);
    return null;
  }
};

// Memory usage monitoring for smooth ADHD user experience
export const useMemoryMonitor = () => {
  const [memoryInfo, setMemoryInfo] = useState<{
    usedJSHeapSize?: number;
    totalJSHeapSize?: number;
    jsHeapSizeLimit?: number;
    isHigh?: boolean;
  }>({});

  useEffect(() => {
    if (typeof window === 'undefined' || !('memory' in performance)) return;

    const checkMemory = () => {
      const memory = (performance as any).memory;
      const info = {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        isHigh: memory.usedJSHeapSize / memory.jsHeapSizeLimit > 0.8,
      };

      setMemoryInfo(info);

      // Warn about high memory usage that could impact ADHD users
      if (info.isHigh) {
        console.warn(
          '⚠️ High memory usage detected. This may cause performance issues for ADHD users.'
        );
      }
    };

    checkMemory();
    const interval = setInterval(checkMemory, 5000);

    return () => clearInterval(interval);
  }, []);

  return memoryInfo;
};

// Web Vitals reporting for production monitoring
export const reportWebVitals = (metric: WebVitals) => {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`📊 Web Vital: ${metric.name}`, {
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
    });
  }

  // Send to analytics in production
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', metric.name, {
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      event_category: 'Web Vitals',
      event_label: metric.id,
      non_interaction: true,
    });
  }
};

// Component preloading for better perceived performance
export const preloadComponent = (componentImport: () => Promise<any>) => {
  if (typeof window !== 'undefined') {
    // Use requestIdleCallback if available, fallback to setTimeout
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        componentImport();
      });
    } else {
      setTimeout(() => {
        componentImport();
      }, 1);
    }
  }
};

/**
 * Custom hook for lazy loading with Intersection Observer
 * Optimized for ADHD users with appropriate thresholds
 */
export const useLazyLoad = (threshold: number = 0.1) => {
  const [elementRef, setElementRef] = useState<HTMLDivElement | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    if (!elementRef) return;

    // Check if Intersection Observer is supported
    if (!('IntersectionObserver' in window)) {
      // Fallback: assume element is visible
      setIsIntersecting(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          // Once intersecting, stop observing for performance
          observer.unobserve(elementRef);
        }
      },
      {
        threshold,
        // Use root margin for early loading (ADHD-friendly)
        rootMargin: '50px 0px 50px 0px',
      }
    );

    observer.observe(elementRef);

    return () => {
      observer.disconnect();
    };
  }, [elementRef, threshold]);

  return { elementRef: setElementRef, isIntersecting };
};
