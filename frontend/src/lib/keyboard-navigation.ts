/**
 * Advanced keyboard navigation utilities for ADHD-friendly interfaces
 * 
 * This module provides sophisticated keyboard navigation patterns that reduce
 * cognitive load and provide consistent, predictable interactions.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { KEYBOARD_SHORTCUTS } from './aria-constants';

// ===== TYPES =====

export interface NavigationItem {
  id: string;
  element: HTMLElement;
  disabled?: boolean;
  group?: string;
  priority?: number;
}

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
  preventDefault?: boolean;
  action: () => void;
  description: string;
  context?: string;
}

export interface NavigationOptions {
  loop?: boolean;
  direction?: 'horizontal' | 'vertical' | 'both';
  skipDisabled?: boolean;
  homeEndBehavior?: 'first-last' | 'none';
  typeahead?: boolean;
  groupNavigation?: boolean;
}

// ===== KEYBOARD NAVIGATION MANAGER =====

export class KeyboardNavigationManager {
  private items: NavigationItem[] = [];
  private currentIndex = -1;
  private container: HTMLElement | null = null;
  private options: NavigationOptions;
  private typeaheadBuffer = '';
  private typeaheadTimeout: NodeJS.Timeout | null = null;
  private shortcuts: Map<string, KeyboardShortcut> = new Map();

  constructor(container: HTMLElement | null, options: NavigationOptions = {}) {
    this.container = container;
    this.options = {
      loop: true,
      direction: 'both',
      skipDisabled: true,
      homeEndBehavior: 'first-last',
      typeahead: false,
      groupNavigation: false,
      ...options,
    };

    this.initialize();
  }

  private initialize() {
    if (!this.container) return;

    this.container.addEventListener('keydown', this.handleKeyDown.bind(this));
    this.updateItems();

    // Set up mutation observer to track dynamic changes
    const observer = new MutationObserver(() => {
      this.updateItems();
    });

    observer.observe(this.container, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['tabindex', 'disabled', 'aria-disabled'],
    });
  }

  private updateItems() {
    if (!this.container) return;

    const elements = this.container.querySelectorAll(
      '[role="menuitem"], [role="tab"], [role="gridcell"], [tabindex="0"], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]'
    );

    this.items = Array.from(elements).map((element, index) => ({
      id: element.id || `nav-item-${index}`,
      element: element as HTMLElement,
      disabled: this.isElementDisabled(element as HTMLElement),
      group: element.getAttribute('data-group') || undefined,
      priority: parseInt(element.getAttribute('data-priority') || '0'),
    }));

    // Sort by priority if specified
    this.items.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    // Initialize tabindex values if not already set
    const availableItems = this.options.skipDisabled 
      ? this.items.filter(item => !item.disabled)
      : this.items;

    availableItems.forEach((item, index) => {
      // Only set tabindex if it's not already set appropriately
      const currentTabindex = item.element.getAttribute('tabindex');
      if (currentTabindex === null || (currentTabindex !== '0' && currentTabindex !== '-1')) {
        item.element.setAttribute('tabindex', index === 0 ? '0' : '-1');
      }
    });

    // Set initial current index if not set
    if (this.currentIndex === -1 && availableItems.length > 0) {
      this.currentIndex = 0;
      availableItems[0].element.classList.add('kb-focused');
    }
  }

  private isElementDisabled(element: HTMLElement): boolean {
    return (
      element.hasAttribute('disabled') ||
      element.getAttribute('aria-disabled') === 'true' ||
      element.closest('[aria-disabled="true"]') !== null
    );
  }

  private handleKeyDown(event: KeyboardEvent) {
    const key = event.key;
    const { ctrlKey, altKey, shiftKey, metaKey } = event;

    // Check for registered shortcuts first
    const shortcutKey = this.getShortcutKey(key, ctrlKey, altKey, shiftKey, metaKey);
    const shortcut = this.shortcuts.get(shortcutKey);
    
    if (shortcut) {
      if (shortcut.preventDefault !== false) {
        event.preventDefault();
      }
      shortcut.action();
      return;
    }

    // Handle navigation keys
    switch (key) {
      case 'ArrowDown':
        if (this.options.direction === 'vertical' || this.options.direction === 'both') {
          event.preventDefault();
          this.moveNext();
        }
        break;

      case 'ArrowUp':
        if (this.options.direction === 'vertical' || this.options.direction === 'both') {
          event.preventDefault();
          this.movePrevious();
        }
        break;

      case 'ArrowRight':
        if (this.options.direction === 'horizontal' || this.options.direction === 'both') {
          event.preventDefault();
          this.moveNext();
        }
        break;

      case 'ArrowLeft':
        if (this.options.direction === 'horizontal' || this.options.direction === 'both') {
          event.preventDefault();
          this.movePrevious();
        }
        break;

      case 'Home':
        if (this.options.homeEndBehavior === 'first-last') {
          event.preventDefault();
          this.moveToFirst();
        }
        break;

      case 'End':
        if (this.options.homeEndBehavior === 'first-last') {
          event.preventDefault();
          this.moveToLast();
        }
        break;

      case 'Tab':
        // Handle grouped navigation
        if (this.options.groupNavigation && (shiftKey || !shiftKey)) {
          const currentItem = this.getCurrentItem();
          if (currentItem?.group) {
            event.preventDefault();
            this.moveToNextGroup(shiftKey);
          }
        }
        break;

      default:
        // Handle typeahead
        if (this.options.typeahead && key.length === 1 && !ctrlKey && !altKey && !metaKey) {
          this.handleTypeahead(key.toLowerCase());
        }
        break;
    }
  }

  private moveNext() {
    const availableItems = this.options.skipDisabled 
      ? this.items.filter(item => !item.disabled)
      : this.items;

    if (availableItems.length === 0) return;

    let nextIndex = this.currentIndex + 1;

    if (this.options.loop) {
      nextIndex = nextIndex >= availableItems.length ? 0 : nextIndex;
    } else {
      nextIndex = Math.min(nextIndex, availableItems.length - 1);
    }

    this.setCurrentIndex(nextIndex);
  }

  private movePrevious() {
    const availableItems = this.options.skipDisabled 
      ? this.items.filter(item => !item.disabled)
      : this.items;

    if (availableItems.length === 0) return;

    let prevIndex = this.currentIndex - 1;

    if (this.options.loop) {
      prevIndex = prevIndex < 0 ? availableItems.length - 1 : prevIndex;
    } else {
      prevIndex = Math.max(prevIndex, 0);
    }

    this.setCurrentIndex(prevIndex);
  }

  private moveToFirst() {
    const availableItems = this.options.skipDisabled 
      ? this.items.filter(item => !item.disabled)
      : this.items;

    if (availableItems.length > 0) {
      this.setCurrentIndex(0);
    }
  }

  private moveToLast() {
    const availableItems = this.options.skipDisabled 
      ? this.items.filter(item => !item.disabled)
      : this.items;

    if (availableItems.length > 0) {
      this.setCurrentIndex(availableItems.length - 1);
    }
  }

  private moveToNextGroup(reverse = false) {
    const currentItem = this.getCurrentItem();
    if (!currentItem?.group) return;

    const groups = [...new Set(this.items.map(item => item.group).filter(Boolean))];
    const currentGroupIndex = groups.indexOf(currentItem.group);
    
    let nextGroupIndex = reverse 
      ? currentGroupIndex - 1 
      : currentGroupIndex + 1;

    if (this.options.loop) {
      nextGroupIndex = reverse
        ? (nextGroupIndex < 0 ? groups.length - 1 : nextGroupIndex)
        : (nextGroupIndex >= groups.length ? 0 : nextGroupIndex);
    } else {
      nextGroupIndex = Math.max(0, Math.min(nextGroupIndex, groups.length - 1));
    }

    const targetGroup = groups[nextGroupIndex];
    const firstItemInGroup = this.items.find(item => item.group === targetGroup && !item.disabled);
    
    if (firstItemInGroup) {
      const index = this.items.indexOf(firstItemInGroup);
      this.setCurrentIndex(index);
    }
  }

  private handleTypeahead(char: string) {
    this.typeaheadBuffer += char;

    if (this.typeaheadTimeout) {
      clearTimeout(this.typeaheadTimeout);
    }

    this.typeaheadTimeout = setTimeout(() => {
      this.typeaheadBuffer = '';
    }, 1000);

    // Find matching item
    const matchingItem = this.items.find(item => {
      const text = this.getItemText(item.element).toLowerCase();
      return text.startsWith(this.typeaheadBuffer) && !item.disabled;
    });

    if (matchingItem) {
      const index = this.items.indexOf(matchingItem);
      this.setCurrentIndex(index);
    }
  }

  private getItemText(element: HTMLElement): string {
    return element.getAttribute('aria-label') || 
           element.textContent || 
           element.getAttribute('title') || 
           '';
  }

  private setCurrentIndex(index: number) {
    const availableItems = this.options.skipDisabled 
      ? this.items.filter(item => !item.disabled)
      : this.items;

    if (index < 0 || index >= availableItems.length) return;

    // Remove focus from previous item
    if (this.currentIndex >= 0 && this.currentIndex < availableItems.length) {
      const prevItem = availableItems[this.currentIndex];
      prevItem.element.setAttribute('tabindex', '-1');
      prevItem.element.classList.remove('kb-focused');
    }

    // Set focus to new item
    this.currentIndex = index;
    const currentItem = availableItems[this.currentIndex];
    currentItem.element.setAttribute('tabindex', '0');
    currentItem.element.classList.add('kb-focused');
    
    // Try to focus with error handling for test environments
    try {
      currentItem.element.focus();
    } catch (error) {
      // In test environments, focus might not work properly
      // The keyboard navigation still works with tabindex and kb-focused class
      console.debug('Focus failed in test environment:', error);
    }

    // Announce to screen readers
    this.announceCurrentItem(currentItem);
  }

  private announceCurrentItem(item: NavigationItem) {
    const text = this.getItemText(item.element);
    const position = `${this.currentIndex + 1} of ${this.items.length}`;
    const announcement = `${text}, ${position}`;

    // Create or update live region
    let liveRegion = document.getElementById('keyboard-nav-announcements');
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = 'keyboard-nav-announcements';
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only';
      document.body.appendChild(liveRegion);
    }

    liveRegion.textContent = announcement;
  }

  private getShortcutKey(
    key: string,
    ctrlKey: boolean,
    altKey: boolean,
    shiftKey: boolean,
    metaKey: boolean
  ): string {
    const modifiers = [];
    if (ctrlKey) modifiers.push('Ctrl');
    if (altKey) modifiers.push('Alt');
    if (shiftKey) modifiers.push('Shift');
    if (metaKey) modifiers.push('Meta');
    
    return [...modifiers, key].join('+');
  }

  // ===== PUBLIC API =====

  public addShortcut(shortcut: KeyboardShortcut) {
    const key = this.getShortcutKey(
      shortcut.key,
      shortcut.ctrlKey || false,
      shortcut.altKey || false,
      shortcut.shiftKey || false,
      shortcut.metaKey || false
    );
    this.shortcuts.set(key, shortcut);
  }

  public removeShortcut(
    key: string,
    ctrlKey = false,
    altKey = false,
    shiftKey = false,
    metaKey = false
  ) {
    const shortcutKey = this.getShortcutKey(key, ctrlKey, altKey, shiftKey, metaKey);
    this.shortcuts.delete(shortcutKey);
  }

  public getCurrentItem(): NavigationItem | null {
    const availableItems = this.options.skipDisabled 
      ? this.items.filter(item => !item.disabled)
      : this.items;

    return this.currentIndex >= 0 && this.currentIndex < availableItems.length
      ? availableItems[this.currentIndex]
      : null;
  }

  public setCurrentItem(id: string) {
    const item = this.items.find(item => item.id === id);
    if (item) {
      const index = this.items.indexOf(item);
      this.setCurrentIndex(index);
    }
  }

  public updateOptions(newOptions: Partial<NavigationOptions>) {
    this.options = { ...this.options, ...newOptions };
  }

  public destroy() {
    if (this.container) {
      this.container.removeEventListener('keydown', this.handleKeyDown.bind(this));
    }
    
    if (this.typeaheadTimeout) {
      clearTimeout(this.typeaheadTimeout);
    }

    this.shortcuts.clear();
  }
}

// ===== REACT HOOKS =====

/**
 * Hook for managing keyboard navigation in a container
 */
