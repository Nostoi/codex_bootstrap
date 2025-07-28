/**
 * UI Primitives Library - ADHD-Friendly Components
 * 
 * This barrel export file provides easy access to all UI primitive components
 * with consistent ADHD-optimized patterns and accessibility features.
 */

// Badge Components
export {
  Badge,
  EnergyBadge,
  StatusBadge,
  ConfidenceBadge,
  PriorityBadge,
  type BadgeProps,
} from './Badge';

// Button Components
export {
  Button,
  IconButton,
  ButtonGroup,
  type ButtonProps,
  type IconButtonProps,
  type ButtonGroupProps,
} from './Button';

// Modal Components
export {
  Modal,
  useModal,
  ConfirmationModal,
  type ModalProps,
  type ConfirmationModalProps,
} from './Modal';

// Toast Components
export {
  ToastProvider,
  useToast,
  useToastActions,
  toast,
  type Toast,
  type ToastType,
} from './Toast';

// Skeleton Components
export {
  Skeleton,
  AvatarSkeleton,
  TextSkeleton,
  CardSkeleton,
  TableSkeleton,
  ButtonSkeleton,
  TaskCardSkeleton,
  DashboardSkeleton,
  type SkeletonProps,
  type AvatarSkeletonProps,
  type TextSkeletonProps,
  type CardSkeletonProps,
  type TableSkeletonProps,
  type ButtonSkeletonProps,
} from './Skeleton';

// Error Boundary Components
export {
  ErrorBoundary,
  withErrorBoundary,
  NetworkErrorFallback,
  MinimalErrorFallback,
  PageErrorBoundary,
  ComponentErrorBoundary,
  UserFriendlyError,
  NetworkError,
  type ErrorFallbackProps,
  type WithErrorBoundaryProps,
} from './ErrorBoundary';

// Re-export existing components for completeness
export { default as TaskCard } from './TaskCard';
export { default as Dashboard } from './Dashboard';
export { default as FocusView } from './FocusView';
export { default as ProjectCard } from './ProjectCard';
export { default as ChatGPTIntegration } from './ChatGPTIntegration';
export { default as ReflectionPrompt } from './ReflectionPrompt';

// Theme components
export { ThemeProvider } from './theme-provider';
export { ThemeToggle } from './theme-toggle';
