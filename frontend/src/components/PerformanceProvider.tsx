/**
 * PerformanceProvider component for ADHD-optimized performance monitoring
 * Provides real-time performance insights and optimization suggestions
 */

'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { PerformanceErrorBoundary } from './PerformanceErrorBoundary';
import {
  usePerformanceMonitor,
  useRenderPerformance,
  useInteractionTracking,
  useBundleMonitor,
} from '@/hooks/usePerformanceMonitor';
import { useMemoryMonitor } from '@/lib/performance';
import {
  useServiceWorker,
  useNetworkStatus,
  useServiceWorkerPerformance,
} from '@/hooks/useServiceWorker';

interface RenderMetrics {
  slowRenders: number;
  averageTime: number;
  count: number;
}

interface InteractionMetrics {
  avgResponseTime: number;
  slowInteractions: number;
  totalInteractions: number;
}

interface PerformanceMetrics {
  lcp?: number;
  fid?: number;
  cls?: number;
  memoryInfo?: any;
}

interface PerformanceContextType {
  metrics: PerformanceMetrics | null;
  renderMetrics: RenderMetrics;
  interactionMetrics: InteractionMetrics;
  isSlowDevice: boolean;
  showPerformanceWarning: boolean;
  suggestions: string[];
  dismissWarning: () => void;
  clearMetrics: () => void;
  enableDebugMode: () => void;
  disableDebugMode: () => void;
  isDebugMode: boolean;
  performanceScore: number;
  violations: any[];
  bundleInfo: any;
  serviceWorker: {
    isRegistered: boolean;
    isOffline: boolean;
    updateAvailable: boolean;
    cacheHitRatio: number;
  };
}

const PerformanceContext = createContext<PerformanceContextType | null>(null);

export const usePerformanceContext = () => {
  const context = useContext(PerformanceContext);
  if (!context) {
    throw new Error('usePerformanceContext must be used within PerformanceProvider');
  }
  return context;
};

interface PerformanceProviderProps {
  children: React.ReactNode;
}

