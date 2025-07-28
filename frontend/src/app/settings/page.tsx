'use client'

import { useState } from 'react'
import Link from 'next/link'

interface UserSettings {
  theme: 'light' | 'dark' | 'auto'
  notifications: {
    email: boolean
    push: boolean
    taskReminders: boolean
    projectUpdates: boolean
  }
  preferences: {
    language: string
    timezone: string
    dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD'
    startOfWeek: 'sunday' | 'monday'
  }
  privacy: {
    profilePublic: boolean
    showActivity: boolean
    allowAnalytics: boolean
  }
}

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<'general' | 'notifications' | 'privacy'>('general')
  const [settings, setSettings] = useState<UserSettings>({
    theme: 'light',
    notifications: {
      email: true,
      push: false,
      taskReminders: true,
      projectUpdates: true
    },
    preferences: {
      language: 'en',
      timezone: 'America/New_York',
      dateFormat: 'MM/DD/YYYY',
      startOfWeek: 'monday'
    },
    privacy: {
      profilePublic: false,
      showActivity: true,
      allowAnalytics: true
    }
  })

  const updateSettings = (section: keyof UserSettings, key: string, value: unknown) => {
    setSettings(prev => {
      if (section === 'theme') {
        return { ...prev, theme: value as 'light' | 'dark' | 'auto' }
      }
      
      return {
        ...prev,
        [section]: {
          ...(prev[section] as Record<string, unknown>),
          [key]: value
        }
      }
    })
  }

  const handleSave = () => {
    // In a real app, this would save to the backend
    console.log('Saving settings:', settings)
    // Show success message
    const successAlert = document.createElement('div')
    successAlert.className = 'alert alert-success fixed top-4 right-4 w-auto z-50'
    successAlert.innerHTML = '<span>Settings saved successfully!</span>'
    document.body.appendChild(successAlert)
    setTimeout(() => {
      document.body.removeChild(successAlert)
    }, 3000)
  }

  return (
    <main className="min-h-screen bg-base-100">
      {/* Navigation */}
      <div className="navbar bg-primary text-primary-content">
        <div className="flex-1">
          <Link href="/" className="btn btn-ghost text-xl">
            Codex Bootstrap
          </Link>
        </div>
        <div className="flex-none">
          <ul className="menu menu-horizontal px-1">
            <li><Link href="/dashboard">Dashboard</Link></li>
            <li><Link href="/projects">Projects</Link></li>
            <li><Link href="/reflection">Reflection</Link></li>
            <li><Link href="/settings" className="text-accent">Settings</Link></li>
          </ul>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="menu bg-base-200 rounded-box p-2">
              <li>
                <button 
                  className={activeSection === 'general' ? 'active' : ''}
                  onClick={() => setActiveSection('general')}
                >
                  General
                </button>
              </li>
              <li>
                <button 
                  className={activeSection === 'notifications' ? 'active' : ''}
                  onClick={() => setActiveSection('notifications')}
                >
                  Notifications
                </button>
              </li>
              <li>
                <button 
                  className={activeSection === 'privacy' ? 'active' : ''}
                  onClick={() => setActiveSection('privacy')}
                >
                  Privacy
                </button>
              </li>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="card bg-base-200 shadow-lg">
              <div className="card-body">
                
                {/* General Settings */}
                {activeSection === 'general' && (
                  <div>
                    <h2 className="card-title mb-6">General Settings</h2>
                    
                    <div className="space-y-6">
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">Theme</span>
                        </label>
                        <select 
                          className="select select-bordered max-w-xs"
                          value={settings.theme}
                          onChange={(e) => updateSettings('theme', '', e.target.value)}
                        >
                          <option value="light">Light</option>
                          <option value="dark">Dark</option>
                          <option value="auto">Auto (System)</option>
                        </select>
                      </div>

                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">Language</span>
                        </label>
                        <select 
                          className="select select-bordered max-w-xs"
                          value={settings.preferences.language}
                          onChange={(e) => updateSettings('preferences', 'language', e.target.value)}
                        >
                          <option value="en">English</option>
                          <option value="es">Español</option>
                          <option value="fr">Français</option>
                          <option value="de">Deutsch</option>
                        </select>
                      </div>

                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">Timezone</span>
                        </label>
                        <select 
                          className="select select-bordered max-w-xs"
                          value={settings.preferences.timezone}
                          onChange={(e) => updateSettings('preferences', 'timezone', e.target.value)}
                        >
                          <option value="America/New_York">Eastern Time</option>
                          <option value="America/Chicago">Central Time</option>
                          <option value="America/Denver">Mountain Time</option>
                          <option value="America/Los_Angeles">Pacific Time</option>
                          <option value="Europe/London">London</option>
                          <option value="Europe/Paris">Paris</option>
                        </select>
                      </div>

                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">Date Format</span>
                        </label>
                        <select 
                          className="select select-bordered max-w-xs"
                          value={settings.preferences.dateFormat}
                          onChange={(e) => updateSettings('preferences', 'dateFormat', e.target.value)}
                        >
                          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                        </select>
                      </div>

                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">Start of Week</span>
                        </label>
                        <select 
                          className="select select-bordered max-w-xs"
                          value={settings.preferences.startOfWeek}
                          onChange={(e) => updateSettings('preferences', 'startOfWeek', e.target.value)}
                        >
                          <option value="sunday">Sunday</option>
                          <option value="monday">Monday</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notification Settings */}
                {activeSection === 'notifications' && (
                  <div>
                    <h2 className="card-title mb-6">Notification Settings</h2>
                    
                    <div className="space-y-4">
                      <div className="form-control">
                        <label className="cursor-pointer label">
                          <span className="label-text">Email Notifications</span>
                          <input 
                            type="checkbox" 
                            className="toggle toggle-primary"
                            checked={settings.notifications.email}
                            onChange={(e) => updateSettings('notifications', 'email', e.target.checked)}
                          />
                        </label>
                      </div>

                      <div className="form-control">
                        <label className="cursor-pointer label">
                          <span className="label-text">Push Notifications</span>
                          <input 
                            type="checkbox" 
                            className="toggle toggle-primary"
                            checked={settings.notifications.push}
                            onChange={(e) => updateSettings('notifications', 'push', e.target.checked)}
                          />
                        </label>
                      </div>

                      <div className="form-control">
                        <label className="cursor-pointer label">
                          <span className="label-text">Task Reminders</span>
                          <input 
                            type="checkbox" 
                            className="toggle toggle-primary"
                            checked={settings.notifications.taskReminders}
                            onChange={(e) => updateSettings('notifications', 'taskReminders', e.target.checked)}
                          />
                        </label>
                      </div>

                      <div className="form-control">
                        <label className="cursor-pointer label">
                          <span className="label-text">Project Updates</span>
                          <input 
                            type="checkbox" 
                            className="toggle toggle-primary"
                            checked={settings.notifications.projectUpdates}
                            onChange={(e) => updateSettings('notifications', 'projectUpdates', e.target.checked)}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Privacy Settings */}
                {activeSection === 'privacy' && (
                  <div>
                    <h2 className="card-title mb-6">Privacy Settings</h2>
                    
                    <div className="space-y-4">
                      <div className="form-control">
                        <label className="cursor-pointer label">
                          <span className="label-text">Public Profile</span>
                          <input 
                            type="checkbox" 
                            className="toggle toggle-primary"
                            checked={settings.privacy.profilePublic}
                            onChange={(e) => updateSettings('privacy', 'profilePublic', e.target.checked)}
                          />
                        </label>
                        <label className="label">
                          <span className="label-text-alt">Allow others to see your profile</span>
                        </label>
                      </div>

                      <div className="form-control">
                        <label className="cursor-pointer label">
                          <span className="label-text">Show Activity</span>
                          <input 
                            type="checkbox" 
                            className="toggle toggle-primary"
                            checked={settings.privacy.showActivity}
                            onChange={(e) => updateSettings('privacy', 'showActivity', e.target.checked)}
                          />
                        </label>
                        <label className="label">
                          <span className="label-text-alt">Show your activity in the activity feed</span>
                        </label>
                      </div>

                      <div className="form-control">
                        <label className="cursor-pointer label">
                          <span className="label-text">Analytics</span>
                          <input 
                            type="checkbox" 
                            className="toggle toggle-primary"
                            checked={settings.privacy.allowAnalytics}
                            onChange={(e) => updateSettings('privacy', 'allowAnalytics', e.target.checked)}
                          />
                        </label>
                        <label className="label">
                          <span className="label-text-alt">Help improve the app by sharing usage data</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Save Button */}
                <div className="card-actions justify-end mt-8">
                  <button className="btn btn-primary" onClick={handleSave}>
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
