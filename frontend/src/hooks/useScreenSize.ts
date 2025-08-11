'use client';

import { useState, useEffect } from 'react';

interface ScreenSize {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

const breakpoints = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export function useScreenSize(): ScreenSize {
  const [screenSize, setScreenSize] = useState<ScreenSize>({
    width: 0,
    height: 0,
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    breakpoint: 'lg',
  });

  useEffect(() => {
    function updateSize() {
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Determine breakpoint
      let breakpoint: ScreenSize['breakpoint'] = 'xs';
      if (width >= breakpoints['2xl']) breakpoint = '2xl';
      else if (width >= breakpoints.xl) breakpoint = 'xl';
      else if (width >= breakpoints.lg) breakpoint = 'lg';
      else if (width >= breakpoints.md) breakpoint = 'md';
      else if (width >= breakpoints.sm) breakpoint = 'sm';

      // Determine device type
      const isMobile = width < breakpoints.md;
      const isTablet = width >= breakpoints.md && width < breakpoints.lg;
      const isDesktop = width >= breakpoints.lg;

      setScreenSize({
        width,
        height,
        isMobile,
        isTablet,
        isDesktop,
        breakpoint,
      });
    }

    // Set initial size
    updateSize();

    // Add event listener
    window.addEventListener('resize', updateSize);

    // Cleanup
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  return screenSize;
}

export function useIsMobile(): boolean {
  const { isMobile } = useScreenSize();
  return isMobile;
}

export function useIsTablet(): boolean {
  const { isTablet } = useScreenSize();
  return isTablet;
}

export function useIsDesktop(): boolean {
  const { isDesktop } = useScreenSize();
  return isDesktop;
}

// Hook for ADHD-specific mobile optimizations
export function useADHDMobileOptimizations() {
  const screen = useScreenSize();

  return {
    // Reduce visual complexity on mobile
    shouldSimplifyUI: screen.isMobile,

    // Larger touch targets for better accessibility
    touchTargetSize: screen.isMobile ? 'min-h-[44px] min-w-[44px]' : 'min-h-[32px] min-w-[32px]',

    // Adjusted font sizes for ADHD readability
    headingSize: screen.isMobile ? 'text-xl' : 'text-2xl',
    bodySize: screen.isMobile ? 'text-base' : 'text-sm',

    // Spacing optimizations
    cardPadding: screen.isMobile ? 'p-4' : 'p-6',
    sectionSpacing: screen.isMobile ? 'space-y-4' : 'space-y-6',

    // Grid columns for responsive layouts
    taskGridCols: screen.isMobile ? 'grid-cols-1' : screen.isTablet ? 'grid-cols-2' : 'grid-cols-3',

    // Widget grid adjustments
    widgetGridCols: screen.isMobile
      ? 'grid-cols-1'
      : screen.isTablet
        ? 'grid-cols-2'
        : 'grid-cols-4',

    // Focus session optimizations
    focusControlSize: screen.isMobile ? 'btn-lg' : 'btn-md',

    // Energy indicator size
    energyBadgeSize: screen.isMobile ? 'badge-lg' : 'badge-md',
  };
}

export default useScreenSize;
