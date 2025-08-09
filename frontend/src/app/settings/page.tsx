'use client';

import React from 'react';

export default function SettingsPage() {
  return (
    <div className="flex-1 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">General Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences.</p>
      </div>

      <div className="space-y-6">
        {/* Theme Settings */}
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Theme</h3>
          <p className="text-sm text-muted-foreground">Choose your preferred color scheme</p>
          <div className="flex space-x-2">
            <button className="px-3 py-2 text-sm border rounded-md">Light</button>
            <button className="px-3 py-2 text-sm border rounded-md">Dark</button>
            <button className="px-3 py-2 text-sm border rounded-md">System</button>
          </div>
        </div>

        {/* Language Settings */}
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Language</h3>
          <p className="text-sm text-muted-foreground">Select your preferred language</p>
          <select className="px-3 py-2 text-sm border rounded-md">
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
          </select>
        </div>

        {/* Timezone Settings */}
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Timezone</h3>
          <p className="text-sm text-muted-foreground">Set your local timezone</p>
          <select className="px-3 py-2 text-sm border rounded-md">
            <option value="UTC">UTC</option>
            <option value="EST">Eastern Time</option>
            <option value="PST">Pacific Time</option>
          </select>
        </div>

        {/* Date Format Settings */}
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Date Format</h3>
          <p className="text-sm text-muted-foreground">Choose your preferred date format</p>
          <select className="px-3 py-2 text-sm border rounded-md">
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </div>

        {/* Save Button */}
        <div className="pt-4">
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
