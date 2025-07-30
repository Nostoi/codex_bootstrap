/**
 * Performance monitoring hook for ADHD-optimized user experience
 * Tracks key metrics and provides actionable insights for smooth interactions
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { getPerformanceMonitor, PERFORMANCE_BUDGET, type PerformanceMetrics } from '@/lib/performance';

interface PerformanceState {
  metrics: PerformanceMetrics;
  isLoading: boolean;
  violations: PerformanceViolation[];
  score: PerformanceScore;
}

interface PerformanceViolation {
  metric: string;
  value: number;
  budget: number;
  timestamp: number;
  severity: 'warning' | 'critical';
}

interface PerformanceScore {
  overall: number; // 0-100
  lcp: number;
  fid: number;
  cls: number;
  recommendations: string[];
}

/**
 * Performance monitoring hook that tracks Web Vitals and provides ADHD-friendly insights
 * 
 * Features:
 * - Real-time performance metrics
 * - Performance budget violation tracking
 * - Actionable recommendations for optimization
 * - ADHD-specific performance considerations
 * 
 * @example
 * ```tsx
 * const { metrics, score, violations } = usePerformanceMonitor();
 * 
 * if (score.overall < 70) {
 *   console.warn('Performance issues detected that may frustrate ADHD users');
 * }
 * ```
 */
export const usePerformanceMonitor = () => {
  const [state, setState] = useState<PerformanceState>({
    metrics: {},
    isLoading: true,
    violations: [],
    score: {
      overall: 0,
      lcp: 0,
      fid: 0,
      cls: 0,
      recommendations: [],
    },
  });

  const violationsRef = useRef<PerformanceViolation[]>([]);

  // Calculate performance score based on Web Vitals
  const calculateScore = useCallback((metrics: PerformanceMetrics): PerformanceScore => {
    const scores = {
      lcp: metrics.lcp ? Math.max(0, 100 - (metrics.lcp / PERFORMANCE_BUDGET.LCP) * 100) : 0,
      fid: metrics.fid ? Math.max(0, 100 - (metrics.fid / PERFORMANCE_BUDGET.FID) * 100) : 0,
      cls: metrics.cls ? Math.max(0, 100 - (metrics.cls / PERFORMANCE_BUDGET.CLS) * 100) : 0,
    };

    const overall = (scores.lcp + scores.fid + scores.cls) / 3;

    const recommendations: string[] = [];

    // ADHD-specific performance recommendations
    if (scores.lcp < 70) {
      recommendations.push('Optimize loading speed - slow pages frustrate ADHD users');
    }
    if (scores.fid < 70) {
      recommendations.push('Improve interaction responsiveness - delays break ADHD focus');
    }
    if (scores.cls < 70) {
      recommendations.push('Reduce layout shifts - unexpected movement is disorienting');
    }
    if (overall < 50) {
      recommendations.push('Consider performance optimization as critical for ADHD accessibility');
    }

    return {
      overall: Math.round(overall),
      lcp: Math.round(scores.lcp),
      fid: Math.round(scores.fid),
      cls: Math.round(scores.cls),
      recommendations,
    };
  }, []);

  // Track performance violations
  const trackViolation = useCallback((metric: string, value: number, budget: number) => {
    const violation: PerformanceViolation = {
      metric,
      value,
      budget,
      timestamp: Date.now(),
      severity: value > budget * 2 ? 'critical' : 'warning',
    };

    violationsRef.current = [...violationsRef.current.slice(-9), violation]; // Keep last 10
    
    setState(prev => ({
      ...prev,
      violations: violationsRef.current,
    }));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const monitor = getPerformanceMonitor();
    
    // Update metrics and scores periodically
    const updateMetrics = () => {
      const metrics = monitor.getMetrics();
      const score = calculateScore(metrics);

      // Check for budget violations
      if (metrics.lcp && metrics.lcp > PERFORMANCE_BUDGET.LCP) {
        trackViolation('lcp', metrics.lcp, PERFORMANCE_BUDGET.LCP);
      }
      if (metrics.fid && metrics.fid > PERFORMANCE_BUDGET.FID) {
        trackViolation('fid', metrics.fid, PERFORMANCE_BUDGET.FID);
      }
      if (metrics.cls && metrics.cls > PERFORMANCE_BUDGET.CLS) {
        trackViolation('cls', metrics.cls, PERFORMANCE_BUDGET.CLS);
      }

      setState(prev => ({
        ...prev,
        metrics,
        score,
        isLoading: false,
      }));
    };

    // Initial update
    updateMetrics();

    // Periodic updates
    const interval = setInterval(updateMetrics, 2000);

    // Listen for navigation performance
    const handleNavigation = () => {
      setTimeout(updateMetrics, 100);
    };

    window.addEventListener('load', handleNavigation);

    return () => {
      clearInterval(interval);
      window.removeEventListener('load', handleNavigation);
    };
  }, [calculateScore, trackViolation]);

  return state;
};

