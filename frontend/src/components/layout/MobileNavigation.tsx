'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  BarChart3,
  FolderOpen,
  MessageSquare,
  Settings,
  Menu,
  X,
  Brain,
  Calendar,
} from 'lucide-react';

export interface NavigationItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  isActive?: boolean;
}

const navigationItems: NavigationItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: <Home className="w-5 h-5" />,
  },
  {
    href: '/analytics',
    label: 'Analytics',
    icon: <BarChart3 className="w-5 h-5" />,
  },
  {
    href: '/projects',
    label: 'Projects',
    icon: <FolderOpen className="w-5 h-5" />,
  },
  {
    href: '/reflection',
    label: 'Reflection',
    icon: <Brain className="w-5 h-5" />,
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: <Settings className="w-5 h-5" />,
  },
];

export function MobileNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <>
      {/* Mobile Navigation Header */}
      <div className="navbar bg-primary text-primary-content lg:hidden">
        <div className="flex-1">
          <Link href="/" className="btn btn-ghost text-xl font-bold">
            🧠 Codex
          </Link>
        </div>
        <div className="flex-none">
          <button
            className="btn btn-square btn-ghost"
            onClick={toggleMenu}
            aria-label="Toggle navigation menu"
            aria-expanded={isOpen}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Desktop Navigation */}
      <div className="navbar bg-primary text-primary-content hidden lg:flex">
        <div className="flex-1">
          <Link href="/" className="btn btn-ghost text-xl font-bold">
            🧠 Codex Bootstrap
          </Link>
        </div>
        <div className="flex-none">
          <ul className="menu menu-horizontal px-1">
            {navigationItems.map(item => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-2 ${
                    pathname === item.href ? 'text-accent font-semibold' : ''
                  }`}
                >
                  {item.icon}
                  <span className="hidden xl:inline">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}

      {/* Mobile Menu Drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-primary text-primary-content transform transition-transform duration-300 z-50 lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">🧠 Navigation</h2>
            <button
              className="btn btn-square btn-ghost"
              onClick={closeMenu}
              aria-label="Close navigation menu"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="space-y-2">
            {navigationItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMenu}
                className={`flex items-center gap-4 p-4 rounded-lg transition-colors hover:bg-primary-focus ${
                  pathname === item.href ? 'bg-accent text-accent-content font-semibold' : ''
                }`}
              >
                {item.icon}
                <span className="text-lg">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* ADHD-Friendly Quick Actions */}
          <div className="mt-8 pt-8 border-t border-primary-content/20">
            <h3 className="text-sm font-semibold mb-4 opacity-70">QUICK ACTIONS</h3>
            <div className="space-y-2">
              <Link
                href="/dashboard?action=add-task"
                onClick={closeMenu}
                className="flex items-center gap-4 p-3 rounded-lg bg-accent text-accent-content hover:bg-accent-focus transition-colors"
              >
                <span className="text-2xl">➕</span>
                <span>Add Task</span>
              </Link>
              <Link
                href="/analytics?focus=start-session"
                onClick={closeMenu}
                className="flex items-center gap-4 p-3 rounded-lg bg-secondary text-secondary-content hover:bg-secondary-focus transition-colors"
              >
                <span className="text-2xl">🎯</span>
                <span>Start Focus</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation for Mobile (Alternative Pattern) */}
      <div className="btm-nav lg:hidden fixed bottom-0 z-30">
        {navigationItems.slice(0, 4).map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`${
              pathname === item.href
                ? 'active text-accent border-t-2 border-accent'
                : 'text-base-content/70'
            }`}
          >
            {item.icon}
            <span className="btm-nav-label text-xs">{item.label}</span>
          </Link>
        ))}
        <Link
          href="/settings"
          className={`${
            pathname === '/settings'
              ? 'active text-accent border-t-2 border-accent'
              : 'text-base-content/70'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="btm-nav-label text-xs">More</span>
        </Link>
      </div>
    </>
  );
}

export default MobileNavigation;