export const PerformanceProvider: React.FC<PerformanceProviderProps> = ({ children }) => {
  // Use real performance monitoring hooks
  const performanceData = usePerformanceMonitor();
  const renderData = useRenderPerformance('PerformanceProvider');
  const interactionData = useInteractionTracking();
  const memoryData = useMemoryMonitor();
  const bundleData = useBundleMonitor();

  // Service worker monitoring
  const serviceWorkerState = useServiceWorker();
  const isOnline = useNetworkStatus();
  const swPerformance = useServiceWorkerPerformance();

  // State management for UI features
  const [showPerformanceWarning, setShowPerformanceWarning] = useState(false);
  const [isDebugMode, setIsDebugMode] = useState(false);

  // Real metrics from monitoring hooks - stabilized dependencies
  const metrics: PerformanceMetrics = useMemo(() => {
    if (!performanceData.metrics) return {};

    return {
      lcp: performanceData.metrics.lcp,
      fid: performanceData.metrics.fid,
      cls: performanceData.metrics.cls,
      memoryInfo: memoryData,
    };
  }, [
    performanceData.metrics?.lcp,
    performanceData.metrics?.fid,
    performanceData.metrics?.cls,
    memoryData?.usedJSHeapSize, // Use specific memory property instead of full object
    memoryData?.isHigh,
  ]);

  // Real render metrics - stabilized dependencies
  const renderMetrics: RenderMetrics = useMemo(() => {
    if (!renderData) return { slowRenders: 0, averageTime: 0, count: 0 };

    return {
      slowRenders: renderData.slowRenders || 0,
      averageTime: renderData.averageTime || 0,
      count: renderData.count || 0,
    };
  }, [renderData?.slowRenders, renderData?.averageTime, renderData?.count]);

  // Real interaction metrics - stabilized dependencies
  const interactionMetrics: InteractionMetrics = useMemo(() => {
    if (!interactionData) return { avgResponseTime: 0, slowInteractions: 0, totalInteractions: 0 };

    return {
      avgResponseTime: interactionData.averageLatency || 0,
      slowInteractions: interactionData.slowInteractions || 0,
      totalInteractions: interactionData.totalInteractions || 0,
    };
  }, [
    interactionData?.averageLatency,
    interactionData?.slowInteractions,
    interactionData?.totalInteractions,
  ]);

  // Determine if device is slow based on real metrics - stabilized
  const isSlowDevice = useMemo(() => {
    const overallScore = performanceData.score?.overall || 100;
    const isHighMemory = memoryData?.isHigh || false;
    return overallScore < 50 || isHighMemory;
  }, [performanceData.score?.overall, memoryData?.isHigh]);

  // Generate real suggestions from monitoring data - stabilized
  const suggestions = useMemo(() => {
    const performanceRecommendations = performanceData.score?.recommendations || [];
    const bundleRecommendations = bundleData?.recommendations || [];

    return [...performanceRecommendations, ...bundleRecommendations];
  }, [
    performanceData.score?.recommendations?.length,
    bundleData?.recommendations?.length,
    // Use stable string representation for content changes
    (performanceData.score?.recommendations || []).join('|'),
    (bundleData?.recommendations || []).join('|'),
  ]);

  // Show warning when performance issues are detected - stabilized
  useEffect(() => {
    const overallScore = performanceData.score?.overall || 100;
    const violationsCount = performanceData.violations?.length || 0;
    const exceedsBudget = bundleData?.exceedsBudget || false;

    const hasPerformanceIssues = overallScore < 70 || violationsCount > 0 || exceedsBudget;

    if (hasPerformanceIssues && suggestions.length > 0) {
      setShowPerformanceWarning(true);
    }
  }, [
    performanceData.score?.overall,
    performanceData.violations?.length,
    bundleData?.exceedsBudget,
    suggestions.length,
  ]);

  // Auto-dismiss warning after 10 seconds (ADHD-friendly)
  useEffect(() => {
    if (showPerformanceWarning) {
      const timer = setTimeout(() => {
        setShowPerformanceWarning(false);
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [showPerformanceWarning]);

  // Debug mode keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + P to toggle performance debug mode
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'P') {
        event.preventDefault();
        setIsDebugMode(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const dismissWarning = useCallback(() => {
    setShowPerformanceWarning(false);
  }, []);

  const clearMetrics = useCallback(() => {
    // Clear suggestions - metrics are managed by hooks
    setShowPerformanceWarning(false);
  }, []);

  const enableDebugMode = useCallback(() => {
    setIsDebugMode(true);
  }, []);

  const disableDebugMode = useCallback(() => {
    setIsDebugMode(false);
  }, []);

  // Memoize context value to prevent unnecessary re-renders - stabilized dependencies
  const contextValue: PerformanceContextType = useMemo(
    () => ({
      metrics,
      renderMetrics,
      interactionMetrics,
      isSlowDevice,
      showPerformanceWarning,
      suggestions,
      dismissWarning,
      clearMetrics,
      enableDebugMode,
      disableDebugMode,
      isDebugMode,
      performanceScore: performanceData.score?.overall || 0,
      violations: performanceData.violations || [],
      bundleInfo: bundleData || {},
      serviceWorker: {
        isRegistered: serviceWorkerState?.isRegistered || false,
        isOffline: !isOnline,
        updateAvailable: serviceWorkerState?.updateAvailable || false,
        cacheHitRatio: swPerformance?.cacheHitRatio || 0,
      },
    }),
    [
      metrics,
      renderMetrics,
      interactionMetrics,
      isSlowDevice,
      showPerformanceWarning,
      suggestions,
      dismissWarning,
      clearMetrics,
      enableDebugMode,
      disableDebugMode,
      isDebugMode,
      performanceData.score?.overall,
      performanceData.violations?.length, // Use length instead of array reference
      bundleData?.exceedsBudget,
      bundleData?.totalSize,
      serviceWorkerState?.isRegistered,
      serviceWorkerState?.updateAvailable,
      isOnline,
      swPerformance?.cacheHitRatio,
    ]
  );

  return (
    <PerformanceErrorBoundary>
      <PerformanceContext.Provider value={contextValue}>
        {children}
        {/* Performance warning notification */}
        {showPerformanceWarning && suggestions.length > 0 && (
          <PerformanceWarning
            suggestions={suggestions}
            onDismiss={dismissWarning}
            isSlowDevice={isSlowDevice}
          />
        )}
        {/* Debug mode overlay */}
        {isDebugMode && (
          <PerformanceDebugOverlay
            metrics={metrics}
            renderMetrics={renderMetrics}
            interactionMetrics={interactionMetrics}
            onClose={disableDebugMode}
          />
        )}
      </PerformanceContext.Provider>
    </PerformanceErrorBoundary>
  );
};

/**
 * Performance warning notification component
 */
const PerformanceWarning: React.FC<{
  suggestions: string[];
  onDismiss: () => void;
  isSlowDevice: boolean;
}> = ({ suggestions, onDismiss, isSlowDevice }) => {
  return (
    <div className="fixed top-4 right-4 bg-yellow-500 text-yellow-900 p-4 rounded-lg shadow-lg z-50 max-w-md">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h4 className="font-medium">
            {isSlowDevice ? 'Performance Mode Enabled' : 'Performance Notice'}
          </h4>
          <div className="text-sm mt-1 space-y-1">
            {suggestions.slice(0, 2).map((suggestion, index) => (
              <p key={index}>• {suggestion}</p>
            ))}
            {suggestions.length > 2 && (
              <p className="text-yellow-700">+ {suggestions.length - 2} more suggestions</p>
            )}
          </div>
          <p className="text-xs text-yellow-700 mt-2">
            Press Ctrl+Shift+P for detailed performance metrics
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="flex-shrink-0 text-yellow-700 hover:text-yellow-900"
          aria-label="Dismiss notification"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

/**
 * Performance debug overlay component
 */
const PerformanceDebugOverlay: React.FC<{
  metrics: PerformanceMetrics | null;
  renderMetrics: RenderMetrics;
  interactionMetrics: InteractionMetrics;
  onClose: () => void;
}> = ({ metrics, renderMetrics, interactionMetrics, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Performance Debug</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label="Close debug overlay"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* Core Web Vitals */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Core Web Vitals</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                <div className="font-medium">LCP</div>
                <div
                  className={`text-lg ${(metrics?.lcp || 0) > 2500 ? 'text-red-500' : 'text-green-500'}`}
                >
                  {metrics?.lcp ? `${Math.round(metrics.lcp)}ms` : 'N/A'}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                <div className="font-medium">FID</div>
                <div
                  className={`text-lg ${(metrics?.fid || 0) > 100 ? 'text-red-500' : 'text-green-500'}`}
                >
                  {metrics?.fid ? `${Math.round(metrics.fid)}ms` : 'N/A'}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                <div className="font-medium">CLS</div>
                <div
                  className={`text-lg ${(metrics?.cls || 0) > 0.1 ? 'text-red-500' : 'text-green-500'}`}
                >
                  {metrics?.cls ? metrics.cls.toFixed(3) : 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Render Performance */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Render Performance</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                <div className="font-medium">Total Renders</div>
                <div className="text-lg">{renderMetrics?.count || 0}</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                <div className="font-medium">Slow Renders</div>
                <div
                  className={`text-lg ${(renderMetrics?.slowRenders || 0) > 5 ? 'text-red-500' : 'text-green-500'}`}
                >
                  {renderMetrics?.slowRenders || 0}
                </div>
              </div>
            </div>
          </div>

          {/* Interaction Performance */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Interactions</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                <div className="font-medium">Total Interactions</div>
                <div className="text-lg">{interactionMetrics?.totalInteractions || 0}</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                <div className="font-medium">Avg Response Time</div>
                <div
                  className={`text-lg ${(interactionMetrics?.avgResponseTime || 0) > 100 ? 'text-red-500' : 'text-green-500'}`}
                >
                  {Math.round(interactionMetrics?.avgResponseTime || 0)}ms
                </div>
              </div>
            </div>
          </div>

          {/* Memory Info */}
          {metrics?.memoryInfo && (
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Memory Usage</h3>
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded text-sm">
                <div className="flex justify-between">
                  <span>Used JS Heap:</span>
                  <span>{Math.round(metrics.memoryInfo.usedJSHeapSize / (1024 * 1024))}MB</span>
                </div>
                <div className="flex justify-between">
                  <span>Total JS Heap:</span>
                  <span>{Math.round(metrics.memoryInfo.totalJSHeapSize / (1024 * 1024))}MB</span>
                </div>
                <div className="flex justify-between">
                  <span>Heap Limit:</span>
                  <span>{Math.round(metrics.memoryInfo.jsHeapSizeLimit / (1024 * 1024))}MB</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PerformanceProvider;
