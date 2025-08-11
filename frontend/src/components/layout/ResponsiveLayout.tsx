'use client';

import React, { ReactNode } from 'react';
import MobileNavigation from './MobileNavigation';

interface ResponsiveLayoutProps {
  children: ReactNode;
  className?: string;
  showBottomNav?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

export function ResponsiveLayout({
  children,
  className = '',
  showBottomNav = true,
  maxWidth = 'xl',
}: ResponsiveLayoutProps) {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-7xl',
    '2xl': 'max-w-7xl',
    full: 'max-w-none',
  };

  return (
    <div className="min-h-screen bg-base-100">
      {/* Navigation */}
      <MobileNavigation />

      {/* Main Content Area */}
      <main
        className={`
          ${maxWidthClasses[maxWidth]} mx-auto
          px-4 sm:px-6 lg:px-8
          py-4 sm:py-6 lg:py-8
          ${showBottomNav ? 'pb-20 lg:pb-8' : ''}
          ${className}
        `}
      >
        {children}
      </main>

      {/* Bottom padding for mobile navigation */}
      {showBottomNav && <div className="h-16 lg:hidden" />}
    </div>
  );
}

export default ResponsiveLayout;
