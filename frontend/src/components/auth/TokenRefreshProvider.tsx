'use client';

import React from 'react';
import { useTokenRefresh } from '@/hooks/useTokenRefresh';

interface TokenRefreshProviderProps {
  children: React.ReactNode;
}

export function TokenRefreshProvider({ children }: TokenRefreshProviderProps) {
  useTokenRefresh();
  return <>{children}</>;
}
