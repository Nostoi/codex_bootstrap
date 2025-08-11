'use client';

import React, { useState, useCallback, useEffect } from 'react';
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
  Zap,
  Activity,
} from 'lucide-react';
import {
  useNotifications,
  useDeadlineReminders,
  useCalendarConflicts,
} from '../../hooks/useNotifications';
import { NotificationData } from '../../contexts/WebSocketContext';
import { useEnergyAwareNotifications } from '../../lib/energyAwareNotificationScheduler';
import { useEnhancedFocusDetection } from '../../lib/enhancedFocusDetection';
import { useNotificationConflictPrevention } from '../../lib/notificationConflictPrevention';

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
  const { setFocusMode, setEnergyLevel, getStats } = useEnergyAwareNotifications();
  const { currentSession: enhancedFocusSession } = useEnhancedFocusDetection();
  const { conflicts: notificationConflicts } = useNotificationConflictPrevention();

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'urgent'>('all');
  const [currentEnergyLevel, setCurrentEnergyLevel] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [schedulerStats, setSchedulerStats] = useState<any>(null);

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

  // Enhanced focus mode integration with energy-aware scheduler
  useEffect(() => {
    setFocusMode(focusMode);
  }, [focusMode, setFocusMode]);

  // Energy level synchronization
  useEffect(() => {
    setEnergyLevel(currentEnergyLevel);
  }, [currentEnergyLevel, setEnergyLevel]);

  // Update scheduler stats periodically
  useEffect(() => {
    const updateStats = () => {
      setSchedulerStats(getStats());
    };

    updateStats();
    const interval = setInterval(updateStats, 10000); // Update every 10s

    return () => clearInterval(interval);
  }, [getStats]);

  // Enhanced energy level controls
  const handleEnergyLevelChange = useCallback(
    (level: 'LOW' | 'MEDIUM' | 'HIGH') => {
      setCurrentEnergyLevel(level);
      setEnergyLevel(level);
    },
    [setEnergyLevel]
  );

  // Get energy level color for UI
  const getEnergyLevelColor = (level: string) => {
    switch (level) {
      case 'HIGH':
        return 'text-red-600 bg-red-50';
      case 'MEDIUM':
        return 'text-yellow-600 bg-yellow-50';
      case 'LOW':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

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

            {/* Energy-Aware Controls */}
            <div className="mt-3 p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-700 flex items-center gap-1">
                  <Activity className="w-3 h-3" />
                  Energy Level
                </span>
                {schedulerStats && (
                  <span className="text-xs text-gray-500">
                    {schedulerStats.pendingNotifications} queued
                  </span>
                )}
              </div>
              <div className="flex gap-1">
                {(['LOW', 'MEDIUM', 'HIGH'] as const).map(level => (
                  <button
                    key={level}
                    onClick={() => handleEnergyLevelChange(level)}
                    className={`px-2 py-1 text-xs rounded-md transition-colors ${
                      currentEnergyLevel === level
                        ? getEnergyLevelColor(level)
                        : 'text-gray-500 hover:text-gray-700 bg-white'
                    }`}
                    title={`Set energy level to ${level.toLowerCase()}`}
                  >
                    {level === 'HIGH' && '🚀'} {level === 'MEDIUM' && '⚡'}{' '}
                    {level === 'LOW' && '🔋'}
                    {level}
                  </button>
                ))}
              </div>
              {focusMode && (
                <div className="mt-2 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">
                  <Zap className="w-3 h-3 inline mr-1" />
                  Focus mode: Energy-aware batching active
                </div>
              )}
            </div>

            {/* Enhanced Focus Mode Status with Conflict Prevention */}
            {(focusMode || enhancedFocusSession) && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-blue-800">Focus Session Active</span>
                  {enhancedFocusSession && (
                    <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                      {enhancedFocusSession.activityType}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-blue-700 mb-2">
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span className="font-medium">
                      {enhancedFocusSession
                        ? Math.round(
                            (Date.now() - enhancedFocusSession.startTime.getTime()) / 60000
                          )
                        : '-'}
                      m
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Energy:</span>
                    <span className="font-medium">
                      {enhancedFocusSession?.energyLevel || currentEnergyLevel}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Interruptions:</span>
                    <span className="font-medium">{enhancedFocusSession?.interruptions || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Protection:</span>
                    <span className="font-medium text-green-600">On</span>
                  </div>
                </div>
                <div className="text-xs text-blue-600">
                  <Target className="w-3 h-3 inline mr-1" />
                  Notifications are being intelligently scheduled to minimize interruptions
                </div>
              </div>
            )}

            {/* Conflict Prevention Status */}
            <div className="mt-3 p-2 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-700 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Conflict Prevention
                </span>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-green-600">Active</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Calendar:</span>
                  <span className="font-medium text-green-600">Protected</span>
                </div>
                <div className="flex justify-between">
                  <span>Focus:</span>
                  <span className="font-medium text-green-600">Protected</span>
                </div>
                <div className="flex justify-between">
                  <span>Energy Match:</span>
                  <span className="font-medium text-green-600">On</span>
                </div>
                <div className="flex justify-between">
                  <span>Hyperfocus:</span>
                  <span className="font-medium text-green-600">Guarded</span>
                </div>
              </div>

              {schedulerStats && schedulerStats.conflictsDetected > 0 && (
                <div className="mt-2 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                  <AlertTriangle className="w-3 h-3 inline mr-1" />
                  {schedulerStats.conflictsDetected} conflicts resolved
                </div>
              )}

              {notificationConflicts.length > 0 && (
                <div className="mt-2 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                  <AlertTriangle className="w-3 h-3 inline mr-1" />
                  {notificationConflicts.length} active conflicts detected
                </div>
              )}
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
