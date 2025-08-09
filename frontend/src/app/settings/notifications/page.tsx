'use client';

import React from 'react';

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

        {/* Notification Preferences */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Push Notifications</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Task Reminders</label>
                <p className="text-sm text-gray-500">Get notified when tasks are due</p>
              </div>
              <input
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                defaultChecked
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Project Updates</label>
                <p className="text-sm text-gray-500">Get notified about project changes</p>
              </div>
              <input
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                defaultChecked
              />
            </div>
          </div>
        </div>

        <div className="border-t pt-8">
          <h2 className="text-2xl font-semibold mb-4">Notification History</h2>
          <div className="bg-white shadow rounded-lg p-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-200">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Task "Review documentation" is due
                  </p>
                  <p className="text-xs text-gray-500">2 hours ago</p>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Pending
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-200">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Project "Codex Bootstrap" updated
                  </p>
                  <p className="text-xs text-gray-500">5 hours ago</p>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Read
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
