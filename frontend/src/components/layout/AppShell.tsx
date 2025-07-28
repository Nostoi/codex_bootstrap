import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * User interface for AppShell component
 */
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

/**
 * AppShell Props Interface
 */
export interface AppShellProps {
  /** Main content to render in the content area */
  children: React.ReactNode;
  /** Whether the sidebar is collapsed (default: false on desktop, true on mobile) */
  sidebarCollapsed?: boolean;
  /** Callback when sidebar toggle is requested */
  onSidebarToggle?: () => void;
  /** Whether the AI panel is open (default: false) */
  aiPanelOpen?: boolean;
  /** Callback when AI panel toggle is requested */
  onAIPanelToggle?: () => void;
  /** Current user information for header display */
  user?: User;
  /** Custom className for the shell container */
  className?: string;
}

/**
 * AppShell Layout Component
 * 
 * Foundational layout component providing consistent navigation structure with:
 * - ADHD-friendly navigation patterns
 * - Complete accessibility with ARIA landmarks
 * - Responsive design with collapsible sidebar
 * - AI panel integration
 * - Keyboard navigation support
 * - Skip links for efficient navigation
 */
export const AppShell: React.FC<AppShellProps> = ({
  children,
  sidebarCollapsed = false,
  onSidebarToggle,
  aiPanelOpen = false,
  onAIPanelToggle,
  user,
  className,
}) => {
  const sidebarRef = useRef<HTMLElement>(null);
  const aiPanelRef = useRef<HTMLElement>(null);
  const mainContentRef = useRef<HTMLElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Handle responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + B: Toggle sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        onSidebarToggle?.();
      }
      
      // Ctrl/Cmd + I: Toggle AI panel
      if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
        e.preventDefault();
        onAIPanelToggle?.();
      }

      // Escape: Close AI panel if open
      if (e.key === 'Escape' && aiPanelOpen) {
        onAIPanelToggle?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onSidebarToggle, onAIPanelToggle, aiPanelOpen]);

  // Focus management for AI panel
  useEffect(() => {
    if (aiPanelOpen && aiPanelRef.current) {
      // Focus first focusable element in AI panel
      const focusableElements = aiPanelRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      if (firstElement) {
        firstElement.focus();
      }
    }
  }, [aiPanelOpen]);

  // Skip link handler
  const handleSkipToMain = () => {
    mainContentRef.current?.focus();
  };

  const handleSkipToNav = () => {
    sidebarRef.current?.focus();
  };

  const handleSkipToAI = () => {
    if (aiPanelOpen && aiPanelRef.current) {
      aiPanelRef.current.focus();
    }
  };

  return (
    <div className={cn('min-h-screen bg-background flex flex-col', className)}>
      {/* Skip Links - Hidden by default, visible on focus */}
      <div className="sr-only focus-within:not-sr-only">
        <div className="fixed top-0 left-0 z-50 flex gap-2 p-2 bg-background border-b border-border-primary">
          <button
            onClick={handleSkipToMain}
            className="px-3 py-2 bg-interactive-primary text-text-inverse rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-focus"
          >
            Skip to main content
          </button>
          <button
            onClick={handleSkipToNav}
            className="px-3 py-2 bg-interactive-primary text-text-inverse rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-focus"
          >
            Skip to navigation
          </button>
          {aiPanelOpen && (
            <button
              onClick={handleSkipToAI}
              className="px-3 py-2 bg-interactive-primary text-text-inverse rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-focus"
            >
              Skip to AI assistant
            </button>
          )}
        </div>
      </div>

      {/* Header */}
      <header 
        role="banner" 
        className="flex-shrink-0 bg-background-secondary border-b border-border-primary"
      >
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left side: Menu toggle and Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={onSidebarToggle}
              className={cn(
                'p-2 rounded-md text-text-secondary hover:text-text-primary hover:bg-background-muted',
                'transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-focus',
                'min-w-target min-h-target flex items-center justify-center'
              )}
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-expanded={!sidebarCollapsed}
              aria-controls="main-sidebar"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-text-primary">
                Helmsman
              </h1>
              <span className="px-2 py-1 text-xs font-medium bg-interactive-primary text-text-inverse rounded-md">
                AI
              </span>
            </div>
          </div>

          {/* Right side: AI toggle and User info */}
          <div className="flex items-center gap-3">
            <button
              onClick={onAIPanelToggle}
              className={cn(
                'p-2 rounded-md transition-colors duration-200',
                'focus:outline-none focus:ring-2 focus:ring-focus',
                'min-w-target min-h-target flex items-center justify-center',
                aiPanelOpen
                  ? 'text-interactive-primary bg-interactive-primary/10'
                  : 'text-text-secondary hover:text-text-primary hover:bg-background-muted'
              )}
              aria-label={aiPanelOpen ? 'Close AI assistant' : 'Open AI assistant'}
              aria-expanded={aiPanelOpen}
              aria-controls="ai-panel"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </button>

            {user && (
              <div className="flex items-center gap-2">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={`${user.name}'s avatar`}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-interactive-primary text-text-inverse flex items-center justify-center text-sm font-medium">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="hidden md:block">
                  <div className="text-sm font-medium text-text-primary">
                    {user.name}
                  </div>
                  <div className="text-xs text-text-secondary">
                    {user.email}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Layout Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <nav
          id="main-sidebar"
          ref={sidebarRef}
          role="navigation"
          aria-label="Main navigation"
          className={cn(
            'flex-shrink-0 bg-background-secondary border-r border-border-primary',
            'transition-all duration-300 ease-in-out',
            'focus:outline-none focus:ring-2 focus:ring-focus focus:ring-inset',
            // Desktop sizing
            'hidden md:flex md:flex-col',
            sidebarCollapsed ? 'md:w-16' : 'md:w-64',
            // Mobile overlay
            isMobile && !sidebarCollapsed && 'fixed inset-y-0 left-0 z-40 w-64 md:relative md:z-auto'
          )}
          tabIndex={-1}
        >
          {/* Navigation Links */}
          <div className="flex-1 flex flex-col py-4">
            <div className="space-y-1 px-2">
              {/* Dashboard Link */}
              <a
                href="/dashboard"
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium',
                  'text-text-secondary hover:text-text-primary hover:bg-background-muted',
                  'transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-focus',
                  'min-h-target'
                )}
                aria-label="Dashboard - View your tasks and daily planning"
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                {!sidebarCollapsed && <span>Dashboard</span>}
              </a>

              {/* Projects Link */}
              <a
                href="/projects"
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium',
                  'text-text-secondary hover:text-text-primary hover:bg-background-muted',
                  'transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-focus',
                  'min-h-target'
                )}
                aria-label="Projects - Manage your projects and tasks"
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                {!sidebarCollapsed && <span>Projects</span>}
              </a>

              {/* Reflection Link */}
              <a
                href="/reflection"
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium',
                  'text-text-secondary hover:text-text-primary hover:bg-background-muted',
                  'transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-focus',
                  'min-h-target'
                )}
                aria-label="Reflection - Journal your thoughts and insights"
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                {!sidebarCollapsed && <span>Reflection</span>}
              </a>

              {/* Settings Link */}
              <a
                href="/settings"
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium',
                  'text-text-secondary hover:text-text-primary hover:bg-background-muted',
                  'transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-focus',
                  'min-h-target'
                )}
                aria-label="Settings - Configure your preferences and account"
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {!sidebarCollapsed && <span>Settings</span>}
              </a>
            </div>
          </div>
        </nav>

        {/* Mobile Sidebar Overlay */}
        {isMobile && !sidebarCollapsed && (
          <div
            className="fixed inset-0 z-30 bg-black bg-opacity-50 md:hidden"
            onClick={onSidebarToggle}
            aria-hidden="true"
          />
        )}

        {/* Main Content Area */}
        <main
          ref={mainContentRef}
          role="main"
          className="flex-1 overflow-auto focus:outline-none"
          tabIndex={-1}
        >
          {children}
        </main>

        {/* AI Panel */}
        {aiPanelOpen && (
          <aside
            id="ai-panel"
            ref={aiPanelRef}
            role="complementary"
            aria-label="AI assistant panel"
            className={cn(
              'flex-shrink-0 w-80 bg-background-secondary border-l border-border-primary',
              'overflow-y-auto focus:outline-none focus:ring-2 focus:ring-focus focus:ring-inset'
            )}
            tabIndex={-1}
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-text-primary">
                  AI Assistant
                </h2>
                <button
                  onClick={onAIPanelToggle}
                  className={cn(
                    'p-1 rounded-md text-text-secondary hover:text-text-primary hover:bg-background-muted',
                    'transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-focus'
                  )}
                  aria-label="Close AI assistant panel"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="p-3 rounded-md bg-background border border-border-primary">
                  <p className="text-sm text-text-secondary">
                    AI assistant is ready to help with task planning, organization, and productivity insights.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-text-primary">Quick Actions</h3>
                  <button className="w-full text-left p-2 rounded-md text-sm text-text-secondary hover:text-text-primary hover:bg-background-muted transition-colors">
                    Plan my day
                  </button>
                  <button className="w-full text-left p-2 rounded-md text-sm text-text-secondary hover:text-text-primary hover:bg-background-muted transition-colors">
                    Optimize schedule
                  </button>
                  <button className="w-full text-left p-2 rounded-md text-sm text-text-secondary hover:text-text-primary hover:bg-background-muted transition-colors">
                    Generate insights
                  </button>
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};

export default AppShell;
