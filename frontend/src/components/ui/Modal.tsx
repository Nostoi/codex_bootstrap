import React, { useEffect, useRef, useCallback } from 'react';
import { cn, trapFocus } from '@/lib/utils';

/**
 * Modal Props Interface
 */
export interface ModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Modal title for accessibility */
  title: string;
  /** Modal content */
  children: React.ReactNode;
  /** Size of the modal */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Whether clicking the backdrop closes the modal */
  closeOnBackdropClick?: boolean;
  /** Whether pressing Escape closes the modal */
  closeOnEscape?: boolean;
  /** Custom className for modal content */
  className?: string;
  /** Additional ARIA properties */
  'aria-describedby'?: string;
  /** Custom footer content */
  footer?: React.ReactNode;
  /** Whether to show the default close button */
  showCloseButton?: boolean;
}

/**
 * Close Icon Component
 */
const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={cn('w-5 h-5', className)}
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2"
    viewBox="0 0 24 24"
    stroke="currentColor"
    aria-hidden="true"
  >
    <path d="M6 18L18 6M6 6l12 12" />
  </svg>
);

/**
 * Modal - Accessible modal dialog with ADHD-friendly interactions
 *
 * Features:
 * - Focus management and trapping
 * - Backdrop and Escape key closing
 * - Screen reader accessible with proper ARIA labels
 * - Scroll lock when open
 * - Smooth animations with reduced motion support
 * - Multiple size variants
 * - ADHD-friendly consistent patterns
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closeOnBackdropClick = true,
  closeOnEscape = true,
  className,
  'aria-describedby': ariaDescribedBy,
  footer,
  showCloseButton = true,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Handle backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (closeOnBackdropClick && e.target === backdropRef.current) {
        onClose();
      }
    },
    [closeOnBackdropClick, onClose]
  );

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;
    if (typeof document === 'undefined') return; // SSR check

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Focus management
  useEffect(() => {
    if (!isOpen) return;

    // Store previously focused element
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Set up focus trapping
    const modalElement = modalRef.current;
    if (!modalElement) return;

    const cleanup = trapFocus(modalElement);

    // Cleanup function
    return () => {
      cleanup();
      // Restore focus to previous element
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen]);

  // Body scroll lock
  useEffect(() => {
    if (!isOpen) return;
    if (typeof window === 'undefined' || typeof document === 'undefined') return; // SSR check

    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [isOpen]);

  // Don't render if not open
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4',
  };

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby={ariaDescribedBy}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300 ease-in-out"
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div
        ref={modalRef}
        className={cn(
          // Base modal styling
          'relative bg-white rounded-lg shadow-xl',
          'transform transition-all duration-300 ease-in-out',
          'max-h-[90vh] flex flex-col',
          'focus:outline-none',

          // Size variants
          sizeClasses[size],

          // Width constraints
          'w-full',

          // ADHD-friendly styling
          'border border-neutral-200',

          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <h2 id="modal-title" className="text-xl font-semibold text-neutral-900">
            {title}
          </h2>

          {showCloseButton && (
            <button
              onClick={onClose}
              className={cn(
                'p-2 text-neutral-400 hover:text-neutral-600 rounded-md',
                'transition-colors duration-200',
                'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2'
              )}
              aria-label="Close modal"
            >
              <CloseIcon />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex justify-end gap-3 p-6 border-t border-neutral-200">{footer}</div>
        )}
      </div>
    </div>
  );
};

/**
 * Modal Hook - For easier modal state management
 */
export const useModal = (initialOpen = false) => {
  const [isOpen, setIsOpen] = React.useState(initialOpen);

  const openModal = useCallback(() => setIsOpen(true), []);
  const closeModal = useCallback(() => setIsOpen(false), []);
  const toggleModal = useCallback(() => setIsOpen(prev => !prev), []);

  return {
    isOpen,
    openModal,
    closeModal,
    toggleModal,
  };
};

/**
 * Confirmation Modal - Pre-configured modal for confirmations
 */
export interface ConfirmationModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Callback when user confirms */
  onConfirm: () => void;
  /** Title of the confirmation */
  title: string;
  /** Description text */
  description: string;
  /** Text for confirm button */
  confirmText?: string;
  /** Text for cancel button */
  cancelText?: string;
  /** Variant for confirm button styling */
  confirmVariant?: 'primary' | 'destructive';
  /** Whether the confirm action is loading */
  loading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary',
  loading = false,
}) => {
  const handleConfirm = useCallback(() => {
    onConfirm();
    if (!loading) {
      onClose();
    }
  }, [onConfirm, onClose, loading]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className={cn(
              'px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-md',
              'hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={cn(
              'px-4 py-2 text-sm font-medium text-white rounded-md',
              'focus:outline-none focus:ring-2 focus:ring-offset-2',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              {
                'bg-brand-600 hover:bg-brand-700 focus:ring-brand-500':
                  confirmVariant === 'primary',
                'bg-red-600 hover:bg-red-700 focus:ring-red-500': confirmVariant === 'destructive',
              }
            )}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Loading...
              </div>
            ) : (
              confirmText
            )}
          </button>
        </div>
      }
    >
      <p className="text-neutral-600">{description}</p>
    </Modal>
  );
};
