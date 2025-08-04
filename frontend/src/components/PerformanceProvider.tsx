/**
 * PerformanceProvider component for ADHD-optimized performance monitoring
 * Provides real-time performance insights and optimization suggestions
 */

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import type { PerformanceMetrics, RenderMetrics, InteractionMetrics } from '@/hooks/usePerformanceMonitor';

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
  const {
    metrics,
    renderMetrics,
    interactionMetrics,
    isSlowDevice,
    clearMetrics: clearPerformanceMetrics,
  } = usePerformanceMonitor();

  const [showPerformanceWarning, setShowPerformanceWarning] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [hasShownWarning, setHasShownWarning] = useState(false);

  // Analyze performance and generate suggestions
  useEffect(() => {
    if (!metrics) return;

    const newSuggestions: string[] = [];
    let shouldShowWarning = false;

    // Check Core Web Vitals
    if (metrics.lcp && metrics.lcp > 2500) {
      newSuggestions.push('Large Contentful Paint is slow. Consider optimizing images and fonts.');
      shouldShowWarning = true;
    }

    if (metrics.fid && metrics.fid > 100) {
      newSuggestions.push('First Input Delay is high. Consider reducing JavaScript execution time.');
      shouldShowWarning = true;
    }

    if (metrics.cls && metrics.cls > 0.1) {
      newSuggestions.push('Cumulative Layout Shift is high. Ensure elements have stable layouts.');
      shouldShowWarning = true;
    }

    // Check render performance
    if (renderMetrics?.slowRenders && renderMetrics.slowRenders > 5) {
      newSuggestions.push('Multiple slow renders detected. Consider using React.memo or useMemo.');
      shouldShowWarning = true;
    }

    // Check interaction performance
    if (interactionMetrics?.avgResponseTime && interactionMetrics.avgResponseTime > 100) {
      newSuggestions.push('Interaction responses are slow. Consider debouncing user inputs.');
      shouldShowWarning = true;
    }

    // Check memory usage
    if (metrics.memoryInfo && metrics.memoryInfo.usedJSHeapSize > 100 * 1024 * 1024) { // 100MB
      newSuggestions.push('High memory usage detected. Consider cleanup in useEffect hooks.');
      shouldShowWarning = true;
    }

    // ADHD-specific optimizations
    if (isSlowDevice) {
      newSuggestions.push('Slow device detected. Enabling performance mode for better ADHD experience.');
      shouldShowWarning = true;
    }

    setSuggestions(newSuggestions);

    // Show warning only once per session for ADHD users (avoid overwhelming)
    if (shouldShowWarning && !hasShownWarning) {
      setShowPerformanceWarning(true);
      setHasShownWarning(true);
    }
  }, [metrics, renderMetrics, interactionMetrics, isSlowDevice, hasShownWarning]);

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

  const dismissWarning = () => {
    setShowPerformanceWarning(false);
  };

  const clearMetrics = () => {
    clearPerformanceMetrics();
    setSuggestions([]);
    setHasShownWarning(false);
  };

  const enableDebugMode = () => {
    setIsDebugMode(true);
  };

  const disableDebugMode = () => {
    setIsDebugMode(false);
  };

  const contextValue: PerformanceContextType = {
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
  };

  return (
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
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
              <p className="text-yellow-700">
                + {suggestions.length - 2} more suggestions
              </p>
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
                <div className={`text-lg ${(metrics?.lcp || 0) > 2500 ? 'text-red-500' : 'text-green-500'}`}>
                  {metrics?.lcp ? `${Math.round(metrics.lcp)}ms` : 'N/A'}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                <div className="font-medium">FID</div>
                <div className={`text-lg ${(metrics?.fid || 0) > 100 ? 'text-red-500' : 'text-green-500'}`}>
                  {metrics?.fid ? `${Math.round(metrics.fid)}ms` : 'N/A'}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                <div className="font-medium">CLS</div>
                <div className={`text-lg ${(metrics?.cls || 0) > 0.1 ? 'text-red-500' : 'text-green-500'}`}>
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
                <div className="text-lg">{renderMetrics?.totalRenders || 0}</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                <div className="font-medium">Slow Renders</div>
                <div className={`text-lg ${(renderMetrics?.slowRenders || 0) > 5 ? 'text-red-500' : 'text-green-500'}`}>
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
                <div className={`text-lg ${(interactionMetrics?.avgResponseTime || 0) > 100 ? 'text-red-500' : 'text-green-500'}`}>
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
