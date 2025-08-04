/**
 * LazyWrapper component for ADHD-optimized lazy loading
 * Provides smooth loading states and prevents jarring transitions
 */

import React, { Suspense, memo, useMemo } from 'react';
import { useLazyLoad } from '@/lib/performance';

interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  threshold?: number;
  enabled?: boolean;
  className?: string;
  minHeight?: number;
  'data-testid'?: string;
}

/**
 * Skeleton loader component for smooth ADHD-friendly loading states
 */
const SkeletonLoader = memo(
  ({ minHeight = 200, className = '' }: { minHeight?: number; className?: string }) => (
    <div
      className={`animate-pulse bg-gray-100 dark:bg-gray-800 rounded-lg ${className}`}
      style={{ minHeight }}
      role="status"
      aria-label="Loading content..."
    >
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
      </div>
    </div>
  )
);

SkeletonLoader.displayName = 'SkeletonLoader';

/**
 * Error boundary for lazy-loaded components
 */
class LazyErrorBoundary extends React.Component<
  {
    children: React.ReactNode;
    fallback: React.ReactNode;
    onError?: (error: Error) => void;
  },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('LazyWrapper error:', error, errorInfo);
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

/**
 * LazyWrapper component that provides ADHD-optimized lazy loading
 *
 * Features:
 * - Intersection Observer for performance
 * - Smooth skeleton loading states
 * - Error boundaries for resilience
 * - Customizable loading thresholds
 * - ADHD-friendly animations
 *
 * @example
 * ```tsx
 * <LazyWrapper
 *   threshold={0.1}
 *   minHeight={300}
 *   fallback={<CustomLoader />}
 * >
 *   <ExpensiveComponent />
 * </LazyWrapper>
 * ```
 */
export const LazyWrapper = memo<LazyWrapperProps>(
  ({
    children,
    fallback,
    threshold = 0.1,
    enabled = true,
    className = '',
    minHeight = 200,
    'data-testid': testId,
  }) => {
    const { elementRef, isIntersecting } = useLazyLoad(threshold);

    // Memoize the default fallback to prevent unnecessary re-renders
    const defaultFallback = useMemo(
      () => <SkeletonLoader minHeight={minHeight} className={className} />,
      [minHeight, className]
    );

    const loadingFallback = fallback || defaultFallback;

    // If lazy loading is disabled, render children immediately
    if (!enabled) {
      return (
        <LazyErrorBoundary
          fallback={
            <div className="p-4 text-center text-red-600" role="alert">
              <p>Failed to load component</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 px-4 py-2 bg-red-100 hover:bg-red-200 rounded"
              >
                Retry
              </button>
            </div>
          }
        >
          <Suspense fallback={loadingFallback}>
            <div className={className} data-testid={testId}>
              {children}
            </div>
          </Suspense>
        </LazyErrorBoundary>
      );
    }

    return (
      <div
        ref={elementRef}
        className={`lazy-wrapper ${className}`}
        data-testid={testId}
        style={{ minHeight }}
      >
        <LazyErrorBoundary
          fallback={
            <div className="p-4 text-center text-red-600" role="alert">
              <p>Failed to load component</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 px-4 py-2 bg-red-100 hover:bg-red-200 rounded"
              >
                Retry
              </button>
            </div>
          }
        >
          <Suspense fallback={loadingFallback}>
            {isIntersecting ? children : loadingFallback}
          </Suspense>
        </LazyErrorBoundary>
      </div>
    );
  }
);

LazyWrapper.displayName = 'LazyWrapper';

/**
 * HOC for creating lazy-loaded components with automatic code splitting
 *
 * @example
 * ```tsx
 * const LazyDashboard = createLazyComponent(
 *   () => import('./Dashboard'),
 *   { minHeight: 400 }
 * );
 * ```
 */
export const createLazyComponent = <T extends React.ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  wrapperProps: Partial<LazyWrapperProps> = {}
) => {
  const LazyComponent = React.lazy(componentImport);

  return memo((props: React.ComponentProps<T>) => (
    <LazyWrapper {...wrapperProps}>
      <LazyComponent {...props} />
    </LazyWrapper>
  ));
};

/**
 * Hook for lazy loading images with ADHD-friendly loading states
 */
export const useLazyImage = (src: string, alt: string = '') => {
  const { elementRef, isIntersecting } = useLazyLoad(0.1);
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState(false);

  const handleLoad = React.useCallback(() => {
    setLoaded(true);
    setError(false);
  }, []);

  const handleError = React.useCallback(() => {
    setError(true);
    setLoaded(false);
  }, []);

  const imageProps = useMemo(
    () => ({
      src: isIntersecting ? src : undefined,
      alt,
      onLoad: handleLoad,
      onError: handleError,
      loading: 'lazy' as const,
      style: {
        opacity: loaded ? 1 : 0,
        transition: 'opacity 0.3s ease-in-out',
      },
    }),
    [isIntersecting, src, alt, loaded, handleLoad, handleError]
  );

  return {
    elementRef,
    imageProps,
    isLoading: isIntersecting && !loaded && !error,
    hasError: error,
    isLoaded: loaded,
  };
};

/**
 * Component for lazy-loaded images with ADHD-friendly loading states
 */
export const LazyImage = memo<{
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  placeholder?: React.ReactNode;
  'data-testid'?: string;
}>(({ src, alt, className = '', width, height, placeholder, 'data-testid': testId }) => {
  const { elementRef, imageProps, isLoading, hasError, isLoaded } = useLazyImage(src, alt);

  const defaultPlaceholder = (
    <div
      className={`bg-gray-200 dark:bg-gray-700 animate-pulse ${className}`}
      style={{ width, height }}
      role="img"
      aria-label="Loading image..."
    />
  );

  return (
    <div ref={elementRef} className="relative" data-testid={testId}>
      {!isLoaded && !hasError && (placeholder || defaultPlaceholder)}
      {hasError && (
        <div
          className={`bg-gray-100 dark:bg-gray-800 flex items-center justify-center ${className}`}
          style={{ width, height }}
          role="img"
          aria-label="Failed to load image"
        >
          <span className="text-gray-500 text-sm">Image failed to load</span>
        </div>
      )}
      <img
        {...imageProps}
        className={className}
        width={width}
        height={height}
        style={{
          ...imageProps.style,
          width,
          height,
        }}
      />
    </div>
  );
});

LazyImage.displayName = 'LazyImage';

export default LazyWrapper;
