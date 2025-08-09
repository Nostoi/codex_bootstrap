'use client';

import React from 'react';

export default function PrivacySettingsPage() {
  return (
    <div className="flex-1 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Privacy & Security</h1>
        <p className="text-muted-foreground">
          Manage your privacy settings and data security preferences.
        </p>
      </div>

      <div className="space-y-6">
        {/* Data Collection Settings */}
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Data Collection</h3>
          <p className="text-sm text-muted-foreground">
            Control what data we collect and how it's used
          </p>
          <div className="space-y-3">
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded" defaultChecked />
              <span className="text-sm">Analytics and usage data</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded" defaultChecked />
              <span className="text-sm">Performance monitoring</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded" />
              <span className="text-sm">Marketing communications</span>
            </label>
          </div>
        </div>

        {/* Account Security */}
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Account Security</h3>
          <p className="text-sm text-muted-foreground">
            Secure your account with additional protection
          </p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Two-factor authentication</span>
              <button className="px-3 py-1 text-xs border rounded">Enable</button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Login notifications</span>
              <input type="checkbox" className="rounded" defaultChecked />
            </div>
          </div>
        </div>

        {/* Data Export */}
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Data Management</h3>
          <p className="text-sm text-muted-foreground">Export or delete your personal data</p>
          <div className="flex space-x-2">
            <button className="px-3 py-2 text-sm border rounded-md">Export Data</button>
            <button className="px-3 py-2 text-sm border rounded-md text-red-600 border-red-300">
              Delete Account
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4">
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
            Save Privacy Settings
          </button>
        </div>
      </div>
    </div>
  );
}
