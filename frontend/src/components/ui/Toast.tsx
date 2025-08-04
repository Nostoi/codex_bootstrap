import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

/**
 * Toast Types and Interfaces
 */
export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
}

/**
 * Toast Context
 */
interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

/**
 * Toast Icons
 */
const ToastIcons = {
  info: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
        clipRule="evenodd"
      />
    </svg>
  ),
  success: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
        clipRule="evenodd"
      />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
        clipRule="evenodd"
      />
    </svg>
  ),
};

/**
 * Close Icon
 */
const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={cn('w-4 h-4', className)}
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path d="M6 18L18 6M6 6l12 12" />
  </svg>
);

/**
 * Individual Toast Component
 */
const ToastComponent: React.FC<{ toast: Toast; onRemove: (id: string) => void }> = ({
  toast,
  onRemove,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const handleDismiss = useCallback(() => {
    setIsLeaving(true);
    setTimeout(() => onRemove(toast.id), 300);
  }, [toast.id, onRemove]);

  // Auto-dismiss timer
  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(handleDismiss, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast.duration, handleDismiss]);

  // Entry animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const typeStyles = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800',
  };

  const iconColors = {
    info: 'text-blue-400',
    success: 'text-green-400',
    warning: 'text-yellow-400',
    error: 'text-red-400',
  };

  return (
    <div
      className={cn(
        // Base toast styling
        'flex w-full max-w-sm overflow-hidden rounded-lg border shadow-lg',
        'transform transition-all duration-300 ease-in-out',

        // Type-specific styling
        typeStyles[toast.type],

        // Animation states
        {
          'translate-x-full opacity-0': (!isVisible && !isLeaving) || isLeaving,
          'translate-x-0 opacity-100': isVisible && !isLeaving,
        }
      )}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      {/* Icon */}
      <div className={cn('flex items-center justify-center w-12 p-3', iconColors[toast.type])}>
        {ToastIcons[toast.type]}
      </div>

      {/* Content */}
      <div className="flex-1 p-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="text-sm font-medium">{toast.title}</h4>
            {toast.description && <p className="mt-1 text-sm opacity-90">{toast.description}</p>}
            {toast.action && (
              <button
                onClick={toast.action.onClick}
                className={cn(
                  'mt-2 text-sm font-medium underline',
                  'hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-current rounded',
                  'transition-colors duration-200'
                )}
              >
                {toast.action.label}
              </button>
            )}
          </div>

          {/* Dismiss button */}
          {toast.dismissible !== false && (
            <button
              onClick={handleDismiss}
              className={cn(
                'ml-3 p-1 rounded-md opacity-70 hover:opacity-100',
                'focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-current',
                'transition-opacity duration-200'
              )}
              aria-label="Dismiss notification"
            >
              <CloseIcon />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Toast Container Component
 */
const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div
      className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map(toast => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastComponent toast={toast} onRemove={removeToast} />
        </div>
      ))}
    </div>
  );
};

/**
 * Toast Provider Component
 */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = {
      id,
      duration: 5000, // Default 5 seconds
      dismissible: true, // Default dismissible
      ...toast,
    };

    setToasts(prev => [...prev, newToast]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const value: ToastContextType = {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};

/**
 * Toast Hook
 */
export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

/**
 * Hook-based toast functions that can be used in components
 */
export const useToastActions = () => {
  const { addToast } = useToast();

  return {
    info: useCallback(
      (title: string, description?: string, options?: Partial<Toast>) => {
        addToast({ type: 'info', title, description, ...options });
      },
      [addToast]
    ),

    success: useCallback(
      (title: string, description?: string, options?: Partial<Toast>) => {
        addToast({ type: 'success', title, description, ...options });
      },
      [addToast]
    ),

    warning: useCallback(
      (title: string, description?: string, options?: Partial<Toast>) => {
        addToast({ type: 'warning', title, description, ...options });
      },
      [addToast]
    ),

    error: useCallback(
      (title: string, description?: string, options?: Partial<Toast>) => {
        addToast({ type: 'error', title, description, ...options });
      },
      [addToast]
    ),
  };
};
