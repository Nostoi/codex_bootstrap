import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Button Props Interface
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  /** Button size */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Loading state with spinner */
  loading?: boolean;
  /** Full width button */
  fullWidth?: boolean;
  /** Icon component to display before text */
  leftIcon?: React.ReactNode;
  /** Icon component to display after text */
  rightIcon?: React.ReactNode;
  /** Energy level for ADHD-friendly styling */
  energyLevel?: 'high' | 'medium' | 'low';
  /** Children content */
  children?: React.ReactNode;
}

/**
 * Loading Spinner Component
 */
const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4', 
    lg: 'w-5 h-5'
  };

  return (
    <svg
      className={cn('animate-spin', sizeClasses[size])}
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Loading"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

/**
 * Button - ADHD-friendly button component with accessibility features
 * 
 * Features:
 * - Multiple visual variants with high contrast
 * - Loading states with accessible spinner
 * - Clear focus indicators and keyboard support
 * - Energy level styling for task management
 * - Icon support with proper spacing
 * - Consistent sizing and interaction patterns
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className,
    variant = 'primary',
    size = 'md',
    loading = false,
    fullWidth = false,
    leftIcon,
    rightIcon,
    energyLevel,
    disabled,
    children,
    ...props 
  }, ref) => {
    
    // Determine if button should be disabled (loading or explicitly disabled)
    const isDisabled = disabled || loading;

    const baseStyles = cn(
      // Core button styling
      'inline-flex items-center justify-center gap-2 rounded-lg font-medium',
      'transition-all duration-200 ease-in-out',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'disabled:cursor-not-allowed disabled:opacity-50',
      
      // Prevent shrinking for consistent button sizes
      'flex-shrink-0',
      
      // Size variants
      {
        'px-3 py-1.5 text-sm min-h-8': size === 'sm',
        'px-4 py-2 text-base min-h-10': size === 'md',
        'px-6 py-3 text-lg min-h-12': size === 'lg',
        'px-8 py-4 text-xl min-h-14': size === 'xl',
      },
      
      // Full width
      {
        'w-full': fullWidth,
      },
      
      // Variant styling with ADHD-friendly high contrast
      {
        // Primary - main call-to-action
        'bg-brand-600 text-white border border-brand-600 hover:bg-brand-700 hover:border-brand-700 focus:ring-brand-500':
          variant === 'primary' && !energyLevel,
        
        // Secondary - important but not primary action
        'bg-neutral-100 text-neutral-900 border border-neutral-300 hover:bg-neutral-200 hover:border-neutral-400 focus:ring-neutral-500':
          variant === 'secondary' && !energyLevel,
        
        // Outline - less prominent actions
        'bg-transparent text-brand-600 border-2 border-brand-600 hover:bg-brand-50 hover:text-brand-700 focus:ring-brand-500':
          variant === 'outline' && !energyLevel,
        
        // Ghost - minimal actions
        'bg-transparent text-neutral-700 border border-transparent hover:bg-neutral-100 hover:text-neutral-900 focus:ring-neutral-500':
          variant === 'ghost' && !energyLevel,
        
        // Destructive - dangerous actions
        'bg-red-600 text-white border border-red-600 hover:bg-red-700 hover:border-red-700 focus:ring-red-500':
          variant === 'destructive',
      },
      
      // Energy level styling (ADHD-specific)
      {
        // High energy - red theme
        'bg-red-600 text-white border border-red-600 hover:bg-red-700 focus:ring-red-500':
          energyLevel === 'high' && variant === 'primary',
        'bg-red-50 text-red-700 border border-red-300 hover:bg-red-100 focus:ring-red-500':
          energyLevel === 'high' && variant === 'secondary',
        'bg-transparent text-red-600 border-2 border-red-600 hover:bg-red-50 focus:ring-red-500':
          energyLevel === 'high' && variant === 'outline',
        
        // Medium energy - yellow theme
        'bg-yellow-600 text-white border border-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500':
          energyLevel === 'medium' && variant === 'primary',
        'bg-yellow-50 text-yellow-700 border border-yellow-300 hover:bg-yellow-100 focus:ring-yellow-500':
          energyLevel === 'medium' && variant === 'secondary',
        'bg-transparent text-yellow-600 border-2 border-yellow-600 hover:bg-yellow-50 focus:ring-yellow-500':
          energyLevel === 'medium' && variant === 'outline',
        
        // Low energy - green theme
        'bg-green-600 text-white border border-green-600 hover:bg-green-700 focus:ring-green-500':
          energyLevel === 'low' && variant === 'primary',
        'bg-green-50 text-green-700 border border-green-300 hover:bg-green-100 focus:ring-green-500':
          energyLevel === 'low' && variant === 'secondary',
        'bg-transparent text-green-600 border-2 border-green-600 hover:bg-green-50 focus:ring-green-500':
          energyLevel === 'low' && variant === 'outline',
      },
      
      className
    );

    return (
      <button
        ref={ref}
        className={baseStyles}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        {...props}
      >
        {/* Left icon or loading spinner */}
        {loading ? (
          <LoadingSpinner size={size === 'sm' ? 'sm' : size === 'lg' || size === 'xl' ? 'lg' : 'md'} />
        ) : leftIcon ? (
          <span className="flex-shrink-0">{leftIcon}</span>
        ) : null}
        
        {/* Button text content */}
        {children && (
          <span className={cn({ 'sr-only': loading && !children })}>{children}</span>
        )}
        
        {/* Right icon (not shown when loading) */}
        {!loading && rightIcon && (
          <span className="flex-shrink-0">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

/**
 * Icon Button - Button designed specifically for icon-only use
 */
export interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon' | 'children'> {
  /** Icon to display */
  icon: React.ReactNode;
  /** Accessible label for screen readers */
  'aria-label': string;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, className, size = 'md', ...props }, ref) => {
    const iconSizes = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
      xl: 'w-7 h-7'
    };

    return (
      <Button
        ref={ref}
        size={size}
        className={cn(
          // Make button square for icon-only use
          'aspect-square p-0',
          // Override padding for icon buttons
          {
            '!p-1': size === 'sm',
            '!p-2': size === 'md',
            '!p-3': size === 'lg',
            '!p-4': size === 'xl',
          },
          className
        )}
        {...props}
      >
        <span className={cn('flex items-center justify-center', iconSizes[size])}>
          {icon}
        </span>
      </Button>
    );
  }
);

IconButton.displayName = 'IconButton';

/**
 * Button Group - For related button collections
 */
export interface ButtonGroupProps {
  /** Button group orientation */
  orientation?: 'horizontal' | 'vertical';
  /** Whether buttons should be full width */
  fullWidth?: boolean;
  /** Custom className */
  className?: string;
  /** Children buttons */
  children: React.ReactNode;
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({
  orientation = 'horizontal',
  fullWidth = false,
  className,
  children
}) => {
  return (
    <div
      className={cn(
        'inline-flex',
        {
          'flex-row': orientation === 'horizontal',
          'flex-col': orientation === 'vertical',
          'w-full': fullWidth,
        },
        // Remove rounded corners between buttons and borders
        '[&>button:not(:first-child):not(:last-child)]:rounded-none',
        '[&>button:first-child:not(:last-child)]:rounded-r-none',
        '[&>button:last-child:not(:first-child)]:rounded-l-none',
        // Handle borders to prevent double borders
        '[&>button:not(:last-child)]:-mr-px',
        className
      )}
      role="group"
    >
      {children}
    </div>
  );
};
