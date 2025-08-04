'use client';

import React, { useState, useCallback } from 'react';
import {
  Bell,
  BellOff,
  X,
  Check,
  CheckCheck,
  Clock,
  AlertTriangle,
  Calendar,
  Target,
} from 'lucide-react';
import {
  useNotifications,
  useDeadlineReminders,
  useCalendarConflicts,
} from '../../hooks/useNotifications';
import { NotificationData } from '../../contexts/WebSocketContext';

interface NotificationsPanelProps {
  className?: string;
}

export function NotificationsPanel({ className = '' }: NotificationsPanelProps) {
  const {
    notifications,
    unreadCount,
    markNotificationAsRead,
    markAllAsRead,
    clearNotifications,
    focusMode,
    enableFocusMode,
    disableFocusMode,
    settings,
    updateSettings,
    isConnected,
  } = useNotifications();

  const { criticalDeadlines } = useDeadlineReminders();
  const { conflictNotifications, resolveConflict } = useCalendarConflicts();

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'urgent'>('all');

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.read;
      case 'urgent':
        return notification.severity === 'urgent';
      default:
        return true;
    }
  });

  const getNotificationIcon = useCallback((type: NotificationData['type']) => {
    switch (type) {
      case 'task-update':
        return <Target className="w-4 h-4" />;
      case 'calendar-sync':
        return <Calendar className="w-4 h-4" />;
      case 'deadline-reminder':
        return <Clock className="w-4 h-4" />;
      case 'conflict-alert':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  }, []);

  const getSeverityColor = useCallback((severity?: NotificationData['severity']) => {
    switch (severity) {
      case 'urgent':
        return 'text-red-500 bg-red-50 border-red-200';
      case 'high':
        return 'text-orange-500 bg-orange-50 border-orange-200';
      case 'medium':
        return 'text-blue-500 bg-blue-50 border-blue-200';
      case 'low':
      default:
        return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  }, []);

  const formatTimeAgo = useCallback((timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return time.toLocaleDateString();
  }, []);

  const handleNotificationClick = useCallback(
    (notification: NotificationData) => {
      markNotificationAsRead(notification.id);

      // Handle different notification types
      switch (notification.type) {
        case 'task-update':
          // Navigate to task
          if (notification.data?.taskId) {
            window.location.href = `/tasks/${notification.data.taskId}`;
          }
          break;
        case 'calendar-sync':
          // Navigate to calendar
          window.location.href = '/calendar';
          break;
        case 'deadline-reminder':
          // Navigate to task with deadline
          if (notification.data?.taskId) {
            window.location.href = `/tasks/${notification.data.taskId}`;
          }
          break;
        case 'conflict-alert':
          // Handle conflict resolution
          if (notification.data?.conflictId) {
            // Show conflict resolution modal or navigate to resolution page
            console.log('Handle conflict:', notification.data.conflictId);
          }
          break;
      }
    },
    [markNotificationAsRead]
  );

  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-lg transition-colors ${
          isConnected
            ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            : 'text-gray-400 cursor-not-allowed'
        }`}
        disabled={!isConnected}
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
      >
        {focusMode ? <BellOff className="w-5 h-5" /> : <Bell className="w-5 h-5" />}

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-[20px]">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}

        {/* Connection Status Indicator */}
        <div
          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`}
        />
      </button>

      {/* Notifications Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Notifications</h3>
              <div className="flex items-center gap-2">
                {/* Focus Mode Toggle */}
                <button
                  onClick={focusMode ? disableFocusMode : () => enableFocusMode()}
                  className={`p-1 rounded text-sm ${
                    focusMode
                      ? 'bg-purple-100 text-purple-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  title={focusMode ? 'Disable Focus Mode' : 'Enable Focus Mode'}
                >
                  {focusMode ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                </button>

                {/* Close Button */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-gray-500 hover:text-gray-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {(['all', 'unread', 'urgent'] as const).map(filterType => (
                <button
                  key={filterType}
                  onClick={() => setFilter(filterType)}
                  className={`px-3 py-1 rounded text-sm capitalize transition-colors ${
                    filter === filterType
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {filterType}
                  {filterType === 'unread' && unreadCount > 0 && (
                    <span className="ml-1 text-xs bg-red-500 text-white rounded-full px-1">
                      {unreadCount}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Actions */}
            {filteredNotifications.length > 0 && (
              <div className="flex gap-2 mt-3">
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 px-2 py-1 text-sm text-blue-600 hover:text-blue-700"
                >
                  <CheckCheck className="w-3 h-3" />
                  Mark all read
                </button>
                <button
                  onClick={clearNotifications}
                  className="flex items-center gap-1 px-2 py-1 text-sm text-gray-600 hover:text-gray-700"
                >
                  <X className="w-3 h-3" />
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Critical Deadlines Section */}
          {criticalDeadlines.length > 0 && (
            <div className="p-3 bg-red-50 border-b border-red-200">
              <div className="flex items-center gap-2 text-red-700 text-sm font-medium mb-2">
                <AlertTriangle className="w-4 h-4" />
                Critical Deadlines
              </div>
              <div className="space-y-1">
                {criticalDeadlines.slice(0, 2).map(deadline => (
                  <div key={deadline.id} className="text-xs text-red-600">
                    {deadline.title} - {formatTimeAgo(deadline.deadline.toISOString())}
                  </div>
                ))}
                {criticalDeadlines.length > 2 && (
                  <div className="text-xs text-red-500">
                    +{criticalDeadlines.length - 2} more critical deadlines
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notifications List */}
          <div className="max-h-64 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No notifications</p>
                {filter !== 'all' && (
                  <button
                    onClick={() => setFilter('all')}
                    className="text-blue-600 hover:text-blue-700 text-sm mt-1"
                  >
                    View all notifications
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y">
                {filteredNotifications.map(notification => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                      !notification.read ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={`p-1 rounded ${getSeverityColor(notification.severity)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <h4
                            className={`text-sm font-medium ${
                              !notification.read ? 'text-gray-900' : 'text-gray-700'
                            }`}
                          >
                            {notification.title}
                          </h4>
                          <div className="flex items-center gap-1 ml-2">
                            {!notification.read && (
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  markNotificationAsRead(notification.id);
                                }}
                                className="text-blue-600 hover:text-blue-700 p-0.5"
                                title="Mark as read"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                            )}
                            <span className="text-xs text-gray-500">
                              {formatTimeAgo(notification.timestamp)}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>

                        {/* Conflict Resolution Actions */}
                        {notification.type === 'conflict-alert' &&
                          notification.data?.conflictId && (
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  resolveConflict(notification.data.conflictId, 'reschedule');
                                }}
                                className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                              >
                                Reschedule
                              </button>
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  resolveConflict(notification.data.conflictId, 'override');
                                }}
                                className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded hover:bg-orange-200"
                              >
                                Override
                              </button>
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 bg-gray-50 border-t text-xs text-gray-500 flex items-center justify-between">
            <span>Real-time sync {isConnected ? 'active' : 'disconnected'}</span>
            {focusMode && <span className="text-purple-600 font-medium">Focus mode enabled</span>}
          </div>
        </div>
      )}
    </div>
  );
}
