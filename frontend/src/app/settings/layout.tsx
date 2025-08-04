'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings, Bell, User, Palette, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

const settingsNavigation = [
  {
    name: 'General',
    href: '/settings',
    icon: Settings,
  },
  {
    name: 'Notifications',
    href: '/settings/notifications',
    icon: Bell,
  },
  {
    name: 'Profile',
    href: '/settings/profile',
    icon: User,
  },
  {
    name: 'Appearance',
    href: '/settings/appearance',
    icon: Palette,
  },
  {
    name: 'Privacy',
    href: '/settings/privacy',
    icon: Shield,
  },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r bg-muted/10">
        <div className="p-6">
          <h2 className="text-lg font-semibold">Settings</h2>
        </div>
        <nav className="px-3">
          <ul className="space-y-1">
            {settingsNavigation.map(item => {
              const IconComponent = item.icon;
              const isActive = pathname === item.href;

              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <IconComponent className="h-4 w-4" />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