/**
 * Hook to monitor component render performance
 * Useful for identifying slow components that could impact ADHD user experience
 * 
 * @param componentName Name of the component for debugging
 * @returns Render performance metrics
 */
export const useRenderPerformance = (componentName: string) => {
  const renderCountRef = useRef(0);
  const [renderStats, setRenderStats] = useState({
    count: 0,
    averageTime: 0,
    slowRenders: 0,
  });

  useEffect(() => {
    const startTime = performance.now();
    renderCountRef.current++;

    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      setRenderStats(prev => {
        const newCount = renderCountRef.current;
        const isSlowRender = renderTime > 16; // 60fps threshold
        
        return {
          count: newCount,
          averageTime: (prev.averageTime * (newCount - 1) + renderTime) / newCount,
          slowRenders: prev.slowRenders + (isSlowRender ? 1 : 0),
        };
      });

      // Log slow renders that could impact ADHD users
      if (renderTime > 16) {
        console.warn(
          `🐌 Slow render detected: ${componentName} took ${renderTime.toFixed(2)}ms. ` +
          'This may cause stuttering that frustrates ADHD users.'
        );
      }
    };
  });

  return renderStats;
};

/**
 * Hook to track user interaction latency
 * Critical for ADHD users who need immediate feedback
 * 
 * @returns Interaction tracking utilities
 */
export const useInteractionTracking = () => {
  const [interactions, setInteractions] = useState<{
    averageLatency: number;
    slowInteractions: number;
    totalInteractions: number;
  }>({
    averageLatency: 0,
    slowInteractions: 0,
    totalInteractions: 0,
  });

  const trackInteraction = useCallback((startTime: number) => {
    const endTime = performance.now();
    const latency = endTime - startTime;

    setInteractions(prev => {
      const newTotal = prev.totalInteractions + 1;
      const isSlowInteraction = latency > 100; // 100ms threshold

      return {
        averageLatency: (prev.averageLatency * prev.totalInteractions + latency) / newTotal,
        slowInteractions: prev.slowInteractions + (isSlowInteraction ? 1 : 0),
        totalInteractions: newTotal,
      };
    });

    // Log slow interactions that could frustrate ADHD users
    if (latency > 100) {
      console.warn(
        `⏱️ Slow interaction: ${latency.toFixed(2)}ms latency. ` +
        'ADHD users need immediate feedback to maintain focus.'
      );
    }

    return latency;
  }, []);

  const startInteraction = useCallback(() => {
    const startTime = performance.now();
    return () => trackInteraction(startTime);
  }, [trackInteraction]);

  return {
    ...interactions,
    startInteraction,
  };
};

/**
 * Hook to monitor bundle size and loading performance
 * Helps ensure fast initial loads for ADHD users
 */
export const useBundleMonitor = () => {
  const [bundleInfo, setBundleInfo] = useState<{
    isLoading: boolean;
    totalSize: number;
    initialSize: number;
    exceedsBudget: boolean;
    recommendations: string[];
  }>({
    isLoading: true,
    totalSize: 0,
    initialSize: 0,
    exceedsBudget: false,
    recommendations: [],
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const analyzeBundleSize = () => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      
      const jsResources = resources.filter(resource => 
        resource.name.includes('.js') && resource.transferSize
      );

      const totalSize = jsResources.reduce((total, resource) => 
        total + (resource.transferSize || 0), 0
      );

      const initialSize = jsResources
        .filter(resource => 
          resource.name.includes('_app') || 
          resource.name.includes('index') ||
          resource.name.includes('main')
        )
        .reduce((total, resource) => total + (resource.transferSize || 0), 0);

      const exceedsBudget = initialSize > PERFORMANCE_BUDGET.BUNDLE_SIZE_INITIAL;

      const recommendations: string[] = [];
      if (exceedsBudget) {
        recommendations.push('Initial bundle exceeds 500KB - implement code splitting');
        recommendations.push('Large bundles cause slow loads that frustrate ADHD users');
      }
      if (totalSize > PERFORMANCE_BUDGET.BUNDLE_SIZE_TOTAL) {
        recommendations.push('Total bundle exceeds 2MB - consider lazy loading');
      }

      setBundleInfo({
        isLoading: false,
        totalSize,
        initialSize,
        exceedsBudget,
        recommendations,
      });
    };

    // Analyze after initial load
    if (document.readyState === 'complete') {
      analyzeBundleSize();
    } else {
      window.addEventListener('load', analyzeBundleSize);
      return () => window.removeEventListener('load', analyzeBundleSize);
    }
  }, []);

  return bundleInfo;
};
