/**
 * Service Worker for ADHD-optimized caching and offline support
 * Provides fast loading and reliable offline experience
 */

const CACHE_NAME = 'codex-bootstrap-v1';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';
const API_CACHE = 'api-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/manifest.json',
  '/offline',
  // Add other critical routes
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/projects',
  '/api/tasks',
  '/api/users/profile',
  // Add other critical API endpoints
];

// Performance monitoring for ADHD optimization
let performanceMetrics = {
  cacheHits: 0,
  cacheMisses: 0,
  offlineRequests: 0,
  networkRequests: 0,
  averageResponseTime: 0,
};

/**
 * Install event - cache static assets
 */
self.addEventListener('install', event => {
  console.log('Service Worker installing...');

  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then(cache => {
        console.log('Caching static assets...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Failed to cache static assets:', error);
      })
  );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');

  event.waitUntil(
    caches
      .keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (
              cacheName !== CACHE_NAME &&
              cacheName !== STATIC_CACHE &&
              cacheName !== DYNAMIC_CACHE &&
              cacheName !== API_CACHE
            ) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Old caches cleaned up');
        return self.clients.claim();
      })
      .catch(error => {
        console.error('Failed to clean up old caches:', error);
      })
  );
});

/**
 * Fetch event - handle requests with caching strategy
 */
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip Chrome extension requests
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // Handle different types of requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
  } else if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(handleStaticAsset(request));
  } else {
    event.respondWith(handlePageRequest(request));
  }
});

/**
 * Handle API requests with network-first strategy
 */
async function handleApiRequest(request) {
  const startTime = Date.now();

  try {
    // Try network first for fresh data
    const networkResponse = await fetch(request);
    const responseTime = Date.now() - startTime;

    // Update metrics
    performanceMetrics.networkRequests++;
    updateAverageResponseTime(responseTime);

    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('Network failed for API request, trying cache:', request.url);

    // Fall back to cache
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      performanceMetrics.cacheHits++;

      // Add offline indicator header
      const response = cachedResponse.clone();
      response.headers.set('X-Served-From', 'cache');
      response.headers.set('X-Cache-Date', new Date().toISOString());

      return response;
    }

    performanceMetrics.cacheMisses++;
    performanceMetrics.offlineRequests++;

    // Return offline response for critical API endpoints
    if (isкритicalApiEndpoint(request.url)) {
      return new Response(
        JSON.stringify({
          error: 'Offline',
          message: 'This data is not available offline',
          cached: false,
        }),
        {
          status: 503,
          statusText: 'Service Unavailable',
          headers: {
            'Content-Type': 'application/json',
            'X-Served-From': 'offline',
          },
        }
      );
    }

    throw error;
  }
}

/**
 * Handle static assets with cache-first strategy
 */
async function handleStaticAsset(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    performanceMetrics.cacheHits++;
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }

    performanceMetrics.networkRequests++;
    return networkResponse;
  } catch (error) {
    performanceMetrics.cacheMisses++;
    throw error;
  }
}

/**
 * Handle page requests with stale-while-revalidate strategy
 */
async function handlePageRequest(request) {
  const cachedResponse = await caches.match(request);

  // Return cached version immediately if available
  if (cachedResponse) {
    performanceMetrics.cacheHits++;

    // Update cache in background (stale-while-revalidate)
    fetch(request)
      .then(networkResponse => {
        if (networkResponse.ok) {
          const cache = caches.open(DYNAMIC_CACHE);
          cache.then(c => c.put(request, networkResponse));
        }
      })
      .catch(() => {
        // Ignore background update errors
      });

    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }

    performanceMetrics.networkRequests++;
    return networkResponse;
  } catch (error) {
    performanceMetrics.cacheMisses++;
    performanceMetrics.offlineRequests++;

    // Return offline page
    const offlineResponse = await caches.match('/offline');
    if (offlineResponse) {
      return offlineResponse;
    }

    // Fallback offline response
    return new Response(
      `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Offline - Codex Bootstrap</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-align: center;
          }
          .offline-container {
            max-width: 400px;
            padding: 2rem;
          }
          .offline-icon {
            font-size: 4rem;
            margin-bottom: 1rem;
          }
          .retry-btn {
            background: rgba(255,255,255,0.2);
            border: 2px solid white;
            color: white;
            padding: 0.8rem 1.5rem;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1rem;
            margin-top: 1rem;
            transition: background 0.3s ease;
          }
          .retry-btn:hover {
            background: rgba(255,255,255,0.3);
          }
        </style>
      </head>
      <body>
        <div class="offline-container">
          <div class="offline-icon">📡</div>
          <h1>You're Offline</h1>
          <p>This page isn't available right now. Check your connection and try again.</p>
          <button class="retry-btn" onclick="window.location.reload()">
            Try Again
          </button>
        </div>
      </body>
      </html>
      `,
      {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
          'X-Served-From': 'offline-fallback',
        },
      }
    );
  }
}

