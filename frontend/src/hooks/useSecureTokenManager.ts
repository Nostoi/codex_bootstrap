/**
 * Secure Token Manager Hook for OAuth state management
 * Provides secure token storage patterns following ADHD-friendly UX principles
 * Never stores tokens in localStorage/sessionStorage for security
 *
 * Part of: Frontend OAuth Integration (Phase 2)
 * Used by: AuthContext, OAuth components
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';

// ADHD-friendly token state interface
export interface TokenState {
  status: 'idle' | 'loading' | 'authenticated' | 'error' | 'refreshing';
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: Date | null;
  provider: 'microsoft' | 'google' | null;
  error: string | null;
  lastRefresh: Date | null;
}

// Security configuration for token management
interface TokenManagerConfig {
  autoRefreshEnabled: boolean;
  refreshThresholdMinutes: number; // Refresh token N minutes before expiry
  maxRetryAttempts: number;
  retryDelayMs: number;
}

// Default configuration optimized for ADHD users (predictable behavior)
const DEFAULT_CONFIG: TokenManagerConfig = {
  autoRefreshEnabled: true,
  refreshThresholdMinutes: 5, // Refresh 5 minutes before expiry
  maxRetryAttempts: 3,
  retryDelayMs: 2000, // 2 second delay between retries
};

/**
 * Secure token manager hook with ADHD-optimized error handling
 * Manages OAuth tokens in memory only, never persists to storage
 */
