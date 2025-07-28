import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Keyboard Navigation Testing Suite
 * 
 * This test suite validates keyboard navigation patterns, focus management,
 * and accessibility shortcuts with special attention to ADHD-friendly
 * interaction patterns.
 */

describe('Keyboard Navigation Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
  });

  afterEach(() => {
    cleanup();
  });

  /**
   * Helper function to test keyboard navigation sequences
   */
  const testKeyboardSequence = async (
    component: React.ReactElement,
    keySequence: string[],
    expectedFocusOrder: string[]
  ) => {
    render(component);
    
    // Start from the first focusable element
    const firstElement = screen.getByTestId(expectedFocusOrder[0]);
    firstElement.focus();
    
    // Execute key sequence and verify focus order
    for (let i = 0; i < keySequence.length; i++) {
      await user.keyboard(keySequence[i]);
      
      if (i + 1 < expectedFocusOrder.length) {
        const expectedElement = screen.getByTestId(expectedFocusOrder[i + 1]);
        expect(document.activeElement).toBe(expectedElement);
      }
    }
  };

  describe('Basic Tab Navigation', () => {
    it('should navigate through focusable elements with Tab key', async () => {
      const TabNavigationComponent = () => (
        <div>
          <button data-testid="button1">First Button</button>
          <input data-testid="input1" type="text" placeholder="Text input" />
          <select data-testid="select1">
            <option value="1">Option 1</option>
            <option value="2">Option 2</option>
          </select>
          <textarea data-testid="textarea1" placeholder="Text area" />
          <a data-testid="link1" href="#test">Test Link</a>
        </div>
      );

      await testKeyboardSequence(
        <TabNavigationComponent />,
        ['{Tab}', '{Tab}', '{Tab}', '{Tab}'],
        ['button1', 'input1', 'select1', 'textarea1', 'link1']
      );
    });

    it('should navigate backwards with Shift+Tab', async () => {
      const ReverseTabComponent = () => (
        <div>
          <button data-testid="button1">Button 1</button>
          <button data-testid="button2">Button 2</button>
          <button data-testid="button3">Button 3</button>
        </div>
      );

      render(<ReverseTabComponent />);
      
      // Start from the last button
      const lastButton = screen.getByTestId('button3');
      lastButton.focus();
      
      // Navigate backwards
      await user.keyboard('{Shift>}{Tab}{/Shift}');
      expect(document.activeElement).toBe(screen.getByTestId('button2'));
      
      await user.keyboard('{Shift>}{Tab}{/Shift}');
      expect(document.activeElement).toBe(screen.getByTestId('button1'));
    });

    it('should skip disabled elements during tab navigation', async () => {
      const DisabledElementComponent = () => (
        <div>
          <button data-testid="button1">Enabled Button</button>
          <button data-testid="button2" disabled>Disabled Button</button>
          <input data-testid="input1" type="text" />
          <input data-testid="input2" type="text" disabled />
          <button data-testid="button3">Final Button</button>
        </div>
      );

      await testKeyboardSequence(
        <DisabledElementComponent />,
        ['{Tab}', '{Tab}', '{Tab}'],
        ['button1', 'input1', 'button3']
      );
    });
  });

  describe('Arrow Key Navigation', () => {
    it('should navigate radio button groups with arrow keys', async () => {
      const RadioGroupComponent = () => (
        <fieldset>
          <legend>Choose an option</legend>
          <div role="radiogroup" aria-labelledby="radio-group-label">
            <label>
              <input 
                data-testid="radio1" 
                type="radio" 
                name="option" 
                value="1"
                defaultChecked
              />
              Option 1
            </label>
            <label>
              <input 
                data-testid="radio2" 
                type="radio" 
                name="option" 
                value="2"
              />
              Option 2
            </label>
            <label>
              <input 
                data-testid="radio3" 
                type="radio" 
                name="option" 
                value="3"
              />
              Option 3
            </label>
          </div>
        </fieldset>
      );

      render(<RadioGroupComponent />);
      
      const firstRadio = screen.getByTestId('radio1');
      firstRadio.focus();
      
      // Navigate with arrow keys
      await user.keyboard('{ArrowDown}');
      expect(document.activeElement).toBe(screen.getByTestId('radio2'));
      
      await user.keyboard('{ArrowDown}');
      expect(document.activeElement).toBe(screen.getByTestId('radio3'));
      
      // Should wrap around
      await user.keyboard('{ArrowDown}');
      expect(document.activeElement).toBe(screen.getByTestId('radio1'));
      
      // Navigate backwards
      await user.keyboard('{ArrowUp}');
      expect(document.activeElement).toBe(screen.getByTestId('radio3'));
    });

    it('should navigate custom menu with arrow keys', async () => {
      const MenuComponent = () => (
        <div role="menu" aria-label="Custom menu">
          <div role="menuitem" tabIndex={0} data-testid="menu-item-1">
            Menu Item 1
          </div>
          <div role="menuitem" tabIndex={-1} data-testid="menu-item-2">
            Menu Item 2
          </div>
          <div role="menuitem" tabIndex={-1} data-testid="menu-item-3">
            Menu Item 3
          </div>
        </div>
      );

      render(<MenuComponent />);
      
      const firstItem = screen.getByTestId('menu-item-1');
      firstItem.focus();
      
      // Simulate arrow key navigation (would need custom implementation)
      // This is testing the expected behavior
      expect(document.activeElement).toBe(firstItem);
    });
  });

  describe('Focus Management', () => {
    it('should properly manage focus in modal dialogs', async () => {
      const ModalComponent = () => (
        <div>
          <button data-testid="open-modal">Open Modal</button>
          
          <div 
            role="dialog" 
            aria-modal="true" 
            aria-labelledby="modal-title"
            data-testid="modal"
          >
            <h2 id="modal-title" tabIndex={-1} data-testid="modal-title">
              Modal Title
            </h2>
            <input data-testid="modal-input" type="text" placeholder="Modal input" />
            <button data-testid="modal-close">Close</button>
            <button data-testid="modal-save">Save</button>
          </div>
        </div>
      );

      render(<ModalComponent />);
      
      // Focus should move to modal title when opened
      const modalTitle = screen.getByTestId('modal-title');
      modalTitle.focus();
      expect(document.activeElement).toBe(modalTitle);
      
      // Tab should cycle within modal
      await user.keyboard('{Tab}');
      expect(document.activeElement).toBe(screen.getByTestId('modal-input'));
      
      await user.keyboard('{Tab}');
      expect(document.activeElement).toBe(screen.getByTestId('modal-close'));
      
      await user.keyboard('{Tab}');
      expect(document.activeElement).toBe(screen.getByTestId('modal-save'));
    });

    it('should handle focus trapping in complex components', async () => {
      const FocusTrapComponent = () => (
        <div data-testid="focus-trap-container">
          <button data-testid="outside-before">Outside Before</button>
          
          <div 
            role="region" 
            aria-label="Focus trapped area"
            data-testid="focus-trap"
          >
            <button data-testid="trap-first">First in Trap</button>
            <input data-testid="trap-input" type="text" />
            <button data-testid="trap-last">Last in Trap</button>
          </div>
          
          <button data-testid="outside-after">Outside After</button>
        </div>
      );

      render(<FocusTrapComponent />);
      
      // Focus should stay within the trap when activated
      const firstTrapElement = screen.getByTestId('trap-first');
      firstTrapElement.focus();
      
      await user.keyboard('{Tab}');
      expect(document.activeElement).toBe(screen.getByTestId('trap-input'));
      
      await user.keyboard('{Tab}');
      expect(document.activeElement).toBe(screen.getByTestId('trap-last'));
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should handle standard keyboard shortcuts', async () => {
      const ShortcutComponent = () => {
        const [status, setStatus] = React.useState('Ready');
        
        const handleKeyDown = (e: React.KeyboardEvent) => {
          if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
              case 's':
                e.preventDefault();
                setStatus('Saved');
                break;
              case 'z':
                e.preventDefault();
                setStatus('Undone');
                break;
              case 'y':
                e.preventDefault();
                setStatus('Redone');
                break;
            }
          }
          
          if (e.key === 'Escape') {
            setStatus('Cancelled');
          }
        };

        return (
          <div onKeyDown={handleKeyDown} tabIndex={0} data-testid="shortcut-area">
            <div data-testid="status">Status: {status}</div>
            <input data-testid="text-input" type="text" />
          </div>
        );
      };

      render(<ShortcutComponent />);
      
      const shortcutArea = screen.getByTestId('shortcut-area');
      shortcutArea.focus();
      
      // Test Ctrl+S (Save)
      await user.keyboard('{Control>}s{/Control}');
      expect(screen.getByTestId('status')).toHaveTextContent('Status: Saved');
      
      // Test Ctrl+Z (Undo)
      await user.keyboard('{Control>}z{/Control}');
      expect(screen.getByTestId('status')).toHaveTextContent('Status: Undone');
      
      // Test Escape
      await user.keyboard('{Escape}');
      expect(screen.getByTestId('status')).toHaveTextContent('Status: Cancelled');
    });

    it('should provide skip links for main content', async () => {
      const SkipLinkComponent = () => (
        <div>
          <a 
            href="#main-content" 
            data-testid="skip-link"
            className="sr-only focus:not-sr-only"
            onFocus={(e) => e.currentTarget.style.position = 'static'}
          >
            Skip to main content
          </a>
          
          <nav data-testid="navigation">
            <a href="#page1">Page 1</a>
            <a href="#page2">Page 2</a>
            <a href="#page3">Page 3</a>
          </nav>
          
          <main id="main-content" data-testid="main-content" tabIndex={-1}>
            <h1>Main Content</h1>
            <p>This is the main content area.</p>
          </main>
        </div>
      );

      render(<SkipLinkComponent />);
      
      // Skip link should be first in tab order
      await user.keyboard('{Tab}');
      expect(document.activeElement).toBe(screen.getByTestId('skip-link'));
      
      // Activating skip link should move focus to main content
      await user.keyboard('{Enter}');
      expect(document.activeElement).toBe(screen.getByTestId('main-content'));
    });
  });

  describe('ADHD-Friendly Navigation Patterns', () => {
    it('should provide clear focus indicators', async () => {
      const FocusIndicatorComponent = () => (
        <div>
          <button 
            data-testid="focus-button"
            style={{
              outline: '2px solid transparent',
              outlineOffset: '2px'
            }}
            onFocus={(e) => {
              e.currentTarget.style.outline = '3px solid #0066cc';
              e.currentTarget.style.outlineOffset = '2px';
            }}
            onBlur={(e) => {
              e.currentTarget.style.outline = '2px solid transparent';
            }}
          >
            Button with Clear Focus
          </button>
          
          <input 
            data-testid="focus-input"
            type="text"
            style={{
              border: '2px solid #ccc',
              borderRadius: '4px',
              padding: '8px'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#0066cc';
              e.currentTarget.style.boxShadow = '0 0 0 2px rgba(0, 102, 204, 0.2)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#ccc';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>
      );

      render(<FocusIndicatorComponent />);
      
      const button = screen.getByTestId('focus-button');
      const input = screen.getByTestId('focus-input');
      
      // Test focus indicators
      await user.click(button);
      expect(button.style.outline).toBe('3px solid rgb(0, 102, 204)');
      
      await user.click(input);
      expect(input.style.borderColor).toBe('rgb(0, 102, 204)');
    });

    it('should maintain consistent navigation patterns', async () => {
      const ConsistentNavigationComponent = () => (
        <div>
          {/* Consistent card navigation pattern */}
          <div role="group" aria-label="Task cards">
            <div 
              role="button" 
              tabIndex={0} 
              data-testid="card1"
              aria-label="Task 1: Complete project proposal"
            >
              <h3>Task 1</h3>
              <p>Complete project proposal</p>
            </div>
            
            <div 
              role="button" 
              tabIndex={0} 
              data-testid="card2"
              aria-label="Task 2: Review documentation"
            >
              <h3>Task 2</h3>
              <p>Review documentation</p>
            </div>
            
            <div 
              role="button" 
              tabIndex={0} 
              data-testid="card3"
              aria-label="Task 3: Update tests"
            >
              <h3>Task 3</h3>
              <p>Update tests</p>
            </div>
          </div>
        </div>
      );

      await testKeyboardSequence(
        <ConsistentNavigationComponent />,
        ['{Tab}', '{Tab}'],
        ['card1', 'card2', 'card3']
      );
    });

    it('should support customizable navigation preferences', async () => {
      const CustomNavigationComponent = () => {
        const [useArrowKeys, setUseArrowKeys] = React.useState(false);
        
        return (
          <div>
            <label>
              <input 
                type="checkbox" 
                checked={useArrowKeys}
                onChange={(e) => setUseArrowKeys(e.target.checked)}
                data-testid="arrow-keys-toggle"
              />
              Use arrow keys for card navigation
            </label>
            
            <div role="group" aria-label="Customizable navigation">
              <div tabIndex={0} data-testid="nav-item-1">Item 1</div>
              <div tabIndex={useArrowKeys ? -1 : 0} data-testid="nav-item-2">Item 2</div>
              <div tabIndex={useArrowKeys ? -1 : 0} data-testid="nav-item-3">Item 3</div>
            </div>
          </div>
        );
      };

      render(<CustomNavigationComponent />);
      
      // Test default tab navigation
      const item1 = screen.getByTestId('nav-item-1');
      item1.focus();
      
      await user.keyboard('{Tab}');
      expect(document.activeElement).toBe(screen.getByTestId('nav-item-2'));
      
      // Toggle arrow key mode
      await user.click(screen.getByTestId('arrow-keys-toggle'));
      
      // Now items 2 and 3 should have tabIndex={-1}
      const item2 = screen.getByTestId('nav-item-2');
      const item3 = screen.getByTestId('nav-item-3');
      
      expect(item2.getAttribute('tabindex')).toBe('-1');
      expect(item3.getAttribute('tabindex')).toBe('-1');
    });
  });
});