/**
 * Check if API endpoint is critical for offline functionality
 */
function isКритicalApiEndpoint(url) {
  return API_ENDPOINTS.some(endpoint => url.includes(endpoint));
}

/**
 * Update average response time metric
 */
function updateAverageResponseTime(responseTime) {
  const currentAvg = performanceMetrics.averageResponseTime;
  const requestCount = performanceMetrics.networkRequests;

  performanceMetrics.averageResponseTime =
    (currentAvg * (requestCount - 1) + responseTime) / requestCount;
}

/**
 * Message handler for communication with main thread
 */
self.addEventListener('message', event => {
  const { type, payload } = event.data;

  switch (type) {
    case 'GET_METRICS':
      event.ports[0].postMessage({
        type: 'METRICS_RESPONSE',
        payload: performanceMetrics,
      });
      break;

    case 'CLEAR_CACHE':
      clearCache(payload?.cacheType || 'all')
        .then(() => {
          event.ports[0].postMessage({
            type: 'CACHE_CLEARED',
            payload: { success: true },
          });
        })
        .catch(error => {
          event.ports[0].postMessage({
            type: 'CACHE_CLEARED',
            payload: { success: false, error: error.message },
          });
        });
      break;

    case 'PREFETCH_ROUTES':
      prefetchRoutes(payload?.routes || [])
        .then(() => {
          event.ports[0].postMessage({
            type: 'PREFETCH_COMPLETE',
            payload: { success: true },
          });
        })
        .catch(error => {
          event.ports[0].postMessage({
            type: 'PREFETCH_COMPLETE',
            payload: { success: false, error: error.message },
          });
        });
      break;

    default:
      console.log('Unknown message type:', type);
  }
});

/**
 * Clear cache by type
 */
async function clearCache(cacheType = 'all') {
  const cacheNames = await caches.keys();

  if (cacheType === 'all') {
    await Promise.all(cacheNames.map(name => caches.delete(name)));
  } else {
    const targetCache = cacheNames.find(name => name.includes(cacheType));
    if (targetCache) {
      await caches.delete(targetCache);
    }
  }

  // Reset metrics
  performanceMetrics = {
    cacheHits: 0,
    cacheMisses: 0,
    offlineRequests: 0,
    networkRequests: 0,
    averageResponseTime: 0,
  };
}

/**
 * Prefetch routes for better ADHD user experience
 */
async function prefetchRoutes(routes) {
  const cache = await caches.open(DYNAMIC_CACHE);

  const prefetchPromises = routes.map(async route => {
    try {
      const response = await fetch(route);
      if (response.ok) {
        await cache.put(route, response);
      }
    } catch (error) {
      console.log(`Failed to prefetch ${route}:`, error);
    }
  });

  await Promise.allSettled(prefetchPromises);
}

/**
 * Background sync for offline actions
 */
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

/**
 * Handle background sync
 */
async function doBackgroundSync() {
  try {
    // Get pending offline actions from IndexedDB or cache
    const pendingActions = await getPendingOfflineActions();

    for (const action of pendingActions) {
      try {
        await fetch(action.url, action.options);
        await removePendingAction(action.id);
      } catch (error) {
        console.log('Background sync failed for action:', action, error);
      }
    }
  } catch (error) {
    console.error('Background sync error:', error);
  }
}

/**
 * Get pending offline actions (placeholder - implement with IndexedDB)
 */
async function getPendingOfflineActions() {
  // TODO: Implement with IndexedDB
  return [];
}

/**
 * Remove pending action (placeholder - implement with IndexedDB)
 */
async function removePendingAction(actionId) {
  // TODO: Implement with IndexedDB
}

console.log('Service Worker loaded successfully');
