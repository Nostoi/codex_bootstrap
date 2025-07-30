/**
 * Service Worker registration and management utilities
 * Provides ADHD-optimized offline support and performance monitoring
 */

import React, { useState, useEffect } from 'react';
import { PerformanceMonitor } from './performance';

export interface ServiceWorkerMetrics {
  cacheHits: number;
  cacheMisses: number;
  offlineRequests: number;
  networkRequests: number;
  averageResponseTime: number;
}

export interface ServiceWorkerManager {
  register: () => Promise<ServiceWorkerRegistration | null>;
  unregister: () => Promise<boolean>;
  update: () => Promise<void>;
  getMetrics: () => Promise<ServiceWorkerMetrics>;
  clearCache: (type?: string) => Promise<boolean>;
  prefetchRoutes: (routes: string[]) => Promise<boolean>;
  isSupported: boolean;
  isRegistered: boolean;
  registration: ServiceWorkerRegistration | null;
}

class ServiceWorkerManagerImpl implements ServiceWorkerManager {
  private _registration: ServiceWorkerRegistration | null = null;
  private _isRegistered = false;
  private performanceMonitor: PerformanceMonitor;

  constructor() {
    this.performanceMonitor = new PerformanceMonitor();
  }

  get isSupported(): boolean {
    return typeof window !== 'undefined' && 'serviceWorker' in navigator;
  }

  get isRegistered(): boolean {
    return this._isRegistered;
  }

  get registration(): ServiceWorkerRegistration | null {
    return this._registration;
  }

  /**
   * Register the service worker
   */
  async register(): Promise<ServiceWorkerRegistration | null> {
    if (!this.isSupported) {
      console.warn('Service Workers are not supported in this browser');
      return null;
    }

    try {
      console.log('Registering service worker...');
      
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none', // Always check for updates
      });

      this._registration = registration;
      this._isRegistered = true;

      // Set up event listeners
      this.setupEventListeners(registration);

      // Check for updates
      registration.addEventListener('updatefound', () => {
        console.log('New service worker version found');
        this.handleUpdate(registration);
      });

