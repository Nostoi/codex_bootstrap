/**
 * Performance Testing Component
 * Phase 3 Item 15: Performance testing with Core Web Vitals optimization
 *
 * Real-time Core Web Vitals monitoring for ADHD-optimized performance
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  CoreWebVitalsOptimizer,
  type PerformanceReport,
  ADHD_PERFORMANCE_CONFIG,
} from '@/lib/core-web-vitals-optimizer';

interface PerformanceTestingProps {
  autoStart?: boolean;
  showRecommendations?: boolean;
  className?: string;
}

export function PerformanceTesting({
  autoStart = true,
  showRecommendations = true,
  className = '',
}: PerformanceTestingProps) {
  const [report, setReport] = useState<PerformanceReport | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [optimizer, setOptimizer] = useState<CoreWebVitalsOptimizer | null>(null);

  useEffect(() => {
    const webVitalsOptimizer = new CoreWebVitalsOptimizer(newReport => {
      setReport(newReport);
      console.log('Core Web Vitals Report:', newReport);
    });

    setOptimizer(webVitalsOptimizer);

    if (autoStart) {
      webVitalsOptimizer.startMonitoring();
      setIsMonitoring(true);
    }

    return () => {
      webVitalsOptimizer.stopMonitoring();
    };
  }, [autoStart]);

  const startMonitoring = () => {
    if (optimizer && !isMonitoring) {
      optimizer.startMonitoring();
      setIsMonitoring(true);
    }
  };

  const stopMonitoring = () => {
    if (optimizer && isMonitoring) {
      optimizer.stopMonitoring();
      setIsMonitoring(false);
    }
  };

  const getMetricColor = (grade: string) => {
    switch (grade) {
      case 'good':
        return 'text-green-600 bg-green-100';
      case 'needs-improvement':
        return 'text-yellow-600 bg-yellow-100';
      case 'poor':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getOverallColor = (grade: string) => {
    switch (grade) {
      case 'good':
        return 'border-green-200 bg-green-50';
      case 'needs-improvement':
        return 'border-yellow-200 bg-yellow-50';
      case 'poor':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Core Web Vitals Monitor</h2>
          <p className="text-sm text-gray-600">
            ADHD-optimized performance monitoring with stricter thresholds
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={startMonitoring}
            disabled={isMonitoring}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isMonitoring ? 'Monitoring...' : 'Start Monitor'}
          </button>
          <button
            onClick={stopMonitoring}
            disabled={!isMonitoring}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Stop
          </button>
        </div>
      </div>

      {/* Performance Metrics */}
      {report && (
        <div className={`border rounded-lg p-6 ${getOverallColor(report.grades.overall)}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Performance Report</h3>
            <div
              className={`px-3 py-1 rounded-full text-sm font-medium ${getMetricColor(report.grades.overall)}`}
            >
              Overall: {report.grades.overall.replace('-', ' ').toUpperCase()}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* LCP Metric */}
            <div className="bg-white rounded-lg p-4 border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">LCP</span>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${getMetricColor(report.grades.lcp)}`}
                >
                  {report.grades.lcp}
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {report.metrics.lcp ? `${Math.round(report.metrics.lcp)}ms` : 'N/A'}
              </div>
              <div className="text-xs text-gray-500">
                Target: {ADHD_PERFORMANCE_CONFIG.targets.lcp}ms
              </div>
            </div>

            {/* FID/INP Metric */}
            <div className="bg-white rounded-lg p-4 border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">INP</span>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${getMetricColor(report.grades.fid)}`}
                >
                  {report.grades.fid}
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {report.metrics.fid ? `${Math.round(report.metrics.fid)}ms` : 'N/A'}
              </div>
              <div className="text-xs text-gray-500">
                Target: {ADHD_PERFORMANCE_CONFIG.targets.fid}ms
              </div>
            </div>

            {/* CLS Metric */}
            <div className="bg-white rounded-lg p-4 border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">CLS</span>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${getMetricColor(report.grades.cls)}`}
                >
                  {report.grades.cls}
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {report.metrics.cls ? report.metrics.cls.toFixed(3) : 'N/A'}
              </div>
              <div className="text-xs text-gray-500">
                Target: {ADHD_PERFORMANCE_CONFIG.targets.cls}
              </div>
            </div>

            {/* TTFB Metric */}
            <div className="bg-white rounded-lg p-4 border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">TTFB</span>
                <span className="px-2 py-1 rounded text-xs font-medium text-gray-600 bg-gray-100">
                  info
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {report.metrics.ttfb ? `${Math.round(report.metrics.ttfb)}ms` : 'N/A'}
              </div>
              <div className="text-xs text-gray-500">
                Target: {ADHD_PERFORMANCE_CONFIG.targets.ttfb}ms
              </div>
            </div>
          </div>

          {/* ADHD Optimization Badge */}
          <div className="flex items-center space-x-2 mb-4">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              🧠 ADHD Optimized
            </span>
            <span className="text-sm text-gray-600">
              Stricter thresholds for cognitive accessibility
            </span>
          </div>

          {/* Timestamp */}
          <div className="text-xs text-gray-500">
            Last updated: {new Date(report.timestamp).toLocaleString()}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {showRecommendations && report && report.recommendations.length > 0 && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-medium mb-4">Optimization Recommendations</h3>
          <div className="space-y-3">
            {report.recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm font-medium">{index + 1}</span>
                </div>
                <p className="text-sm text-gray-700">{recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Thresholds Reference */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">ADHD Performance Standards</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-green-600 mb-2">Good</h4>
            <ul className="space-y-1 text-gray-600">
              <li>LCP: ≤ {ADHD_PERFORMANCE_CONFIG.thresholds.lcp.good}ms</li>
              <li>INP: ≤ {ADHD_PERFORMANCE_CONFIG.thresholds.fid.good}ms</li>
              <li>CLS: ≤ {ADHD_PERFORMANCE_CONFIG.thresholds.cls.good}</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-yellow-600 mb-2">Needs Improvement</h4>
            <ul className="space-y-1 text-gray-600">
              <li>LCP: ≤ {ADHD_PERFORMANCE_CONFIG.thresholds.lcp.needsImprovement}ms</li>
              <li>INP: ≤ {ADHD_PERFORMANCE_CONFIG.thresholds.fid.needsImprovement}ms</li>
              <li>CLS: ≤ {ADHD_PERFORMANCE_CONFIG.thresholds.cls.needsImprovement}</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-red-600 mb-2">Poor</h4>
            <ul className="space-y-1 text-gray-600">
              <li>
                LCP: {'>'} {ADHD_PERFORMANCE_CONFIG.thresholds.lcp.needsImprovement}ms
              </li>
              <li>
                INP: {'>'} {ADHD_PERFORMANCE_CONFIG.thresholds.fid.needsImprovement}ms
              </li>
              <li>
                CLS: {'>'} {ADHD_PERFORMANCE_CONFIG.thresholds.cls.needsImprovement}
              </li>
            </ul>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-4">
          * ADHD-optimized thresholds are stricter than standard Web Vitals for better cognitive
          accessibility
        </p>
      </div>
    </div>
  );
}
