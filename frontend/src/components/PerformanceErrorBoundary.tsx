/**
 * Error Boundary for Performance Monitoring
 * Prevents performance monitoring failures from crashing the app
 */

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class PerformanceErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('Performance monitoring error:', error, errorInfo);

    // Report to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // analytics.track('performance_monitoring_error', {
      //   error: error.message,
      //   stack: error.stack,
      //   componentStack: errorInfo.componentStack,
      // });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="sr-only">Performance monitoring temporarily unavailable</div>
        )
      );
    }

    return this.props.children;
  }
}
