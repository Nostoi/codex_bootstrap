/**
 * ServiceWorkerProvider component for managing service worker lifecycle
 * Provides ADHD-optimized offline support and update notifications
 */

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useServiceWorker } from '@/lib/serviceWorker';
import type { ServiceWorkerMetrics } from '@/lib/serviceWorker';

interface ServiceWorkerContextType {
  isSupported: boolean;
  isRegistered: boolean;
  isOnline: boolean;
  metrics: ServiceWorkerMetrics | null;
  showUpdateNotification: boolean;
  showOfflineNotification: boolean;
  register: () => Promise<ServiceWorkerRegistration | null>;
  unregister: () => Promise<boolean>;
  update: () => Promise<void>;
  clearCache: (type?: string) => Promise<boolean>;
  prefetchRoutes: (routes: string[]) => Promise<boolean>;
  dismissUpdateNotification: () => void;
  dismissOfflineNotification: () => void;
  acceptUpdate: () => void;
}

const ServiceWorkerContext = createContext<ServiceWorkerContextType | null>(null);

export const useServiceWorkerContext = () => {
  const context = useContext(ServiceWorkerContext);
  if (!context) {
    throw new Error('useServiceWorkerContext must be used within ServiceWorkerProvider');
  }
  return context;
};

interface ServiceWorkerProviderProps {
  children: React.ReactNode;
}

export const ServiceWorkerProvider: React.FC<ServiceWorkerProviderProps> = ({ children }) => {
  const serviceWorker = useServiceWorker();
  const [showUpdateNotification, setShowUpdateNotification] = useState(false);
  const [showOfflineNotification, setShowOfflineNotification] = useState(false);
  const [hasShownOfflineNotification, setHasShownOfflineNotification] = useState(false);

  // Handle service worker events
  useEffect(() => {
    const handleUpdateAvailable = () => {
      setShowUpdateNotification(true);
    };

    const handleOfflineReady = () => {
      if (!hasShownOfflineNotification) {
        setShowOfflineNotification(true);
        setHasShownOfflineNotification(true);
      }
    };

    // Listen for service worker events
    window.addEventListener('sw-update-available', handleUpdateAvailable);
    window.addEventListener('sw-offline-ready', handleOfflineReady);

    return () => {
      window.removeEventListener('sw-update-available', handleUpdateAvailable);
      window.removeEventListener('sw-offline-ready', handleOfflineReady);
    };
  }, [hasShownOfflineNotification]);

  // Auto-dismiss offline notification after 5 seconds
  useEffect(() => {
    if (showOfflineNotification) {
      const timer = setTimeout(() => {
        setShowOfflineNotification(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [showOfflineNotification]);

  const dismissUpdateNotification = () => {
    setShowUpdateNotification(false);
  };

  const dismissOfflineNotification = () => {
    setShowOfflineNotification(false);
  };

  const acceptUpdate = async () => {
    try {
      await serviceWorker.update();
      setShowUpdateNotification(false);
      // Reload the page to activate the new service worker
      window.location.reload();
    } catch (error) {
      console.error('Failed to update service worker:', error);
    }
  };

  const contextValue: ServiceWorkerContextType = {
    ...serviceWorker,
    showUpdateNotification,
    showOfflineNotification,
    dismissUpdateNotification,
    dismissOfflineNotification,
    acceptUpdate,
  };

  return (
    <ServiceWorkerContext.Provider value={contextValue}>
      {children}
      {/* Update notification */}
      {showUpdateNotification && (
        <UpdateNotification
          onAccept={acceptUpdate}
          onDismiss={dismissUpdateNotification}
        />
      )}
      {/* Offline ready notification */}
      {showOfflineNotification && (
        <OfflineNotification onDismiss={dismissOfflineNotification} />
      )}
    </ServiceWorkerContext.Provider>
  );
};

/**
 * Update notification component
 */
const UpdateNotification: React.FC<{
  onAccept: () => void;
  onDismiss: () => void;
}> = ({ onAccept, onDismiss }) => {
  return (
    <div className="fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        </div>
        <div className="flex-1">
          <h4 className="font-medium">App Update Available</h4>
          <p className="text-sm text-blue-100 mt-1">
            A new version is ready. Update now for the latest features and improvements.
          </p>
          <div className="flex space-x-2 mt-3">
            <button
              onClick={onAccept}
              className="bg-white text-blue-600 px-3 py-1 rounded text-sm font-medium hover:bg-blue-50 transition-colors"
            >
              Update Now
            </button>
            <button
              onClick={onDismiss}
              className="bg-blue-700 text-white px-3 py-1 rounded text-sm hover:bg-blue-800 transition-colors"
            >
              Later
            </button>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="flex-shrink-0 text-blue-200 hover:text-white"
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
 * Offline ready notification component
 */
const OfflineNotification: React.FC<{
  onDismiss: () => void;
}> = ({ onDismiss }) => {
  return (
    <div className="fixed bottom-4 left-4 bg-green-600 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex-1">
          <h4 className="font-medium">Ready for Offline Use</h4>
          <p className="text-sm text-green-100 mt-1">
            The app is now cached and will work even when you're offline.
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="flex-shrink-0 text-green-200 hover:text-white"
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

export default ServiceWorkerProvider;
