import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Badge Variants and Props
 */
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Badge visual style variant */
  variant?: 'default' | 'energy' | 'status' | 'confidence' | 'priority';
  /** Size of the badge */
  size?: 'sm' | 'md' | 'lg';
  /** Energy level for ADHD task management (when variant="energy") */
  energyLevel?: 'high' | 'medium' | 'low';
  /** Task status (when variant="status") */
  status?: 'pending' | 'in-progress' | 'blocked' | 'done';
  /** Confidence score for AI predictions (when variant="confidence") */
  confidence?: 'high' | 'medium' | 'low';
  /** Task priority level (when variant="priority") */
  priority?: 1 | 2 | 3 | 4 | 5;
  /** Additional accessible label for screen readers */
  'aria-label'?: string;
  /** Children content */
  children: React.ReactNode;
}

/**
 * Badge - Semantic status indicators with ADHD-friendly visual design
 *
 * Features:
 * - Multiple variants for different use cases
 * - Energy level indicators with high contrast colors
 * - WCAG 2.2 AA compliant color combinations
 * - Screen reader accessible with proper ARIA labels
 * - Consistent sizing and spacing
 */
export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className,
      variant = 'default',
      size = 'md',
      energyLevel,
      status,
      confidence,
      priority,
      children,
      'aria-label': ariaLabel,
      ...props
    },
    ref
  ) => {
    // Base styles with ADHD-friendly patterns
    const baseStyles = cn(
      // Core badge styling
      'inline-flex items-center justify-center rounded-md font-medium',
      'transition-all duration-200 ease-in-out',
      'focus:outline-none focus:ring-2 focus:ring-offset-1',

      // Size variants
      {
        'px-2 py-0.5 text-xs': size === 'sm',
        'px-3 py-1 text-sm': size === 'md',
        'px-4 py-1.5 text-base': size === 'lg',
      },

      // Variant-specific styling
      {
        // Default badge
        'bg-neutral-100 text-neutral-800 border border-neutral-200': variant === 'default',

        // Energy level badges (ADHD-specific)
        'border-2 font-semibold': variant === 'energy',
        'bg-red-50 text-red-800 border-red-200 focus:ring-red-500':
          variant === 'energy' && energyLevel === 'high',
        'bg-yellow-50 text-yellow-800 border-yellow-200 focus:ring-yellow-500':
          variant === 'energy' && energyLevel === 'medium',
        'bg-green-50 text-green-800 border-green-200 focus:ring-green-500':
          variant === 'energy' && energyLevel === 'low',

        // Status badges
        'bg-neutral-50 text-neutral-700 border border-neutral-300 font-medium':
          variant === 'status' && status === 'pending',
        'bg-blue-50 text-blue-700 border border-blue-300 font-medium focus:ring-blue-500':
          variant === 'status' && status === 'in-progress',
        'bg-orange-50 text-orange-700 border border-orange-300 font-medium focus:ring-orange-500':
          variant === 'status' && status === 'blocked',
        'bg-green-50 text-green-700 border border-green-300 font-medium focus:ring-green-500':
          variant === 'status' && status === 'done',

        // Confidence badges (AI predictions)
        'bg-green-50 text-green-700 border border-green-300 font-medium':
          variant === 'confidence' && confidence === 'high',
        'bg-yellow-50 text-yellow-700 border border-yellow-300 font-medium':
          variant === 'confidence' && confidence === 'medium',
        'bg-red-50 text-red-700 border border-red-300 font-medium':
          variant === 'confidence' && confidence === 'low',

        // Priority badges
        // Priority badges
        'bg-red-100 text-red-800 border-2 border-red-400 font-semibold':
          variant === 'priority' && priority === 5,
        'bg-orange-100 text-orange-800 border-2 border-orange-400 font-semibold':
          variant === 'priority' && priority === 4,
        'bg-yellow-100 text-yellow-800 border-2 border-yellow-400 font-semibold':
          variant === 'priority' && priority === 3,
        'bg-blue-100 text-blue-800 border-2 border-blue-400 font-semibold':
          variant === 'priority' && priority === 2,
        'bg-gray-100 text-gray-800 border-2 border-gray-400 font-semibold':
          variant === 'priority' && priority === 1,
      },

      className
    );

    // Generate accessible label
    const accessibleLabel =
      ariaLabel ||
      generateAccessibleLabel({
        variant,
        energyLevel,
        status,
        confidence,
        priority,
        children,
      });

    return (
      <span ref={ref} className={baseStyles} role="img" aria-label={accessibleLabel} {...props}>
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

/**
 * Generate accessible label for screen readers
 */
function generateAccessibleLabel({
  variant,
  energyLevel,
  status,
  confidence,
  priority,
  children,
}: Pick<
  BadgeProps,
  'variant' | 'energyLevel' | 'status' | 'confidence' | 'priority' | 'children'
>): string {
  // Extract text content from children
  let content = 'badge';

  if (typeof children === 'string') {
    content = children;
  } else if (typeof children === 'number') {
    content = children.toString();
  } else if (Array.isArray(children)) {
    // Join array elements to form complete text
    content = children
      .map(child =>
        typeof child === 'string' ? child : typeof child === 'number' ? child.toString() : ''
      )
      .join('');
  }

  switch (variant) {
    case 'energy':
      return `${content}, ${energyLevel} energy level`;
    case 'status':
      return `${content}, status: ${status}`;
    case 'confidence':
      return `${content}, ${confidence} confidence`;
    case 'priority':
      return `${content}, priority ${priority} of 5`;
    default:
      return content;
  }
}

/**
 * Predefined Badge Components for common use cases
 */

export const EnergyBadge: React.FC<{ level: 'high' | 'medium' | 'low'; className?: string }> = ({
  level,
  className,
}) => (
  <Badge variant="energy" energyLevel={level} className={className}>
    {level.charAt(0).toUpperCase() + level.slice(1)} Energy
  </Badge>
);

export const StatusBadge: React.FC<{
  status: 'pending' | 'in-progress' | 'blocked' | 'done';
  className?: string;
}> = ({ status, className }) => (
  <Badge variant="status" status={status} className={className}>
    {status === 'in-progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
  </Badge>
);

export const ConfidenceBadge: React.FC<{
  confidence: 'high' | 'medium' | 'low';
  className?: string;
}> = ({ confidence, className }) => (
  <Badge variant="confidence" confidence={confidence} className={className}>
    {confidence.charAt(0).toUpperCase() + confidence.slice(1)} Confidence
  </Badge>
);

export const PriorityBadge: React.FC<{ priority: 1 | 2 | 3 | 4 | 5; className?: string }> = ({
  priority,
  className,
}) => (
  <Badge variant="priority" priority={priority} className={className}>
    P{priority}
  </Badge>
);
