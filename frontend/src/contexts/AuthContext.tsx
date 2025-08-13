'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '@/lib/api';
import { useSecureTokenManager } from '@/hooks/useSecureTokenManager';
import { useOAuthState } from '@/hooks/useOAuthState';

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  integrations?: {
    microsoft?: {
      isConnected: boolean;
      userPrincipalName?: string;
      displayName?: string;
      lastSyncAt?: string;
      status: 'active' | 'expired' | 'error' | 'disconnected';
    };
    google?: {
      isConnected: boolean;
      email?: string;
      displayName?: string;
      lastSyncAt?: string;
      status: 'active' | 'expired' | 'error' | 'disconnected';
    };
  };
}

export interface MicrosoftGraphStatus {
  isConnected: boolean;
  status: 'active' | 'expired' | 'error' | 'disconnected';
  userInfo?: {
    displayName?: string;
    userPrincipalName?: string;
    mail?: string;
  };
  lastSyncAt?: string;
  errorMessage?: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (provider: 'google' | 'microsoft') => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;

  // Microsoft Graph specific
  microsoftStatus: MicrosoftGraphStatus | null;
  isMicrosoftConnected: boolean;
  connectMicrosoft: () => Promise<void>;
  disconnectMicrosoft: () => Promise<boolean>;
  checkMicrosoftStatus: () => Promise<void>;

  // Secure token management
  getAccessToken: () => Promise<string | null>;
  isTokenValid: boolean;
  tokenError: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [microsoftStatus, setMicrosoftStatus] = useState<MicrosoftGraphStatus | null>(null);

  // Integrate secure token management
  const tokenManager = useSecureTokenManager({
    autoRefreshEnabled: true,
    refreshThresholdMinutes: 5,
    maxRetryAttempts: 3,
  });

  // Integrate OAuth state management
  const oauthState = useOAuthState();

  const isAuthenticated = !!user && tokenManager.isAuthenticated;
  const isMicrosoftConnected = microsoftStatus?.isConnected ?? false;

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);

        // Check Microsoft integration status if user is authenticated
        if (data.user?.id) {
          await checkMicrosoftStatus();
        }
      } else {
        // Try to refresh token
        const refreshed = await refreshToken();
        if (!refreshed) {
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      setMicrosoftStatus(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (provider: 'google' | 'microsoft') => {
    try {
      if (provider === 'microsoft') {
        // Use Microsoft-specific OAuth flow
        await connectMicrosoft();
      } else {
        // Use general OAuth flow for other providers
        const response = await fetch(`/api/auth/${provider}/login`, {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          // Redirect to OAuth provider
          window.location.href = data.authUrl;
        } else {
          throw new Error('Failed to initiate login');
        }
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      setUser(null);
      setMicrosoftStatus(null);
      // Redirect to home or login page
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
      // Clear user anyway
      setUser(null);
      setMicrosoftStatus(null);
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        // Token refreshed, check auth status again
        const userResponse = await fetch('/api/auth/me', {
          credentials: 'include',
        });

        if (userResponse.ok) {
          const data = await userResponse.json();
          setUser(data.user);
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  };

  // Microsoft Graph specific methods
  const connectMicrosoft = async () => {
    try {
      if (!user?.id) {
        throw new Error('User must be authenticated to connect Microsoft');
      }

      // Redirect to Microsoft OAuth via backend
      window.location.href = `/auth/microsoft/authorize/${user.id}`;
    } catch (error) {
      console.error('Microsoft connection failed:', error);
      throw error;
    }
  };

  const disconnectMicrosoft = async (): Promise<boolean> => {
    try {
      if (!user?.id) {
        return false;
      }

      await api.post(`/auth/microsoft/revoke/${user.id}`);

      // Clear Microsoft status
      setMicrosoftStatus({
        isConnected: false,
        status: 'disconnected',
      });

      return true;
    } catch (error) {
      console.error('Microsoft disconnection failed:', error);
      return false;
    }
  };

  const checkMicrosoftStatus = async () => {
    try {
      if (!user?.id) {
        setMicrosoftStatus(null);
        return;
      }

      const response = await api.get<{
        authenticated: boolean;
        userId: string;
        userInfo?: {
          id: string;
          displayName: string;
          userPrincipalName: string;
          mail: string;
        };
      }>(`/auth/microsoft/status/${user.id}`);

      const status: MicrosoftGraphStatus = {
        isConnected: response.authenticated,
        status: response.authenticated ? 'active' : 'disconnected',
        userInfo: response.userInfo
          ? {
              displayName: response.userInfo.displayName,
              userPrincipalName: response.userInfo.userPrincipalName,
              mail: response.userInfo.mail,
            }
          : undefined,
      };

      setMicrosoftStatus(status);
    } catch (error) {
      console.error('Microsoft status check failed:', error);
      setMicrosoftStatus({
        isConnected: false,
        status: 'error',
        errorMessage: 'Failed to check Microsoft connection status',
      });
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshToken,
    microsoftStatus,
    isMicrosoftConnected,
    connectMicrosoft,
    disconnectMicrosoft,
    checkMicrosoftStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook specifically for Microsoft Graph integration
export function useMicrosoftAuth() {
  const {
    microsoftStatus,
    isMicrosoftConnected,
    connectMicrosoft,
    disconnectMicrosoft,
    checkMicrosoftStatus,
  } = useAuth();

  return {
    status: microsoftStatus,
    isConnected: isMicrosoftConnected,
    connect: connectMicrosoft,
    disconnect: disconnectMicrosoft,
    checkStatus: checkMicrosoftStatus,
  };
}
