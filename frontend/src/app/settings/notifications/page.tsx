'use client';

import React from 'react';
import { NotificationPreferences } from '@/components/NotificationPreferences';
import { NotificationHistory } from '@/components/NotificationHistory';

export default function NotificationSettingsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Notification Settings</h1>
          <p className="text-muted-foreground">
            Manage your notification preferences and view your notification history.
          </p>
        </div>

        <NotificationPreferences
          onPreferencesChange={preferences => {
            console.log('Preferences updated:', preferences);
          }}
        />

        <div className="border-t pt-8">
          <h2 className="text-2xl font-semibold mb-4">Notification History</h2>
          <NotificationHistory />
        </div>
      </div>
    </div>
  );
}