export function useKeyboardNavigation(
  containerRef: React.RefObject<HTMLElement>,
  options: NavigationOptions = {}
) {
  const managerRef = useRef<KeyboardNavigationManager | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      managerRef.current = new KeyboardNavigationManager(containerRef.current, options);
    }

    return () => {
      managerRef.current?.destroy();
    };
  }, [containerRef, options]);

  const addShortcut = useCallback((shortcut: KeyboardShortcut) => {
    managerRef.current?.addShortcut(shortcut);
  }, []);

  const removeShortcut = useCallback((
    key: string,
    ctrlKey = false,
    altKey = false,
    shiftKey = false,
    metaKey = false
  ) => {
    managerRef.current?.removeShortcut(key, ctrlKey, altKey, shiftKey, metaKey);
  }, []);

  const setCurrentItem = useCallback((id: string) => {
    managerRef.current?.setCurrentItem(id);
  }, []);

  return {
    addShortcut,
    removeShortcut,
    setCurrentItem,
    manager: managerRef.current,
  };
}

/**
 * Hook for managing global keyboard shortcuts
 */
export function useGlobalShortcuts() {
  const shortcuts = useRef<Map<string, KeyboardShortcut>>(new Map());
  const [isEnabled, setIsEnabled] = useState(true);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isEnabled) return;

    const key = [
      event.ctrlKey && 'Ctrl',
      event.altKey && 'Alt', 
      event.shiftKey && 'Shift',
      event.metaKey && 'Meta',
      event.key
    ].filter(Boolean).join('+');

    const shortcut = shortcuts.current.get(key);
    if (shortcut) {
      // Check if we're in an input element
      const target = event.target as HTMLElement;
      const isInInput = target.tagName === 'INPUT' || 
                       target.tagName === 'TEXTAREA' ||
                       target.contentEditable === 'true';

      // Only prevent default for non-input contexts or explicitly marked shortcuts
      if (!isInInput || shortcut.context === 'global') {
        if (shortcut.preventDefault !== false) {
          event.preventDefault();
        }
        shortcut.action();
      }
    }
  }, [isEnabled]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const addShortcut = useCallback((shortcut: KeyboardShortcut) => {
    const key = [
      shortcut.ctrlKey && 'Ctrl',
      shortcut.altKey && 'Alt',
      shortcut.shiftKey && 'Shift', 
      shortcut.metaKey && 'Meta',
      shortcut.key
    ].filter(Boolean).join('+');

    shortcuts.current.set(key, shortcut);
  }, []);

  const removeShortcut = useCallback((
    key: string,
    ctrlKey = false,
    altKey = false,
    shiftKey = false,
    metaKey = false
  ) => {
    const shortcutKey = [
      ctrlKey && 'Ctrl',
      altKey && 'Alt',
      shiftKey && 'Shift',
      metaKey && 'Meta',
      key
    ].filter(Boolean).join('+');

    shortcuts.current.delete(shortcutKey);
  }, []);

  const getShortcuts = useCallback(() => {
    return Array.from(shortcuts.current.values());
  }, []);

  return {
    addShortcut,
    removeShortcut,
    getShortcuts,
    setEnabled: setIsEnabled,
    isEnabled,
  };
}

