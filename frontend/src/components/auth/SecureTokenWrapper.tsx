import React, { useEffect } from 'react';
import { useSecureTokenManager } from '../../hooks/useSecureTokenManager';

/**
 * Higher-order component for protecting routes that require authentication
 * ADHD-friendly: Clear feedback and simple retry mechanism
 */
export function withSecureTokens<P extends object>(WrappedComponent: React.ComponentType<P>) {
  return function SecureTokenWrapper(props: P) {
    const { isAuthenticated, isLoading, error, validateTokens } = useSecureTokenManager();

    useEffect(() => {
      if (!isAuthenticated && !isLoading) {
        validateTokens();
      }
    }, [isAuthenticated, isLoading, validateTokens]);

    if (isLoading) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="loading loading-spinner loading-lg"></div>
            <p className="mt-4 text-base-content/70">Checking authentication...</p>
          </div>
        </div>
      );
    }

    if (error && !isAuthenticated) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="alert alert-error max-w-md">
            <div>
              <h3 className="font-bold">Authentication Error</h3>
              <div className="text-xs">{error}</div>
              <button className="btn btn-sm btn-outline mt-2" onClick={() => validateTokens()}>
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="alert alert-warning max-w-md">
            <div>
              <h3 className="font-bold">Login Required</h3>
              <div className="text-xs">Please log in to access this content.</div>
            </div>
          </div>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };
}
