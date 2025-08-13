/**
 * OAuth State Manager for Next.js App Router
 * Handles OAuth flow state, CSRF protection, and secure redirects
 * ADHD-optimized with clear state transitions and error recovery
 *
 * Part of: Frontend OAuth Integration (Phase 2)
 * Used by: OAuth login components, callback pages
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';

// OAuth state interface with ADHD-friendly status tracking
export interface OAuthState {
  status: 'idle' | 'authorizing' | 'processing' | 'success' | 'error' | 'cancelled';
  provider: 'microsoft' | 'google' | null;
  state: string | null; // CSRF protection token
  redirectUrl: string | null;
  error: string | null;
  errorCode: string | null;
  isRedirecting: boolean;
  redirectCountdown: number;
}

// OAuth configuration for different providers
interface OAuthConfig {
  provider: 'microsoft' | 'google';
  scopes: string[];
  redirectPath: string;
  responseType: 'code';
  state?: string;
}

// Default OAuth configurations
const OAUTH_CONFIGS: Record<'microsoft' | 'google', Omit<OAuthConfig, 'state'>> = {
  microsoft: {
    provider: 'microsoft',
    scopes: [
      'https://graph.microsoft.com/User.Read',
      'https://graph.microsoft.com/Calendars.ReadWrite',
      'https://graph.microsoft.com/Mail.Read',
      'offline_access', // Refresh token scope
    ],
    redirectPath: '/auth/microsoft/callback',
    responseType: 'code',
  },
  google: {
    provider: 'google',
    scopes: [
      'openid',
      'profile',
      'email',
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/gmail.readonly',
    ],
    redirectPath: '/auth/google/callback',
    responseType: 'code',
  },
};

/**
 * OAuth state manager hook with ADHD-friendly UX patterns
 * Provides secure state management for OAuth flows
 */
