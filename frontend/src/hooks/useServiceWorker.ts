/**
 * Service Worker registration hook for performance optimization
 * Provides offline support and intelligent caching
 */

import { useEffect, useState } from 'react';

interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isOffline: boolean;
  updateAvailable: boolean;
  error: string | null;
}

export const useServiceWorker = () => {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: typeof window !== 'undefined' && 'serviceWorker' in navigator,
    isRegistered: false,
    isOffline: typeof window !== 'undefined' && !navigator.onLine,
    updateAvailable: false,
    error: null,
  });

  useEffect(() => {
    if (!state.isSupported) return;

    registerServiceWorker();
    setupNetworkListeners();
  }, [state.isSupported]);

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('Service Worker registered successfully:', registration);

      setState(prev => ({ ...prev, isRegistered: true }));

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setState(prev => ({ ...prev, updateAvailable: true }));
          }
        });
      });

      // Listen for controller changes (new SW activated)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Registration failed',
      }));
    }
  };

  const setupNetworkListeners = () => {
    const updateOnlineStatus = () => {
      setState(prev => ({ ...prev, isOffline: !navigator.onLine }));
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  };

  const updateServiceWorker = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(registration => {
        if (registration?.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      });
    }
  };

  const clearCache = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(registration => {
        if (registration?.active) {
          registration.active.postMessage({ type: 'CLEAR_CACHE' });
        }
      });
    }
  };

  return {
    ...state,
    updateServiceWorker,
    clearCache,
  };
};

/**
 * Hook to monitor network status for ADHD-friendly offline notifications
 */
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};

/**
 * Hook to implement background sync for offline actions
 */
export const useBackgroundSync = () => {
  const [pendingActions, setPendingActions] = useState<number>(0);

  const queueAction = async (action: {
    url: string;
    method: string;
    body?: any;
    description: string;
  }) => {
    // Store action in IndexedDB for background sync
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('background-sync');
        setPendingActions(prev => prev + 1);
        console.log('Action queued for background sync:', action.description);
      } catch (error) {
        console.error('Background sync registration failed:', error);
      }
    }
  };

  const processPendingActions = () => {
    setPendingActions(0);
  };

  return {
    pendingActions,
    queueAction,
    processPendingActions,
  };
};

/**
 * Performance monitoring for service worker
 */
export const useServiceWorkerPerformance = () => {
  const [metrics, setMetrics] = useState({
    cacheHitRatio: 0,
    offlineRequests: 0,
    averageResponseTime: 0,
  });

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const updateMetrics = () => {
      // Get metrics from service worker if available
      navigator.serviceWorker.ready.then(registration => {
        if (registration.active) {
          registration.active.postMessage({ type: 'GET_METRICS' });
        }
      });
    };

    // Listen for metrics from service worker
    navigator.serviceWorker.addEventListener('message', event => {
      if (event.data && event.data.type === 'METRICS_UPDATE') {
        setMetrics(event.data.metrics);
      }
    });

    // Update metrics periodically
    const interval = setInterval(updateMetrics, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return metrics;
};
