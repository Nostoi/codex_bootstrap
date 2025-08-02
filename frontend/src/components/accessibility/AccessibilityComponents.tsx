/**
 * Accessibility React components for ADHD-friendly interfaces
 * 
 * This module provides ready-to-use React components that implement
 * WCAG 2.2 AA compliance and ADHD-optimized interaction patterns.
 */

import React, { 
  createContext, 
  useContext, 
  useEffect, 
  useRef, 
  useState, 
  useCallback,
  forwardRef,
  ReactNode,
  HTMLAttributes,
  ButtonHTMLAttributes,
  InputHTMLAttributes
} from 'react';
import { 
  FocusTrap, 
  LiveAnnouncer, 
  KeyboardNavigator,
  useAccessibilityPreferences,
  useReducedMotion,
  useHighContrast 
} from '../../lib/accessibility';
import { useKeyboardNavigation, useGlobalShortcuts } from '../../lib/keyboard-navigation';
import { ADHD_ARIA, srText, focusStyles } from '../../lib/aria-constants';

// ===== CONTEXT =====

interface AccessibilityContextType {
  announcer: LiveAnnouncer;
  preferences: ReturnType<typeof useAccessibilityPreferences>;
  reducedMotion: boolean;
  highContrast: boolean;
}

const AccessibilityContext = createContext<AccessibilityContextType | null>(null);

export function useAccessibilityContext() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibilityContext must be used within AccessibilityProvider');
  }
  return context;
}

// ===== PROVIDER =====

interface AccessibilityProviderProps {
  children: ReactNode;
}

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const announcer = LiveAnnouncer.getInstance();
  const preferences = useAccessibilityPreferences();
  const reducedMotion = useReducedMotion();
  const highContrast = useHighContrast();

  return (
    <AccessibilityContext.Provider 
      value={{ 
        announcer, 
        preferences, 
        reducedMotion, 
        highContrast 
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

// ===== SKIP LINKS =====

interface SkipLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
}

export function SkipLink({ href, children, className = '' }: SkipLinkProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const target = document.querySelector(href) as HTMLElement;
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      className={`skip-link ${className}`}
      style={{
        position: 'absolute',
        left: '-10000px',
        top: 'auto',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
        ...focusStyles.default,
        // TODO: Fix CSS-in-JS pseudo-selector typing - temporarily disabled
        zIndex: 999999,
      }}
    >
      {children}
    </a>
  );
}

// ===== LIVE REGION =====

interface LiveRegionProps {
  level?: 'polite' | 'assertive';
  atomic?: boolean;
  children?: ReactNode;
  className?: string;
}

export function LiveRegion({ 
  level = 'polite', 
  atomic = true, 
  children, 
  className = '' 
}: LiveRegionProps) {
  return (
    <div
      aria-live={level}
      aria-atomic={atomic}
      className={`sr-only ${className}`}
      style={{
        position: 'absolute',
        left: '-10000px',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  );
}

// ===== ACCESSIBLE BUTTON =====

interface AccessibleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  energyLevel?: 'high' | 'medium' | 'low';
  cognitiveLoad?: 'low' | 'medium' | 'high';
  announcement?: string;
  children: ReactNode;
}

export const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  ({ 
    variant = 'primary',
    size = 'md',
    loading = false,
    energyLevel,
    cognitiveLoad,
    announcement,
    disabled,
    onClick,
    children,
    className = '',
    ...props 
  }, ref) => {
    const { announcer } = useAccessibilityContext();
    const [isPressed, setIsPressed] = useState(false);

    const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      if (loading || disabled) return;

      setIsPressed(true);
      setTimeout(() => setIsPressed(false), 150);

      if (announcement) {
        announcer.announce(announcement);
      }

      onClick?.(e);
    }, [loading, disabled, announcement, onClick, announcer]);

    const ariaProps = {
      ...props,
      ...(energyLevel && ADHD_ARIA.energyIndicator(energyLevel)),
      ...(cognitiveLoad && ADHD_ARIA.cognitiveLoad(cognitiveLoad)),
    };

    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled || loading}
        onClick={handleClick}
        className={`
          accessible-button 
          accessible-button--${variant}
          accessible-button--${size}
          ${loading ? 'accessible-button--loading' : ''}
          ${isPressed ? 'accessible-button--pressed' : ''}
          ${className}
        `}
        style={{
          ...focusStyles.default,
          transition: 'all 0.2s ease',
          cursor: disabled || loading ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
        }}
        {...ariaProps}
      >
        {loading && (
          <span 
            className="accessible-button__spinner" 
            aria-hidden="true"
            style={{
              display: 'inline-block',
              width: '1em',
              height: '1em',
              marginRight: '0.5em',
              border: '2px solid transparent',
              borderTop: '2px solid currentColor',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
        )}
        <span className={loading ? 'sr-only' : ''}>
          {children}
        </span>
        {loading && (
          <span className="sr-only">Loading</span>
        )}
      </button>
    );
  }
);

