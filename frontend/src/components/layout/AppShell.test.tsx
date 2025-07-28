import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AppShell, type User } from './AppShell';

// Mock user data
const mockUser: User = {
  id: '1',
  name: 'Sarah Chen',
  email: 'sarah.chen@example.com',
  avatar: 'https://example.com/avatar.jpg',
};

const mockUserWithoutAvatar: User = {
  id: '2',
  name: 'Alex Morgan',
  email: 'alex.morgan@example.com',
};

// Sample content for testing
const TestContent: React.FC = () => (
  <div data-testid="main-content">
    <h1>Test Content</h1>
    <p>This is test content for the AppShell component.</p>
  </div>
);

// Mock window.innerWidth for responsive tests
const mockInnerWidth = (width: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  window.dispatchEvent(new Event('resize'));
};

describe('AppShell', () => {
  let mockOnSidebarToggle: ReturnType<typeof vi.fn>;
  let mockOnAIPanelToggle: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnSidebarToggle = vi.fn();
    mockOnAIPanelToggle = vi.fn();
    
    // Reset window size to desktop
    mockInnerWidth(1024);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      render(
        <AppShell>
          <TestContent />
        </AppShell>
      );

      expect(screen.getByTestId('main-content')).toBeInTheDocument();
    });

    it('renders with all required ARIA landmarks', () => {
      render(
        <AppShell>
          <TestContent />
        </AppShell>
      );

      expect(screen.getByRole('banner')).toBeInTheDocument(); // header
      expect(screen.getByRole('navigation')).toBeInTheDocument(); // sidebar
      expect(screen.getByRole('main')).toBeInTheDocument(); // main content
    });

    it('renders the application title', () => {
      render(
        <AppShell>
          <TestContent />
        </AppShell>
      );

      expect(screen.getByText('Helmsman')).toBeInTheDocument();
      expect(screen.getByText('AI')).toBeInTheDocument();
    });

    it('renders navigation links with proper accessibility', () => {
      render(
        <AppShell>
          <TestContent />
        </AppShell>
      );

      const dashboardLink = screen.getByLabelText('Dashboard - View your tasks and daily planning');
      const projectsLink = screen.getByLabelText('Projects - Manage your projects and tasks');
      const reflectionLink = screen.getByLabelText('Reflection - Journal your thoughts and insights');
      const settingsLink = screen.getByLabelText('Settings - Configure your preferences and account');

      expect(dashboardLink).toBeInTheDocument();
      expect(projectsLink).toBeInTheDocument();
      expect(reflectionLink).toBeInTheDocument();
      expect(settingsLink).toBeInTheDocument();
    });
  });

  describe('User Display', () => {
    it('renders user information when user is provided', () => {
      render(
        <AppShell user={mockUser}>
          <TestContent />
        </AppShell>
      );

      expect(screen.getByText(mockUser.name)).toBeInTheDocument();
      expect(screen.getByText(mockUser.email)).toBeInTheDocument();
      expect(screen.getByAltText(`${mockUser.name}'s avatar`)).toBeInTheDocument();
    });

    it('renders user initials when no avatar is provided', () => {
      render(
        <AppShell user={mockUserWithoutAvatar}>
          <TestContent />
        </AppShell>
      );

      expect(screen.getByText(mockUserWithoutAvatar.name)).toBeInTheDocument();
      expect(screen.getByText('A')).toBeInTheDocument(); // First letter of Alex
    });

    it('does not render user section when no user is provided', () => {
      render(
        <AppShell>
          <TestContent />
        </AppShell>
      );

      expect(screen.queryByText('Sarah Chen')).not.toBeInTheDocument();
      expect(screen.queryByText('Alex Morgan')).not.toBeInTheDocument();
    });
  });

  describe('Sidebar Functionality', () => {
    it('renders expanded sidebar by default', () => {
      render(
        <AppShell>
          <TestContent />
        </AppShell>
      );

      const sidebar = screen.getByLabelText('Main navigation');
      expect(sidebar).not.toHaveClass('md:w-16');
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('renders collapsed sidebar when sidebarCollapsed is true', () => {
      render(
        <AppShell sidebarCollapsed={true}>
          <TestContent />
        </AppShell>
      );

      const sidebar = screen.getByLabelText('Main navigation');
      expect(sidebar).toHaveClass('md:w-16');
    });

    it('calls onSidebarToggle when sidebar toggle button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <AppShell onSidebarToggle={mockOnSidebarToggle}>
          <TestContent />
        </AppShell>
      );

      const toggleButton = screen.getByLabelText('Collapse sidebar');
      await user.click(toggleButton);

      expect(mockOnSidebarToggle).toHaveBeenCalledTimes(1);
    });

    it('updates toggle button aria-label based on sidebar state', () => {
      const { rerender } = render(
        <AppShell sidebarCollapsed={false}>
          <TestContent />
        </AppShell>
      );

      expect(screen.getByLabelText('Collapse sidebar')).toBeInTheDocument();

      rerender(
        <AppShell sidebarCollapsed={true}>
          <TestContent />
        </AppShell>
      );

      expect(screen.getByLabelText('Expand sidebar')).toBeInTheDocument();
    });
  });

  describe('AI Panel Functionality', () => {
    it('does not render AI panel by default', () => {
      render(
        <AppShell>
          <TestContent />
        </AppShell>
      );

      expect(screen.queryByLabelText('AI assistant panel')).not.toBeInTheDocument();
    });

    it('renders AI panel when aiPanelOpen is true', () => {
      render(
        <AppShell aiPanelOpen={true}>
          <TestContent />
        </AppShell>
      );

      expect(screen.getByLabelText('AI assistant panel')).toBeInTheDocument();
      expect(screen.getByText('AI Assistant')).toBeInTheDocument();
    });

    it('calls onAIPanelToggle when AI toggle button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <AppShell onAIPanelToggle={mockOnAIPanelToggle}>
          <TestContent />
        </AppShell>
      );

      const toggleButton = screen.getByLabelText('Open AI assistant');
      await user.click(toggleButton);

      expect(mockOnAIPanelToggle).toHaveBeenCalledTimes(1);
    });

    it('updates AI toggle button appearance when panel is open', () => {
      const { rerender } = render(
        <AppShell aiPanelOpen={false}>
          <TestContent />
        </AppShell>
      );

      expect(screen.getByLabelText('Open AI assistant')).toBeInTheDocument();

      rerender(
        <AppShell aiPanelOpen={true}>
          <TestContent />
        </AppShell>
      );

      expect(screen.getByLabelText('Close AI assistant')).toBeInTheDocument();
    });

    it('renders AI panel close button and handles click', async () => {
      const user = userEvent.setup();
      
      render(
        <AppShell aiPanelOpen={true} onAIPanelToggle={mockOnAIPanelToggle}>
          <TestContent />
        </AppShell>
      );

      const closeButton = screen.getByLabelText('Close AI assistant panel');
      await user.click(closeButton);

      expect(mockOnAIPanelToggle).toHaveBeenCalledTimes(1);
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('handles Ctrl+B keyboard shortcut for sidebar toggle', async () => {
      render(
        <AppShell onSidebarToggle={mockOnSidebarToggle}>
          <TestContent />
        </AppShell>
      );

      fireEvent.keyDown(document, { key: 'b', ctrlKey: true });

      expect(mockOnSidebarToggle).toHaveBeenCalledTimes(1);
    });

    it('handles Cmd+B keyboard shortcut for sidebar toggle', async () => {
      render(
        <AppShell onSidebarToggle={mockOnSidebarToggle}>
          <TestContent />
        </AppShell>
      );

      fireEvent.keyDown(document, { key: 'b', metaKey: true });

      expect(mockOnSidebarToggle).toHaveBeenCalledTimes(1);
    });

    it('handles Ctrl+I keyboard shortcut for AI panel toggle', async () => {
      render(
        <AppShell onAIPanelToggle={mockOnAIPanelToggle}>
          <TestContent />
        </AppShell>
      );

      fireEvent.keyDown(document, { key: 'i', ctrlKey: true });

      expect(mockOnAIPanelToggle).toHaveBeenCalledTimes(1);
    });

    it('handles Escape key to close AI panel when open', async () => {
      render(
        <AppShell aiPanelOpen={true} onAIPanelToggle={mockOnAIPanelToggle}>
          <TestContent />
        </AppShell>
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(mockOnAIPanelToggle).toHaveBeenCalledTimes(1);
    });

    it('does not close AI panel on Escape when panel is closed', async () => {
      render(
        <AppShell aiPanelOpen={false} onAIPanelToggle={mockOnAIPanelToggle}>
          <TestContent />
        </AppShell>
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(mockOnAIPanelToggle).not.toHaveBeenCalled();
    });

    it('prevents default behavior for keyboard shortcuts', async () => {
      render(
        <AppShell onSidebarToggle={mockOnSidebarToggle}>
          <TestContent />
        </AppShell>
      );

      const event = new KeyboardEvent('keydown', { 
        key: 'b', 
        ctrlKey: true, 
        bubbles: true,
        cancelable: true 
      });
      
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
      document.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('Skip Links', () => {
    it('renders skip links for accessibility', () => {
      render(
        <AppShell>
          <TestContent />
        </AppShell>
      );

      expect(screen.getByText('Skip to main content')).toBeInTheDocument();
      expect(screen.getByText('Skip to navigation')).toBeInTheDocument();
    });

    it('renders skip to AI link when AI panel is open', () => {
      render(
        <AppShell aiPanelOpen={true}>
          <TestContent />
        </AppShell>
      );

      expect(screen.getByText('Skip to AI assistant')).toBeInTheDocument();
    });

    it('does not render skip to AI link when AI panel is closed', () => {
      render(
        <AppShell aiPanelOpen={false}>
          <TestContent />
        </AppShell>
      );

      expect(screen.queryByText('Skip to AI assistant')).not.toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('handles mobile viewport correctly', async () => {
      // Start with desktop
      render(
        <AppShell sidebarCollapsed={false}>
          <TestContent />
        </AppShell>
      );

      // Switch to mobile
      mockInnerWidth(640);
      
      await waitFor(() => {
        const sidebar = screen.getByLabelText('Main navigation');
        expect(sidebar).toHaveClass('hidden', 'md:flex');
      });
    });

    it('shows mobile overlay when sidebar is open on mobile', async () => {
      mockInnerWidth(640);
      
      render(
        <AppShell sidebarCollapsed={false} onSidebarToggle={mockOnSidebarToggle}>
          <TestContent />
        </AppShell>
      );

      // Wait for mobile state to be detected
      await waitFor(() => {
        const sidebar = screen.getByLabelText('Main navigation');
        expect(sidebar).toHaveClass('fixed');
      });
    });

    it('handles overlay click to close sidebar on mobile', async () => {
      const user = userEvent.setup();
      mockInnerWidth(640);
      
      render(
        <AppShell sidebarCollapsed={false} onSidebarToggle={mockOnSidebarToggle}>
          <TestContent />
        </AppShell>
      );

      // Wait for mobile state and overlay
      await waitFor(() => {
        const overlay = document.querySelector('.fixed.inset-0.z-30');
        expect(overlay).toBeInTheDocument();
      });

      // Click overlay
      const overlay = document.querySelector('.fixed.inset-0.z-30') as HTMLElement;
      await user.click(overlay);

      expect(mockOnSidebarToggle).toHaveBeenCalledTimes(1);
    });
  });

  describe('Focus Management', () => {
    it('focuses main content when skip to main is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <AppShell>
          <TestContent />
        </AppShell>
      );

      const skipButton = screen.getByText('Skip to main content');
      await user.click(skipButton);

      const mainElement = screen.getByRole('main');
      expect(mainElement).toHaveFocus();
    });

    it('focuses sidebar when skip to navigation is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <AppShell>
          <TestContent />
        </AppShell>
      );

      const skipButton = screen.getByText('Skip to navigation');
      await user.click(skipButton);

      const sidebarElement = screen.getByLabelText('Main navigation');
      expect(sidebarElement).toHaveFocus();
    });

    it('focuses AI panel when skip to AI is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <AppShell aiPanelOpen={true}>
          <TestContent />
        </AppShell>
      );

      const skipButton = screen.getByText('Skip to AI assistant');
      await user.click(skipButton);

      const aiPanel = screen.getByLabelText('AI assistant panel');
      expect(aiPanel).toHaveFocus();
    });
  });

  describe('Custom Props', () => {
    it('applies custom className to container', () => {
      render(
        <AppShell className="custom-shell-class">
          <TestContent />
        </AppShell>
      );

      const container = screen.getByTestId('main-content').closest('.min-h-screen');
      expect(container).toHaveClass('custom-shell-class');
    });

    it('renders custom children content', () => {
      const customContent = <div data-testid="custom-content">Custom Content</div>;
      
      render(
        <AppShell>
          {customContent}
        </AppShell>
      );

      expect(screen.getByTestId('custom-content')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles missing callback functions gracefully', () => {
      render(
        <AppShell>
          <TestContent />
        </AppShell>
      );

      // These should not throw errors
      fireEvent.keyDown(document, { key: 'b', ctrlKey: true });
      fireEvent.keyDown(document, { key: 'i', ctrlKey: true });
      fireEvent.keyDown(document, { key: 'Escape' });

      // Component should still be functional
      expect(screen.getByTestId('main-content')).toBeInTheDocument();
    });

    it('handles rapid resize events', async () => {
      render(
        <AppShell>
          <TestContent />
        </AppShell>
      );

      // Trigger multiple rapid resize events
      for (let i = 0; i < 5; i++) {
        mockInnerWidth(800 + i * 100);
      }

      // Component should remain stable
      expect(screen.getByTestId('main-content')).toBeInTheDocument();
    });

    it('cleans up event listeners on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
      const windowRemoveEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      
      const { unmount } = render(
        <AppShell>
          <TestContent />
        </AppShell>
      );

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      expect(windowRemoveEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    });
  });
});