      // Handle controller change
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('Service worker controller changed');
        if (this.isPageReloadNeeded()) {
          this.showUpdateNotification();
        }
      });

      console.log('Service worker registered successfully:', registration);
      
      // Start performance monitoring
      this.startPerformanceMonitoring();

      return registration;
    } catch (error) {
      console.error('Service worker registration failed:', error);
      return null;
    }
  }

  /**
   * Unregister the service worker
   */
  async unregister(): Promise<boolean> {
    if (!this.isSupported || !this._registration) {
      return false;
    }

    try {
      const result = await this._registration.unregister();
      this._registration = null;
      this._isRegistered = false;
      console.log('Service worker unregistered');
      return result;
    } catch (error) {
      console.error('Service worker unregistration failed:', error);
      return false;
    }
  }

  /**
   * Update the service worker
   */
  async update(): Promise<void> {
    if (!this._registration) {
      throw new Error('No service worker registration found');
    }

    try {
      await this._registration.update();
      console.log('Service worker update check completed');
    } catch (error) {
      console.error('Service worker update failed:', error);
      throw error;
    }
  }

  /**
   * Get performance metrics from service worker
   */
  async getMetrics(): Promise<ServiceWorkerMetrics> {
    if (!this.isSupported || !navigator.serviceWorker.controller) {
      return {
        cacheHits: 0,
        cacheMisses: 0,
        offlineRequests: 0,
        networkRequests: 0,
        averageResponseTime: 0,
      };
    }

    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        const { type, payload } = event.data;
        if (type === 'METRICS_RESPONSE') {
          resolve(payload);
        } else {
          reject(new Error('Unexpected response type'));
        }
      };

      navigator.serviceWorker.controller.postMessage(
        { type: 'GET_METRICS' },
        [messageChannel.port2]
      );

      // Timeout after 5 seconds
      setTimeout(() => {
        reject(new Error('Metrics request timeout'));
      }, 5000);
    });
  }

  /**
   * Clear service worker cache
   */
  async clearCache(type: string = 'all'): Promise<boolean> {
    if (!this.isSupported || !navigator.serviceWorker.controller) {
      return false;
    }

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        const { type: responseType, payload } = event.data;
        if (responseType === 'CACHE_CLEARED') {
          resolve(payload.success);
        }
      };

      navigator.serviceWorker.controller.postMessage(
        { type: 'CLEAR_CACHE', payload: { cacheType: type } },
        [messageChannel.port2]
      );

      // Timeout after 10 seconds
      setTimeout(() => {
        resolve(false);
      }, 10000);
    });
  }

  /**
   * Prefetch routes for better performance
   */
  async prefetchRoutes(routes: string[]): Promise<boolean> {
    if (!this.isSupported || !navigator.serviceWorker.controller) {
      return false;
    }

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        const { type, payload } = event.data;
        if (type === 'PREFETCH_COMPLETE') {
          resolve(payload.success);
        }
      };

      navigator.serviceWorker.controller.postMessage(
        { type: 'PREFETCH_ROUTES', payload: { routes } },
        [messageChannel.port2]
      );

      // Timeout after 30 seconds
      setTimeout(() => {
        resolve(false);
      }, 30000);
    });
  }

  /**
   * Set up event listeners for service worker
   */
  private setupEventListeners(registration: ServiceWorkerRegistration): void {
    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      const { type, payload } = event.data;
      
      switch (type) {
        case 'CACHE_UPDATED':
          this.handleCacheUpdate(payload);
          break;
        case 'OFFLINE_READY':
          this.handleOfflineReady();
          break;
        case 'UPDATE_AVAILABLE':
          this.handleUpdateAvailable();
          break;
        default:
          console.log('Unknown service worker message:', type, payload);
      }
    });

    // Handle installation states
    if (registration.waiting) {
      this.handleWaitingServiceWorker(registration.waiting);
    }

    if (registration.installing) {
      this.handleInstallingServiceWorker(registration.installing);
    }
  }

  /**
   * Handle service worker update
   */
  private handleUpdate(registration: ServiceWorkerRegistration): void {
    const newWorker = registration.installing;
    if (!newWorker) return;

    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        // New version available
        this.showUpdateNotification();
      }
    });
  }

  /**
   * Handle waiting service worker
   */
  private handleWaitingServiceWorker(worker: ServiceWorker): void {
    this.showUpdateNotification();
  }

  /**
   * Handle installing service worker
   */
  private handleInstallingServiceWorker(worker: ServiceWorker): void {
    worker.addEventListener('statechange', () => {
      if (worker.state === 'installed') {
        if (navigator.serviceWorker.controller) {
          this.showUpdateNotification();
        } else {
          this.showOfflineReadyNotification();
        }
      }
    });
  }

  /**
   * Check if page reload is needed
   */
  private isPageReloadNeeded(): boolean {
    return !navigator.serviceWorker.controller;
  }

  /**
   * Show update notification
   */
  private showUpdateNotification(): void {
    // Dispatch custom event for app to handle
    window.dispatchEvent(new CustomEvent('sw-update-available', {
      detail: {
        skipWaiting: () => this.skipWaiting(),
        reload: () => window.location.reload(),
      },
    }));
  }

  /**
   * Show offline ready notification
   */
  private showOfflineReadyNotification(): void {
    window.dispatchEvent(new CustomEvent('sw-offline-ready'));
  }

  /**
   * Handle cache update
   */
  private handleCacheUpdate(payload: any): void {
    console.log('Cache updated:', payload);
  }

  /**
   * Handle offline ready
   */
  private handleOfflineReady(): void {
    console.log('App ready for offline use');
    this.showOfflineReadyNotification();
  }

  /**
   * Handle update available
   */
  private handleUpdateAvailable(): void {
    console.log('App update available');
    this.showUpdateNotification();
  }

  /**
   * Skip waiting and activate new service worker
   */
  private async skipWaiting(): Promise<void> {
    if (!this._registration?.waiting) return;

    this._registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }

  /**
   * Start performance monitoring
   */
  private startPerformanceMonitoring(): void {
    // Monitor connection status
    window.addEventListener('online', () => {
      console.log('Connection restored');
      this.performanceMonitor.logEvent('connection-restored');
    });

    window.addEventListener('offline', () => {
      console.log('Connection lost');
      this.performanceMonitor.logEvent('connection-lost');
    });

    // Monitor service worker performance
    setInterval(async () => {
      try {
        const metrics = await this.getMetrics();
        this.performanceMonitor.logMetric('sw-cache-hit-rate', 
          metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses) || 0
        );
        this.performanceMonitor.logMetric('sw-avg-response-time', metrics.averageResponseTime);
      } catch (error) {
        // Ignore errors in background monitoring
      }
    }, 30000); // Every 30 seconds
  }
}

// Singleton instance
export const serviceWorkerManager = new ServiceWorkerManagerImpl();

/**
 * Hook for using service worker in React components
 */
export const useServiceWorker = () => {
  const [isRegistered, setIsRegistered] = useState(serviceWorkerManager.isRegistered);
  const [metrics, setMetrics] = useState<ServiceWorkerMetrics | null>(null);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    if (!serviceWorkerManager.isSupported) return;

    // Register service worker
    serviceWorkerManager.register().then((registration) => {
      setIsRegistered(!!registration);
    });

    // Set up event listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Update metrics periodically
    const metricsInterval = setInterval(async () => {
      try {
        const swMetrics = await serviceWorkerManager.getMetrics();
        setMetrics(swMetrics);
      } catch (error) {
        // Ignore errors
      }
    }, 10000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(metricsInterval);
    };
  }, []);

  return {
    isSupported: serviceWorkerManager.isSupported,
    isRegistered,
    isOnline,
    metrics,
    register: serviceWorkerManager.register.bind(serviceWorkerManager),
    unregister: serviceWorkerManager.unregister.bind(serviceWorkerManager),
    update: serviceWorkerManager.update.bind(serviceWorkerManager),
    clearCache: serviceWorkerManager.clearCache.bind(serviceWorkerManager),
    prefetchRoutes: serviceWorkerManager.prefetchRoutes.bind(serviceWorkerManager),
  };
};

export default serviceWorkerManager;