AccessibleButton.displayName = 'AccessibleButton';

// ===== ACCESSIBLE INPUT =====

interface AccessibleInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  size?: 'sm' | 'md' | 'lg';
  energyLevel?: 'high' | 'medium' | 'low';
}

export const AccessibleInput = forwardRef<HTMLInputElement, AccessibleInputProps>(
  ({ 
    label,
    error,
    hint,
    required = false,
    size = 'md',
    energyLevel,
    id,
    className = '',
    ...props 
  }, ref) => {
    const generatedId = useRef(`input-${Math.random().toString(36).substr(2, 9)}`);
    const inputId = id || generatedId.current;
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;

    const describedBy = [
      hint && hintId,
      error && errorId,
    ].filter(Boolean).join(' ');

    return (
      <div className={`accessible-input-group accessible-input-group--${size}`}>
        <label 
          htmlFor={inputId}
          className={`accessible-input-label ${required ? 'accessible-input-label--required' : ''}`}
        >
          {label}
          {required && <span aria-label="required"> *</span>}
        </label>
        
        {hint && (
          <div 
            id={hintId}
            className="accessible-input-hint"
          >
            {hint}
          </div>
        )}
        
        <input
          ref={ref}
          id={inputId}
          required={required}
          aria-describedby={describedBy || undefined}
          aria-invalid={error ? 'true' : 'false'}
          className={`
            accessible-input
            accessible-input--${size}
            ${error ? 'accessible-input--error' : ''}
            ${className}
          `}
          style={{
            // TODO: Fix focusStyles to work with inline styles
            // ...(error ? focusStyles.error : focusStyles.default),
          }}
          {...(energyLevel && { 'data-energy-level': energyLevel })}
          {...props}
        />
        
        {error && (
          <div 
            id={errorId}
            className="accessible-input-error"
            role="alert"
            aria-live="polite"
          >
            {error}
          </div>
        )}
      </div>
    );
  }
);

AccessibleInput.displayName = 'AccessibleInput';

// ===== FOCUS TRAP COMPONENT =====

interface FocusTrapProps {
  active?: boolean;
  children: ReactNode;
  restoreFocus?: boolean;
  className?: string;
}

