import React, { Component, ErrorInfo, ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Error Boundary Props
 */
interface ErrorBoundaryProps {
  /** Child components to wrap */
  children: ReactNode;
  /** Custom fallback UI component */
  fallback?: React.ComponentType<ErrorFallbackProps>;
  /** Callback when error occurs */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Whether to show error details in development */
  showErrorDetails?: boolean;
  /** Custom className */
  className?: string;
}

/**
 * Error Boundary State
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Fallback Props
 */
export interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  resetError: () => void;
  showErrorDetails?: boolean;
}

/**
 * Default Error Fallback Component
 */
const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  errorInfo,
  resetError,
  showErrorDetails = false,
}) => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div
      className={cn(
        'min-h-64 flex flex-col items-center justify-center p-8 text-center',
        'bg-red-50 border border-red-200 rounded-lg'
      )}
      role="alert"
      aria-live="assertive"
    >
      {/* Error Icon */}
      <div className="w-16 h-16 mx-auto mb-4 text-red-400">
        <svg fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
          <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>

      {/* Error Message */}
      <h2 className="text-xl font-semibold text-red-800 mb-2">
        Something went wrong
      </h2>
      
              <p className="text-gray-600 mb-6">
          We apologize for the inconvenience. Something didn&apos;t go as expected.
        </p>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={resetError}
          className={cn(
            'px-4 py-2 text-sm font-medium text-white bg-red-600 border border-red-600 rounded-md',
            'hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500',
            'transition-colors duration-200'
          )}
        >
          Try Again
        </button>
        
        <button
          onClick={() => {
            if (typeof window !== 'undefined') { // SSR check
              window.location.reload();
            }
          }}
          className={cn(
            'px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-md',
            'hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500',
            'transition-colors duration-200'
          )}
        >
          Refresh Page
        </button>
      </div>

      {/* Error Details (Development Only) */}
      {(isDevelopment || showErrorDetails) && error && (
        <details className="mt-8 w-full max-w-2xl">
          <summary className="cursor-pointer text-sm font-medium text-red-700 hover:text-red-800">
            Show Error Details
          </summary>
          <div className="mt-4 p-4 bg-red-100 border border-red-200 rounded-md text-left">
            <h3 className="text-sm font-semibold text-red-800 mb-2">Error:</h3>
            <pre className="text-xs text-red-700 whitespace-pre-wrap break-words mb-4">
              {error.message}
            </pre>
            
            {error.stack && (
              <>
                <h3 className="text-sm font-semibold text-red-800 mb-2">Stack Trace:</h3>
                <pre className="text-xs text-red-700 whitespace-pre-wrap break-words mb-4 max-h-40 overflow-y-auto">
                  {error.stack}
                </pre>
              </>
            )}
            
            {errorInfo?.componentStack && (
              <>
                <h3 className="text-sm font-semibold text-red-800 mb-2">Component Stack:</h3>
                <pre className="text-xs text-red-700 whitespace-pre-wrap break-words max-h-40 overflow-y-auto">
                  {errorInfo.componentStack}
                </pre>
              </>
            )}
          </div>
        </details>
      )}
    </div>
  );
};

/**
 * Error Boundary Component - Catches JavaScript errors in component tree
 * 
 * Features:
 * - Catches and displays errors gracefully
 * - Custom fallback UI support
 * - Error reporting capability
 * - ADHD-friendly error messages
 * - Development mode error details
 * - Accessible error states
 * - Recovery mechanisms
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state to show fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Update state with error info
    this.setState({
      error,
      errorInfo,
    });

    // Call onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // In production, you might want to log to an error reporting service
    // Example: logErrorToService(error, errorInfo);
  }

  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      
      return (
        <div className={this.props.className}>
          <FallbackComponent
            error={this.state.error}
            errorInfo={this.state.errorInfo}
            resetError={this.resetError}
            showErrorDetails={this.props.showErrorDetails}
          />
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook-based Error Boundary (for functional components)
 * Note: This is a wrapper around the class component for ease of use
 */
export interface WithErrorBoundaryProps {
  /** Fallback component */
  fallback?: React.ComponentType<ErrorFallbackProps>;
  /** Error callback */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Show error details */
  showErrorDetails?: boolean;
  /** Custom className */
  className?: string;
}

export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: WithErrorBoundaryProps
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

/**
 * Custom Error Classes for different error types
 */
export class UserFriendlyError extends Error {
  constructor(
    message: string,
    public userMessage?: string,
    public action?: string
  ) {
    super(message);
    this.name = 'UserFriendlyError';
  }
}

export class NetworkError extends Error {
  constructor(
    message: string,
    public status?: number,
    public endpoint?: string
  ) {
    super(message);
    this.name = 'NetworkError';
  }
}

/**
 * Specialized Error Fallbacks
 */

/**
 * Network Error Fallback
 */
export const NetworkErrorFallback: React.FC<ErrorFallbackProps> = ({ resetError }) => (
  <div className="min-h-64 flex flex-col items-center justify-center p-8 text-center bg-yellow-50 border border-yellow-200 rounded-lg">
    <div className="w-16 h-16 mx-auto mb-4 text-yellow-400">
      <svg fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
        <path d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
      </svg>
    </div>
    
    <h2 className="text-xl font-semibold text-yellow-800 mb-2">
      Connection Problem
    </h2>
    
    <p className="text-yellow-600 mb-6 max-w-md">
      We&apos;re having trouble connecting to our servers. Please check your internet connection and try again.
    </p>
    
    <button
      onClick={resetError}
      className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 border border-yellow-600 rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
    >
      Retry Connection
    </button>
  </div>
);

/**
 * Minimal Error Fallback (for small components)
 */
export const MinimalErrorFallback: React.FC<ErrorFallbackProps> = ({ resetError }) => (
  <div className="p-4 text-center bg-red-50 border border-red-200 rounded-md">
    <p className="text-sm text-red-600 mb-2">Something went wrong</p>
    <button
      onClick={resetError}
      className="text-xs text-red-600 underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500 rounded"
    >
      Try again
    </button>
  </div>
);

/**
 * Page-level Error Boundary
 */
export const PageErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary
    fallback={DefaultErrorFallback}
    onError={(error, errorInfo) => {
      // Log to error reporting service in production
      console.error('Page-level error:', error, errorInfo);
    }}
    showErrorDetails={process.env.NODE_ENV === 'development'}
    className="min-h-screen"
  >
    {children}
  </ErrorBoundary>
);

/**
 * Component-level Error Boundary (for smaller components)
 */
export const ComponentErrorBoundary: React.FC<{ children: ReactNode; name?: string }> = ({ 
  children, 
  name = 'Component' 
}) => (
  <ErrorBoundary
    fallback={MinimalErrorFallback}
    onError={(error, errorInfo) => {
      console.error(`${name} error:`, error, errorInfo);
    }}
  >
    {children}
  </ErrorBoundary>
);
