'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useRef } from 'react';

export function useTokenRefresh() {
  const { refreshToken, isAuthenticated, user } = useAuth();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      // Clear interval if user is not authenticated
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Set up token refresh interval (refresh every 13 minutes, tokens expire in 15)
    intervalRef.current = setInterval(async () => {
      try {
        await refreshToken();
      } catch (error) {
        console.error('Automatic token refresh failed:', error);
      }
    }, 13 * 60 * 1000); // 13 minutes

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAuthenticated, user, refreshToken]);

  // Also refresh on window focus (in case tab was inactive for a while)
  useEffect(() => {
    const handleFocus = async () => {
      if (isAuthenticated && user) {
        try {
          await refreshToken();
        } catch (error) {
          console.error('Focus token refresh failed:', error);
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isAuthenticated, user, refreshToken]);
}