/**
 * Hook for skip links navigation
 */
export function useSkipLinks() {
  const [skipLinks, setSkipLinks] = useState<Array<{
    id: string;
    label: string;
    target: string;
  }>>([]);

  const addSkipLink = useCallback((id: string, label: string, target: string) => {
    setSkipLinks(prev => {
      const exists = prev.find(link => link.id === id);
      if (exists) return prev;
      return [...prev, { id, label, target }];
    });
  }, []);

  const removeSkipLink = useCallback((id: string) => {
    setSkipLinks(prev => prev.filter(link => link.id !== id));
  }, []);

  const focusTarget = useCallback((target: string) => {
    const element = document.querySelector(target) as HTMLElement;
    if (element) {
      element.focus();
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  return {
    skipLinks,
    addSkipLink,
    removeSkipLink,
    focusTarget,
  };
}

// ===== ROVING TAB INDEX UTILITIES =====

/**
 * Hook for implementing roving tabindex pattern
 */
export function useRovingTabIndex(
  items: HTMLElement[],
  defaultIndex = 0
) {
  const [currentIndex, setCurrentIndex] = useState(defaultIndex);

  useEffect(() => {
    items.forEach((item, index) => {
      item.setAttribute('tabindex', index === currentIndex ? '0' : '-1');
    });
  }, [items, currentIndex]);

  const setCurrentItem = useCallback((index: number) => {
    if (index >= 0 && index < items.length) {
      setCurrentIndex(index);
      items[index].focus();
    }
  }, [items]);

  const moveNext = useCallback(() => {
    const nextIndex = (currentIndex + 1) % items.length;
    setCurrentItem(nextIndex);
  }, [currentIndex, items.length, setCurrentItem]);

  const movePrevious = useCallback(() => {
    const prevIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
    setCurrentItem(prevIndex);
  }, [currentIndex, items.length, setCurrentItem]);

  return {
    currentIndex,
    setCurrentItem,
    moveNext,
    movePrevious,
  };
}

// ===== EXPORT UTILITIES =====

export { KEYBOARD_SHORTCUTS };