export function useOAuthState() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // OAuth state - includes visual feedback for ADHD users
  const [oauthState, setOAuthState] = useState<OAuthState>({
    status: 'idle',
    provider: null,
    state: null,
    redirectUrl: null,
    error: null,
    errorCode: null,
    isRedirecting: false,
    redirectCountdown: 0,
  });

  /**
   * Generate secure CSRF state token
   * Used to prevent CSRF attacks during OAuth flow
   */
  const generateState = useCallback(() => {
    // Generate cryptographically secure random state
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }, []);

  /**
   * Store OAuth state securely in sessionStorage
   * Only used for CSRF protection, not sensitive tokens
   */
  const storeOAuthState = useCallback((state: string, provider: string, returnUrl?: string) => {
    const stateData = {
      state,
      provider,
      returnUrl: returnUrl || '/',
      timestamp: Date.now(),
    };

    // Store in sessionStorage for cross-tab security
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('oauth_state', JSON.stringify(stateData));
    }
  }, []);

  /**
   * Retrieve and validate OAuth state from storage
   * Includes expiry check for security
   */
  const retrieveOAuthState = useCallback((stateFromUrl: string) => {
    if (typeof window === 'undefined') return null;

    try {
      const storedData = sessionStorage.getItem('oauth_state');
      if (!storedData) return null;

      const data = JSON.parse(storedData);

      // Validate state matches and hasn't expired (10 minutes max)
      const isValid = data.state === stateFromUrl && Date.now() - data.timestamp < 10 * 60 * 1000;

      if (isValid) {
        // Clear state after successful validation
        sessionStorage.removeItem('oauth_state');
        return data;
      }
    } catch (error) {
      console.error('Error retrieving OAuth state:', error);
    }

    return null;
  }, []);

  /**
   * Clear OAuth state from storage
   * Used for cleanup and error recovery
   */
  const clearOAuthState = useCallback(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('oauth_state');
    }

    setOAuthState({
      status: 'idle',
      provider: null,
      state: null,
      redirectUrl: null,
      error: null,
      errorCode: null,
      isRedirecting: false,
      redirectCountdown: 0,
    });
  }, []);

  /**
   * Initiate OAuth authorization flow
   * ADHD-friendly: Clear feedback and predictable behavior
   */
  const initiateOAuth = useCallback(
    async (provider: 'microsoft' | 'google', returnUrl?: string) => {
      try {
        setOAuthState(prev => ({
          ...prev,
          status: 'authorizing',
          provider,
          error: null,
          errorCode: null,
        }));

        // Generate secure state for CSRF protection
        const state = generateState();
        const config = OAUTH_CONFIGS[provider];

        // Store state securely
        storeOAuthState(state, provider, returnUrl);

        // Get authorization URL from backend
        const response = await api.post(`/auth/${provider}/authorize`, {
          scopes: config.scopes,
          redirectUri: `${window.location.origin}${config.redirectPath}`,
          state,
          responseType: config.responseType,
        });

        if (response.data.success && response.data.authUrl) {
          setOAuthState(prev => ({
            ...prev,
            state,
            redirectUrl: response.data.authUrl,
            isRedirecting: true,
            redirectCountdown: 3, // 3 second countdown
          }));

          // Start countdown for ADHD users who need time to process
          let countdown = 3;
          const countdownInterval = setInterval(() => {
            countdown--;
            setOAuthState(prev => ({ ...prev, redirectCountdown: countdown }));

            if (countdown <= 0) {
              clearInterval(countdownInterval);
              // Redirect to OAuth provider
              window.location.href = response.data.authUrl;
            }
          }, 1000);
        } else {
          throw new Error(response.data.error || 'Failed to get authorization URL');
        }
      } catch (error) {
        setOAuthState(prev => ({
          ...prev,
          status: 'error',
          error: error instanceof Error ? error.message : 'Authorization failed',
          errorCode: 'INIT_FAILED',
          isRedirecting: false,
        }));
      }
    },
    [generateState, storeOAuthState]
  );

  /**
   * Handle OAuth callback processing
   * Called from callback pages to process authorization code
   */
  const handleOAuthCallback = useCallback(
    async (params: {
      code?: string;
      state?: string;
      error?: string;
      error_description?: string;
    }) => {
      try {
        setOAuthState(prev => ({
          ...prev,
          status: 'processing',
          error: null,
        }));

        // Handle OAuth errors from provider
        if (params.error) {
          if (params.error === 'access_denied') {
            setOAuthState(prev => ({
              ...prev,
              status: 'cancelled',
              error: 'Login was cancelled',
              errorCode: 'USER_CANCELLED',
            }));
            return;
          }

          throw new Error(params.error_description || params.error);
        }

        // Validate required parameters
        if (!params.code || !params.state) {
          throw new Error('Missing authorization code or state parameter');
        }

        // Validate state for CSRF protection
        const storedState = retrieveOAuthState(params.state);
        if (!storedState) {
          throw new Error('Invalid or expired OAuth state');
        }

        // Exchange code for tokens via backend
        const response = await api.post(`/auth/${storedState.provider}/callback`, {
          code: params.code,
          state: params.state,
          redirectUri: `${window.location.origin}/auth/${storedState.provider}/callback`,
        });

        if (response.data.success) {
          setOAuthState(prev => ({
            ...prev,
            status: 'success',
            provider: storedState.provider as 'microsoft' | 'google',
          }));

          // Redirect to return URL after short delay
          setTimeout(() => {
            router.push(storedState.returnUrl || '/dashboard');
          }, 1500);

          return response.data;
        } else {
          throw new Error(response.data.error || 'Token exchange failed');
        }
      } catch (error) {
        setOAuthState(prev => ({
          ...prev,
          status: 'error',
          error: error instanceof Error ? error.message : 'Callback processing failed',
          errorCode: 'CALLBACK_FAILED',
        }));
      }
    },
    [retrieveOAuthState, router]
  );

  /**
   * Cancel OAuth redirect manually
   * ADHD-friendly: Provides user control over timing
   */
  const cancelRedirect = useCallback(() => {
    setOAuthState(prev => ({
      ...prev,
      status: 'cancelled',
      isRedirecting: false,
      redirectCountdown: 0,
    }));
  }, []);

  /**
   * Retry OAuth flow after error
   * ADHD-friendly: Simple recovery mechanism
   */
  const retryOAuth = useCallback(
    (provider: 'microsoft' | 'google', returnUrl?: string) => {
      clearOAuthState();
      setTimeout(() => {
        initiateOAuth(provider, returnUrl);
      }, 100);
    },
    [clearOAuthState, initiateOAuth]
  );

  /**
   * Process OAuth callback from URL parameters
   * Called automatically in callback pages
   */
  useEffect(() => {
    if (searchParams) {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      // Only process if we have OAuth parameters
      if (code || error) {
        handleOAuthCallback({
          code: code || undefined,
          state: state || undefined,
          error: error || undefined,
          error_description: errorDescription || undefined,
        });
      }
    }
  }, [searchParams, handleOAuthCallback]);

  return {
    // State
    oauthState,
    isAuthorizing: oauthState.status === 'authorizing',
    isProcessing: oauthState.status === 'processing',
    isRedirecting: oauthState.isRedirecting,
    isSuccess: oauthState.status === 'success',
    isError: oauthState.status === 'error',
    isCancelled: oauthState.status === 'cancelled',

    // Methods
    initiateOAuth,
    handleOAuthCallback,
    cancelRedirect,
    retryOAuth,
    clearOAuthState,

    // Computed values
    statusMessage: getStatusMessage(oauthState),
    canRetry: oauthState.status === 'error' || oauthState.status === 'cancelled',
  };
}

/**
 * Get user-friendly status message for OAuth state
 * ADHD-optimized: Clear, non-technical language
 */
function getStatusMessage(state: OAuthState): string {
  switch (state.status) {
    case 'idle':
      return 'Ready to connect';
    case 'authorizing':
      return 'Getting authorization...';
    case 'processing':
      return 'Connecting your account...';
    case 'success':
      return 'Successfully connected!';
    case 'cancelled':
      return 'Connection cancelled';
    case 'error':
      return state.error || 'Connection failed';
    default:
      return 'Connecting...';
  }
}

/**
 * OAuth state context provider
 * Provides OAuth state management across components
 */
export interface OAuthStateContextValue {
  oauthState: OAuthState;
  initiateOAuth: (provider: 'microsoft' | 'google', returnUrl?: string) => Promise<void>;
  handleOAuthCallback: (params: any) => Promise<any>;
  clearOAuthState: () => void;
  canRetry: boolean;
}

// Export types for use in other components
export type { OAuthConfig, OAuthState };
