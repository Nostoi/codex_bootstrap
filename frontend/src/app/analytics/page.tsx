'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import ResponsiveLayout from '@/components/layout/ResponsiveLayout';
import { Loader2 } from 'lucide-react';

// Lazy load analytics dashboard for performance optimization
const AnalyticsDashboard = dynamic(
  () =>
    import('@/components/analytics/AnalyticsDashboard').then(mod => ({
      default: mod.AnalyticsDashboard,
    })),
  {
    loading: () => (
      <div className="flex items-center justify-center min-h-[400px] bg-base-100 rounded-lg border border-base-300">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-base-content/70 text-sm">Loading analytics dashboard...</p>
          <div className="text-xs text-base-content/50">Optimized for ADHD-friendly loading</div>
        </div>
      </div>
    ),
    ssr: false, // Client-side only for better initial page load
  }
);

export default function AnalyticsPage() {
  return (
    <ResponsiveLayout maxWidth="2xl">
      <div className="space-y-4 sm:space-y-6">
        {/* Mobile-Optimized Header */}
        <div className="text-center lg:text-left">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-base-content mb-2">
            📊 Analytics & Insights
          </h1>
          <p className="text-base-content/70 text-sm sm:text-base">
            Track your productivity patterns and ADHD optimization
          </p>
        </div>

        {/* Analytics Dashboard with Lazy Loading */}
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-[400px] bg-base-100 rounded-lg border border-base-300">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-base-content/70 text-sm">Preparing analytics...</p>
              </div>
            </div>
          }
        >
          <AnalyticsDashboard />
        </Suspense>
      </div>
    </ResponsiveLayout>
  );
}