export function FocusTrapComponent({ 
  active = true, 
  children, 
  restoreFocus = true,
  className = '' 
}: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const focusTrapRef = useRef<FocusTrap | null>(null);

  useEffect(() => {
    if (active && containerRef.current) {
      focusTrapRef.current = new FocusTrap(containerRef.current);
      focusTrapRef.current.activate();
    }

    return () => {
      if (focusTrapRef.current) {
        focusTrapRef.current.deactivate();
        focusTrapRef.current = null;
      }
    };
  }, [active, restoreFocus]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}

// ===== MODAL COMPONENT =====

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Modal({ 
  isOpen, 
  onClose, 
  title, 
  description, 
  children, 
  size = 'md',
  className = '' 
}: ModalProps) {
  const { announcer } = useAccessibilityContext();
  const modalRef = useRef<HTMLDivElement>(null);
  const titleId = useRef(`modal-title-${Math.random().toString(36).substr(2, 9)}`);
  const descId = useRef(`modal-desc-${Math.random().toString(36).substr(2, 9)}`);

  useGlobalShortcuts();

  useEffect(() => {
    if (isOpen) {
      announcer.announce(`Modal opened: ${title}`);
      
      if (typeof document !== 'undefined') { // SSR check
        const handleEscape = (e: KeyboardEvent) => {
          if (e.key === 'Escape') {
            onClose();
          }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
      }
    }
  }, [isOpen, title, onClose, announcer]);

  useEffect(() => {
    if (isOpen && modalRef.current && typeof document !== 'undefined') { // SSR check
      modalRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <FocusTrapComponent active={isOpen}>
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId.current}
          aria-describedby={description ? descId.current : undefined}
          tabIndex={-1}
          className={`modal modal--${size} ${className}`}
          style={{
            backgroundColor: 'var(--color-surface-primary)',
            borderRadius: 'var(--border-radius-lg)',
            boxShadow: 'var(--shadow-xl)',
            padding: 'var(--space-6)',
            margin: 'var(--space-4)',
            maxHeight: '90vh',
            overflow: 'auto',
            ...focusStyles.default,
          }}
        >
          <header className="modal__header">
            <h2 id={titleId.current} className="modal__title">
              {title}
            </h2>
            {description && (
              <p id={descId.current} className="modal__description">
                {description}
              </p>
            )}
            <AccessibleButton
              variant="ghost"
              size="sm"
              onClick={onClose}
              aria-label="Close modal"
              className="modal__close"
              style={{
                position: 'absolute',
                top: 'var(--space-4)',
                right: 'var(--space-4)',
              }}
            >
              ×
            </AccessibleButton>
          </header>
          
          <div className="modal__content">
            {children}
          </div>
        </div>
      </FocusTrapComponent>
    </div>
  );
}

// ===== ENERGY INDICATOR =====

interface EnergyIndicatorProps {
  level: 'high' | 'medium' | 'low';
  label?: string;
  showText?: boolean;
  className?: string;
}

export function EnergyIndicator({ 
  level, 
  label, 
  showText = true, 
  className = '' 
}: EnergyIndicatorProps) {
  const { announcer } = useAccessibilityContext();
  
  const energyConfig = {
    high: { color: 'var(--color-energy-high)', icon: '⚡', text: 'High Energy' },
    medium: { color: 'var(--color-energy-medium)', icon: '🔥', text: 'Medium Energy' },
    low: { color: 'var(--color-energy-low)', icon: '🌱', text: 'Low Energy' },
  };

  const config = energyConfig[level];
  const ariaLabel = label || srText.energyLevel(level);

  return (
    <div 
      className={`energy-indicator energy-indicator--${level} ${className}`}
      role="status"
      aria-label={ariaLabel}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-1)',
        padding: 'var(--space-1) var(--space-2)',
        borderRadius: 'var(--border-radius-sm)',
        backgroundColor: config.color,
        color: 'var(--color-text-primary)',
        fontSize: 'var(--font-size-sm)',
      }}
      data-energy-level={level}
    >
      <span aria-hidden="true">{config.icon}</span>
      {showText && <span>{config.text}</span>}
    </div>
  );
}

// ===== PROGRESS INDICATOR =====

