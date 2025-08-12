/**
 * Performance Testing Page
 * Phase 3 Item 15: Performance testing with Core Web Vitals optimization
 *
 * Demonstrates ADHD-optimized Core Web Vitals monitoring and optimization
 */

import { PerformanceTesting } from '@/components/performance/PerformanceTesting';

export default function PerformanceTestingPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Performance Testing & Optimization</h1>
          <p className="mt-2 text-lg text-gray-600">
            Real-time Core Web Vitals monitoring with ADHD-optimized performance standards
          </p>
        </div>

        {/* Performance Monitoring Component */}
        <PerformanceTesting autoStart={true} showRecommendations={true} className="mb-8" />

        {/* Performance Context & Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* ADHD Performance Impact */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">ADHD Performance Impact</h2>
            <div className="space-y-4 text-sm text-gray-700">
              <div className="flex items-start space-x-3">
                <span className="text-red-500 font-bold">LCP:</span>
                <div>
                  <p className="font-medium">Slow loading breaks focus</p>
                  <p>ADHD users abandon slow-loading pages 3x faster than average users</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-yellow-500 font-bold">INP:</span>
                <div>
                  <p className="font-medium">Delayed responses cause frustration</p>
                  <p>Immediate feedback prevents hyperfocus interruption and task switching</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-blue-500 font-bold">CLS:</span>
                <div>
                  <p className="font-medium">Layout shifts are disorienting</p>
                  <p>Visual instability can trigger anxiety and derail task completion</p>
                </div>
              </div>
            </div>
          </div>

          {/* Optimization Strategies */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">Optimization Strategies</h2>
            <div className="space-y-4 text-sm text-gray-700">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Image Optimization</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Use WebP format with fallbacks</li>
                  <li>Implement responsive images with srcset</li>
                  <li>Add explicit width/height attributes</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">JavaScript Optimization</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Code splitting and lazy loading</li>
                  <li>Break up long tasks with setTimeout</li>
                  <li>Use service workers for caching</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">CSS Optimization</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Critical CSS inline, defer non-critical</li>
                  <li>Use CSS containment for performance</li>
                  <li>Optimize font loading with font-display</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Budget Information */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">Performance Budget Guidelines</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Bundle Size Limits</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>Main bundle: &lt; 400KB</li>
                <li>Individual chunks: &lt; 200KB</li>
                <li>Total initial load: &lt; 1MB</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Loading Performance</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>Time to Interactive: &lt; 3s</li>
                <li>First Contentful Paint: &lt; 1.5s</li>
                <li>Speed Index: &lt; 2.5s</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Resource Limits</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>Total requests: &lt; 50</li>
                <li>Image size: &lt; 500KB each</li>
                <li>Font files: &lt; 200KB total</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Testing Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">Testing Instructions</h2>
          <div className="text-sm text-blue-800 space-y-2">
            <p>
              <strong>1. Baseline Testing:</strong> The monitor above shows current performance
              metrics in real-time as you interact with the page.
            </p>
            <p>
              <strong>2. Performance Testing:</strong> Navigate through the application while
              monitoring to see how different interactions affect Core Web Vitals.
            </p>
            <p>
              <strong>3. Optimization Validation:</strong> After implementing optimizations, return
              here to verify improvements meet ADHD-friendly standards.
            </p>
            <p>
              <strong>4. Regression Testing:</strong> Use this page in automated tests to catch
              performance regressions before deployment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
