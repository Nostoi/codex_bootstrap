'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '@/lib/api';

// Extended user interface to include integration status
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

// Microsoft Graph specific token information
export interface MicrosoftGraphToken {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
  scopes?: string[];
  isValid: boolean;
}

// Integration status for calendar providers
export interface CalendarIntegration {
  provider: 'microsoft' | 'google';
  isConnected: boolean;
  status: 'active' | 'expired' | 'error' | 'disconnected';
  lastSyncAt?: string;
  errorMessage?: string;
  userInfo?: {
    displayName?: string;
    email?: string;
    userPrincipalName?: string;
  };
}

// Enhanced auth context with integration management
export interface AuthContextType {
  // Core authentication
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Core auth methods
  login: (provider: 'google' | 'microsoft') => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;

  // Microsoft Graph specific methods
  microsoftToken: MicrosoftGraphToken | null;
  isMicrosoftConnected: boolean;
  connectMicrosoft: () => Promise<void>;
  disconnectMicrosoft: () => Promise<boolean>;
  checkMicrosoftStatus: () => Promise<CalendarIntegration | null>;
  refreshMicrosoftToken: () => Promise<boolean>;

  // Integration management
  integrations: CalendarIntegration[];
  refreshIntegrations: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [microsoftToken, setMicrosoftToken] = useState<MicrosoftGraphToken | null>(null);
  const [integrations, setIntegrations] = useState<CalendarIntegration[]>([]);

  const isAuthenticated = !!user;
  const isMicrosoftConnected = microsoftToken?.isValid ?? false;

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Check main authentication
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);

        // Check integrations if user is authenticated
        if (data.user?.id) {
          await Promise.all([checkMicrosoftStatus(), refreshIntegrations()]);
        }
      } else {
        // Try to refresh token
        const refreshed = await refreshToken();
        if (!refreshed) {
          setUser(null);
          setMicrosoftToken(null);
          setIntegrations([]);
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      setMicrosoftToken(null);
      setIntegrations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (provider: 'google' | 'microsoft') => {
    try {
      if (provider === 'microsoft') {
        // Use the Microsoft-specific OAuth flow
        await connectMicrosoft();
      } else {
        // Use the general OAuth flow for other providers
        const response = await fetch(`/api/auth/${provider}/login`, {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
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

      // Clear all state
      setUser(null);
      setMicrosoftToken(null);
      setIntegrations([]);

      // Redirect to home or login page
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
      // Clear state anyway
      setUser(null);
      setMicrosoftToken(null);
      setIntegrations([]);
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
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

      // Call the backend to initiate Microsoft OAuth
      const response = await api.get<{ url: string }>(`/auth/microsoft/authorize/${user.id}`);

      if (response.url) {
        // Redirect to Microsoft OAuth
        window.location.href = response.url;
      } else {
        throw new Error('Failed to get Microsoft authorization URL');
      }
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

      // Clear Microsoft token state
      setMicrosoftToken(null);

      // Update integrations
      setIntegrations(prev =>
        prev.map(integration =>
          integration.provider === 'microsoft'
            ? { ...integration, isConnected: false, status: 'disconnected' }
            : integration
        )
      );

      return true;
    } catch (error) {
      console.error('Microsoft disconnection failed:', error);
      return false;
    }
  };

  const checkMicrosoftStatus = async (): Promise<CalendarIntegration | null> => {
    try {
      if (!user?.id) {
        return null;
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

      const integration: CalendarIntegration = {
        provider: 'microsoft',
        isConnected: response.authenticated,
        status: response.authenticated ? 'active' : 'disconnected',
        userInfo: response.userInfo
          ? {
              displayName: response.userInfo.displayName,
              email: response.userInfo.mail,
              userPrincipalName: response.userInfo.userPrincipalName,
            }
          : undefined,
      };

      // Update Microsoft token state
      setMicrosoftToken({
        isValid: response.authenticated,
        // Note: We don't expose actual tokens to frontend for security
      });

      return integration;
    } catch (error) {
      console.error('Microsoft status check failed:', error);

      const errorIntegration: CalendarIntegration = {
        provider: 'microsoft',
        isConnected: false,
        status: 'error',
        errorMessage: 'Failed to check Microsoft connection status',
      };

      setMicrosoftToken({ isValid: false });
      return errorIntegration;
    }
  };

  const refreshMicrosoftToken = async (): Promise<boolean> => {
    try {
      if (!user?.id) {
        return false;
      }

      // Backend handles token refresh automatically
      // We just need to check the status
      const integration = await checkMicrosoftStatus();
      return integration?.isConnected ?? false;
    } catch (error) {
      console.error('Microsoft token refresh failed:', error);
      return false;
    }
  };

  const refreshIntegrations = async () => {
    try {
      if (!user?.id) {
        setIntegrations([]);
        return;
      }

      const microsoftIntegration = await checkMicrosoftStatus();
      const updatedIntegrations: CalendarIntegration[] = [];

      if (microsoftIntegration) {
        updatedIntegrations.push(microsoftIntegration);
      }

      // Add other integrations here (Google, etc.)
      // const googleIntegration = await checkGoogleStatus();
      // if (googleIntegration) {
      //   updatedIntegrations.push(googleIntegration);
      // }

      setIntegrations(updatedIntegrations);
    } catch (error) {
      console.error('Failed to refresh integrations:', error);
      setIntegrations([]);
    }
  };

  const value: AuthContextType = {
    // Core authentication
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshToken,

    // Microsoft Graph specific
    microsoftToken,
    isMicrosoftConnected,
    connectMicrosoft,
    disconnectMicrosoft,
    checkMicrosoftStatus,
    refreshMicrosoftToken,

    // Integration management
    integrations,
    refreshIntegrations,
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
    microsoftToken,
    isMicrosoftConnected,
    connectMicrosoft,
    disconnectMicrosoft,
    checkMicrosoftStatus,
    refreshMicrosoftToken,
  } = useAuth();

  return {
    token: microsoftToken,
    isConnected: isMicrosoftConnected,
    connect: connectMicrosoft,
    disconnect: disconnectMicrosoft,
    checkStatus: checkMicrosoftStatus,
    refreshToken: refreshMicrosoftToken,
  };
}

export default AuthProvider;