interface ProgressIndicatorProps {
  current: number;
  total: number;
  label?: string;
  showPercentage?: boolean;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ProgressIndicator({ 
  current, 
  total, 
  label,
  showPercentage = true,
  showText = true,
  size = 'md',
  className = '' 
}: ProgressIndicatorProps) {
  const percentage = Math.round((current / total) * 100);
  const progressText = srText.progress(current, total);

  return (
    <div className={`progress-indicator progress-indicator--${size} ${className}`}>
      {(label || showText) && (
        <div className="progress-indicator__label">
          {label && <span>{label}</span>}
          {showText && (
            <span className="progress-indicator__text">
              {showPercentage ? `${percentage}%` : `${current}/${total}`}
            </span>
          )}
        </div>
      )}
      
      <div 
        className="progress-indicator__track"
        style={{
          width: '100%',
          height: size === 'sm' ? '4px' : size === 'lg' ? '12px' : '8px',
          backgroundColor: 'var(--color-surface-secondary)',
          borderRadius: 'var(--border-radius-sm)',
          overflow: 'hidden',
        }}
      >
        <div
          className="progress-indicator__fill"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={current}
          aria-valuetext={progressText}
          aria-label={label || 'Progress indicator'}
          style={{
            width: `${percentage}%`,
            height: '100%',
            backgroundColor: 'var(--color-primary)',
            transition: 'width 0.3s ease',
          }}
        />
      </div>
      
      <LiveRegion>
        {progressText}
      </LiveRegion>
    </div>
  );
}

// ===== KEYBOARD NAVIGATION CONTAINER =====

interface KeyboardNavigationContainerProps extends HTMLAttributes<HTMLDivElement> {
  direction?: 'horizontal' | 'vertical' | 'both';
  loop?: boolean;
  children: ReactNode;
}

export function KeyboardNavigationContainer({ 
  direction = 'both',
  loop = true,
  children,
  className = '',
  ...props 
}: KeyboardNavigationContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useKeyboardNavigation(containerRef, {
    direction,
    loop,
    skipDisabled: true,
    homeEndBehavior: 'first-last',
  });

  return (
    <div 
      ref={containerRef}
      className={`keyboard-navigation-container ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

// ===== COGNITIVE LOAD INDICATOR =====

interface CognitiveLoadIndicatorProps {
  level: 'low' | 'medium' | 'high';
  label?: string;
  className?: string;
}

export function CognitiveLoadIndicator({ 
  level, 
  label, 
  className = '' 
}: CognitiveLoadIndicatorProps) {
  const loadConfig = {
    low: { color: 'var(--color-success)', icon: '🧠', text: 'Low Cognitive Load' },
    medium: { color: 'var(--color-warning)', icon: '🤔', text: 'Medium Cognitive Load' },
    high: { color: 'var(--color-error)', icon: '😵', text: 'High Cognitive Load' },
  };

  const config = loadConfig[level];
  const ariaLabel = label || `Cognitive load: ${level}`;

  return (
    <div 
      className={`cognitive-load-indicator cognitive-load-indicator--${level} ${className}`}
      role="status"
      aria-label={ariaLabel}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-1)',
        padding: 'var(--space-1) var(--space-2)',
        borderRadius: 'var(--border-radius-sm)',
        backgroundColor: config.color,
        color: 'var(--color-text-primary)',
        fontSize: 'var(--font-size-sm)',
      }}
      data-cognitive-load={level}
    >
      <span aria-hidden="true">{config.icon}</span>
      <span className="sr-only">{config.text}</span>
    </div>
  );
}

// ===== LOADING SPINNER =====

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

export function LoadingSpinner({ 
  size = 'md', 
  label = 'Loading', 
  className = '' 
}: LoadingSpinnerProps) {
  const { reducedMotion } = useAccessibilityContext();
  
  const sizeMap = {
    sm: '16px',
    md: '24px',
    lg: '32px',
  };

  return (
    <div 
      className={`loading-spinner loading-spinner--${size} ${className}`}
      role="status"
      aria-label={label}
      style={{
        display: 'inline-block',
        width: sizeMap[size],
        height: sizeMap[size],
        border: '2px solid var(--color-surface-secondary)',
        borderTop: '2px solid var(--color-primary)',
        borderRadius: '50%',
        animation: reducedMotion ? 'none' : 'spin 1s linear infinite',
      }}
    >
      <span className="sr-only">{label}</span>
    </div>
  );
}

// ===== CSS ANIMATION =====

const spinKeyframes = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// Inject keyframes into document head
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = spinKeyframes;
  document.head.appendChild(style);
}
