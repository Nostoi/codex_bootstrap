import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Skeleton Props Interface
 */
export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Width of the skeleton */
  width?: string | number;
  /** Height of the skeleton */
  height?: string | number;
  /** Whether to show animation */
  animate?: boolean;
  /** Border radius variant */
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  /** Number of lines for text skeleton */
  lines?: number;
  /** Custom className */
  className?: string;
}

/**
 * Base Skeleton Component
 *
 * Features:
 * - Customizable dimensions and border radius
 * - Optional shimmer animation with reduced motion support
 * - ADHD-friendly subtle animation
 * - Accessible with proper ARIA labels
 * - Multiple preset variants for common use cases
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  animate = true,
  radius = 'md',
  lines,
  className,
  ...props
}) => {
  const baseStyles = cn(
    // Base skeleton styling
    'bg-neutral-200 select-none',

    // Animation with reduced motion support
    {
      'animate-pulse': animate,
      'motion-reduce:animate-none': animate,
    },

    // Border radius variants
    {
      'rounded-none': radius === 'none',
      'rounded-sm': radius === 'sm',
      'rounded-md': radius === 'md',
      'rounded-lg': radius === 'lg',
      'rounded-full': radius === 'full',
    },

    className
  );

  const style: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  // Multi-line skeleton for text
  if (lines && lines > 1) {
    return (
      <div className="space-y-2" {...props}>
        {Array.from({ length: lines }, (_, index) => (
          <div
            key={index}
            className={cn(
              baseStyles,
              'h-4',
              // Make last line shorter for more realistic appearance
              index === lines - 1 ? 'w-3/4' : 'w-full'
            )}
            style={index === 0 ? style : undefined}
            role="img"
            aria-label={`Loading content line ${index + 1}`}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={baseStyles} style={style} role="img" aria-label="Loading content" {...props} />
  );
};

/**
 * Preset Skeleton Components for common use cases
 */

/**
 * Avatar Skeleton - Circular skeleton for profile pictures
 */
export interface AvatarSkeletonProps {
  /** Size of the avatar */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Custom className */
  className?: string;
}

export const AvatarSkeleton: React.FC<AvatarSkeletonProps> = ({ size = 'md', className }) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  return (
    <Skeleton className={cn(sizes[size], className)} radius="full" aria-label="Loading avatar" />
  );
};

/**
 * Text Skeleton - For text content with multiple lines
 */
export interface TextSkeletonProps {
  /** Number of lines */
  lines?: number;
  /** Custom className */
  className?: string;
}

export const TextSkeleton: React.FC<TextSkeletonProps> = ({ lines = 3, className }) => (
  <Skeleton
    lines={lines}
    className={className}
    aria-label={`Loading text content with ${lines} lines`}
  />
);

/**
 * Card Skeleton - Complete card layout skeleton
 */
export interface CardSkeletonProps {
  /** Whether to show avatar */
  showAvatar?: boolean;
  /** Whether to show image */
  showImage?: boolean;
  /** Number of text lines */
  textLines?: number;
  /** Custom className */
  className?: string;
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({
  showAvatar = false,
  showImage = false,
  textLines = 3,
  className,
}) => (
  <div className={cn('p-4 space-y-4', className)} role="img" aria-label="Loading card content">
    {/* Header with optional avatar */}
    {showAvatar && (
      <div className="flex items-center space-x-3">
        <AvatarSkeleton size="md" />
        <div className="space-y-2">
          <Skeleton width="120px" height="16px" />
          <Skeleton width="80px" height="14px" />
        </div>
      </div>
    )}

    {/* Optional image */}
    {showImage && <Skeleton height="200px" width="100%" radius="lg" />}

    {/* Text content */}
    <div className="space-y-2">
      <Skeleton height="20px" width="100%" />
      <TextSkeleton lines={textLines} />
    </div>

    {/* Action buttons */}
    <div className="flex space-x-2 pt-2">
      <Skeleton width="80px" height="36px" radius="md" />
      <Skeleton width="60px" height="36px" radius="md" />
    </div>
  </div>
);

/**
 * Table Skeleton - For table/list loading states
 */
export interface TableSkeletonProps {
  /** Number of rows */
  rows?: number;
  /** Number of columns */
  columns?: number;
  /** Whether to show header */
  showHeader?: boolean;
  /** Custom className */
  className?: string;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 5,
  columns = 4,
  showHeader = true,
  className,
}) => (
  <div className={cn('space-y-3', className)} role="img" aria-label="Loading table content">
    {/* Header */}
    {showHeader && (
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }, (_, index) => (
          <Skeleton key={`header-${index}`} height="16px" width="100%" />
        ))}
      </div>
    )}

    {/* Rows */}
    <div className="space-y-2">
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div
          key={`row-${rowIndex}`}
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }, (_, colIndex) => (
            <Skeleton
              key={`cell-${rowIndex}-${colIndex}`}
              height="14px"
              width={colIndex === 0 ? '80%' : '100%'} // First column slightly shorter
            />
          ))}
        </div>
      ))}
    </div>
  </div>
);

/**
 * Button Skeleton - For button loading states
 */
export interface ButtonSkeletonProps {
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Button width */
  width?: string | number;
  /** Custom className */
  className?: string;
}

export const ButtonSkeleton: React.FC<ButtonSkeletonProps> = ({
  size = 'md',
  width,
  className,
}) => {
  const heights = {
    sm: '32px',
    md: '40px',
    lg: '48px',
  };

  const defaultWidths = {
    sm: '80px',
    md: '100px',
    lg: '120px',
  };

  return (
    <Skeleton
      height={heights[size]}
      width={width || defaultWidths[size]}
      radius="md"
      className={className}
      aria-label="Loading button"
    />
  );
};

/**
 * TaskCard Skeleton - Specific to task management interface
 */
export const TaskCardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div
    className={cn('p-4 border border-neutral-200 rounded-lg space-y-3', className)}
    role="img"
    aria-label="Loading task card"
  >
    {/* Header with priority and energy badges */}
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <Skeleton width="20px" height="20px" radius="full" />
        <Skeleton width="80px" height="20px" radius="sm" />
      </div>
      <Skeleton width="60px" height="24px" radius="sm" />
    </div>

    {/* Title */}
    <Skeleton height="20px" width="100%" />

    {/* Description */}
    <TextSkeleton lines={2} />

    {/* Metadata row */}
    <div className="flex items-center space-x-4 pt-2">
      <Skeleton width="40px" height="16px" radius="sm" />
      <Skeleton width="60px" height="16px" radius="sm" />
      <Skeleton width="50px" height="16px" radius="sm" />
    </div>
  </div>
);

/**
 * Dashboard Skeleton - For main dashboard loading
 */
export const DashboardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('space-y-6', className)} role="img" aria-label="Loading dashboard">
    {/* Header */}
    <div className="flex items-center justify-between">
      <Skeleton height="32px" width="200px" />
      <div className="flex space-x-2">
        <ButtonSkeleton size="md" />
        <ButtonSkeleton size="md" />
      </div>
    </div>

    {/* Stats cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="p-4 border border-neutral-200 rounded-lg space-y-2">
          <Skeleton height="16px" width="100px" />
          <Skeleton height="24px" width="60px" />
        </div>
      ))}
    </div>

    {/* Main content */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        {Array.from({ length: 5 }, (_, index) => (
          <TaskCardSkeleton key={index} />
        ))}
      </div>
      <div className="space-y-4">
        <CardSkeleton showImage textLines={2} />
        <CardSkeleton textLines={4} />
      </div>
    </div>
  </div>
);