export function useSecureTokenManager(config: Partial<TokenManagerConfig> = {}) {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  // Token state - kept in memory only for security
  const [tokenState, setTokenState] = useState<TokenState>({
    status: 'idle',
    isAuthenticated: false,
    accessToken: null,
    refreshToken: null,
    expiresAt: null,
    provider: null,
    error: null,
    lastRefresh: null,
  });

  // Refs for managing intervals and preventing race conditions
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const isRefreshingRef = useRef(false);

  /**
   * Store tokens securely in memory state
   * Called after successful OAuth callback or token refresh
   */
  const storeTokens = useCallback(
    (tokens: {
      accessToken: string;
      refreshToken: string;
      expiresIn: number; // seconds
      provider: 'microsoft' | 'google';
    }) => {
      const expiresAt = new Date(Date.now() + tokens.expiresIn * 1000);

      setTokenState(prev => ({
        ...prev,
        status: 'authenticated',
        isAuthenticated: true,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt,
        provider: tokens.provider,
        error: null,
        lastRefresh: new Date(),
      }));

      // Schedule automatic refresh if enabled
      if (mergedConfig.autoRefreshEnabled) {
        scheduleTokenRefresh(expiresAt);
      }

      retryCountRef.current = 0; // Reset retry counter on success
    },
    [mergedConfig.autoRefreshEnabled]
  );

  /**
   * Clear all token data (logout)
   * Safely removes tokens from memory and cancels refresh timers
   */
  const clearTokens = useCallback(() => {
    setTokenState({
      status: 'idle',
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      provider: null,
      error: null,
      lastRefresh: null,
    });

    // Clear any pending refresh timers
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }

    isRefreshingRef.current = false;
    retryCountRef.current = 0;
  }, []);

  /**
   * Schedule automatic token refresh before expiry
   * ADHD-friendly: Provides predictable, automatic behavior
   */
  const scheduleTokenRefresh = useCallback(
    (expiresAt: Date) => {
      // Clear existing timeout
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }

      const now = Date.now();
      const expiryTime = expiresAt.getTime();
      const refreshTime = expiryTime - mergedConfig.refreshThresholdMinutes * 60 * 1000;
      const timeUntilRefresh = refreshTime - now;

      // Only schedule if refresh time is in the future
      if (timeUntilRefresh > 0) {
        refreshTimeoutRef.current = setTimeout(() => {
          refreshTokens();
        }, timeUntilRefresh);
      }
    },
    [mergedConfig.refreshThresholdMinutes]
  );

  /**
   * Refresh OAuth tokens using backend API
   * Implements retry logic with exponential backoff
   */
  const refreshTokens = useCallback(async () => {
    // Prevent concurrent refresh attempts
    if (isRefreshingRef.current) {
      return;
    }

    const { refreshToken, provider } = tokenState;
    if (!refreshToken || !provider) {
      setTokenState(prev => ({
        ...prev,
        status: 'error',
        error: 'No refresh token available',
        isAuthenticated: false,
      }));
      return;
    }

    isRefreshingRef.current = true;
    setTokenState(prev => ({ ...prev, status: 'refreshing' }));

    try {
      const response = await api.post(`/auth/${provider}/refresh`, {
        refreshToken,
      });

      if (response.data.success) {
        storeTokens({
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
          expiresIn: response.data.expiresIn,
          provider,
        });
      } else {
        throw new Error(response.data.error || 'Token refresh failed');
      }
    } catch (error) {
      retryCountRef.current++;

      // Implement retry logic with backoff
      if (retryCountRef.current <= mergedConfig.maxRetryAttempts) {
        const delay = mergedConfig.retryDelayMs * Math.pow(2, retryCountRef.current - 1);

        setTimeout(() => {
          isRefreshingRef.current = false;
          refreshTokens();
        }, delay);
      } else {
        // Max retries exceeded - clear tokens and require re-login
        setTokenState(prev => ({
          ...prev,
          status: 'error',
          error: 'Session expired. Please log in again.',
          isAuthenticated: false,
        }));
        clearTokens();
      }
    } finally {
      if (retryCountRef.current > mergedConfig.maxRetryAttempts) {
        isRefreshingRef.current = false;
      }
    }
  }, [tokenState, mergedConfig, storeTokens, clearTokens]);

  /**
   * Check if tokens need refresh (manual trigger)
   * ADHD-friendly: Provides manual control when needed
   */
  const checkTokenExpiry = useCallback(() => {
    if (!tokenState.expiresAt || !tokenState.isAuthenticated) {
      return false;
    }

    const now = Date.now();
    const expiryTime = tokenState.expiresAt.getTime();
    const thresholdTime = expiryTime - mergedConfig.refreshThresholdMinutes * 60 * 1000;

    return now >= thresholdTime;
  }, [tokenState.expiresAt, tokenState.isAuthenticated, mergedConfig.refreshThresholdMinutes]);

  /**
   * Get current access token with automatic refresh if needed
   * Primary method for accessing tokens throughout the app
   */
  const getAccessToken = useCallback(async (): Promise<string | null> => {
    // Return immediately if no token
    if (!tokenState.accessToken || !tokenState.isAuthenticated) {
      return null;
    }

    // Check if token needs refresh
    if (checkTokenExpiry()) {
      await refreshTokens();
    }

    return tokenState.accessToken;
  }, [tokenState.accessToken, tokenState.isAuthenticated, checkTokenExpiry, refreshTokens]);

  /**
   * Validate token status on component mount
   * Checks with backend to ensure tokens are still valid
   */
  const validateTokens = useCallback(async () => {
    if (!tokenState.accessToken || !tokenState.provider) {
      return;
    }

    try {
      setTokenState(prev => ({ ...prev, status: 'loading' }));

      const response = await api.get(`/auth/${tokenState.provider}/validate`, {
        headers: {
          Authorization: `Bearer ${tokenState.accessToken}`,
        },
      });

      if (!response.data.valid) {
        // Token invalid - attempt refresh
        await refreshTokens();
      } else {
        setTokenState(prev => ({ ...prev, status: 'authenticated' }));
      }
    } catch (error) {
      // Validation failed - attempt refresh
      await refreshTokens();
    }
  }, [tokenState.accessToken, tokenState.provider, refreshTokens]);

  // Cleanup effect for component unmount
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  // Return public interface
  return {
    // State
    tokenState,
    isAuthenticated: tokenState.isAuthenticated,
    isLoading: tokenState.status === 'loading' || tokenState.status === 'refreshing',
    error: tokenState.error,

    // Methods
    storeTokens,
    clearTokens,
    refreshTokens,
    getAccessToken,
    validateTokens,
    checkTokenExpiry,

    // Computed values
    timeUntilExpiry: tokenState.expiresAt
      ? Math.max(0, tokenState.expiresAt.getTime() - Date.now())
      : 0,
    needsRefresh: checkTokenExpiry(),
  };
}
