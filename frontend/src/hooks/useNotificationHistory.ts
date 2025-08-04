import { useState, useEffect, useCallback } from 'react';
import { NotificationData } from '../contexts/WebSocketContext';

export interface NotificationHistoryFilter {
  type?: string;
  read?: boolean;
  startDate?: Date;
  endDate?: Date;
}

export interface NotificationHistoryResponse {
  notifications: NotificationData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
    totalPages: number;
  };
}

export interface UseNotificationHistoryOptions {
  autoFetch?: boolean;
  initialPage?: number;
  pageSize?: number;
  filters?: NotificationHistoryFilter;
}

export function useNotificationHistory(options: UseNotificationHistoryOptions = {}) {
  const { autoFetch = true, initialPage = 1, pageSize = 20, filters = {} } = options;

  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [pagination, setPagination] = useState({
    page: initialPage,
    limit: pageSize,
    total: 0,
    hasMore: false,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Build query string from filters
  const buildQueryString = useCallback(
    (page: number, limit: number, currentFilters: NotificationHistoryFilter) => {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      if (currentFilters.type) params.append('type', currentFilters.type);
      if (currentFilters.read !== undefined) params.append('read', currentFilters.read.toString());
      if (currentFilters.startDate)
        params.append('startDate', currentFilters.startDate.toISOString());
      if (currentFilters.endDate) params.append('endDate', currentFilters.endDate.toISOString());

      return params.toString();
    },
    []
  );

  // Fetch notification history
  const fetchNotificationHistory = useCallback(
    async (
      page: number = 1,
      limit: number = pageSize,
      currentFilters: NotificationHistoryFilter = filters,
      append: boolean = false
    ) => {
      setLoading(true);
      setError(null);

      try {
        const queryString = buildQueryString(page, limit, currentFilters);
        const response = await fetch(`/api/notifications/history?${queryString}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch notification history: ${response.statusText}`);
        }

        const data: NotificationHistoryResponse = await response.json();

        if (append) {
          setNotifications(prev => [...prev, ...data.notifications]);
        } else {
          setNotifications(data.notifications);
        }

        setPagination(data.pagination);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch notification history';
        setError(errorMessage);
        console.error('Error fetching notification history:', err);
      } finally {
        setLoading(false);
      }
    },
    [pageSize, filters, buildQueryString]
  );

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/unread-count', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unreadCount);
      }
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        // Update local state
        setNotifications(prev =>
          prev.map(notification =>
            notification.id === notificationId ? { ...notification, read: true } : notification
          )
        );

        // Update unread count
        setUnreadCount(prev => Math.max(0, prev - 1));

        return true;
      } else {
        throw new Error(`Failed to mark notification as read: ${response.statusText}`);
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
      return false;
    }
  }, []);

  // Mark multiple notifications as read
  const markMultipleAsRead = useCallback(async (notificationIds: string[]) => {
    try {
      const response = await fetch('/api/notifications/mark-read-bulk', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ notificationIds }),
      });

      if (response.ok) {
        const data = await response.json();

        // Update local state
        setNotifications(prev =>
          prev.map(notification =>
            notificationIds.includes(notification.id)
              ? { ...notification, read: true }
              : notification
          )
        );

        // Update unread count
        setUnreadCount(prev => Math.max(0, prev - data.markedCount));

        return data.markedCount;
      } else {
        throw new Error(`Failed to mark notifications as read: ${response.statusText}`);
      }
    } catch (err) {
      console.error('Error marking multiple notifications as read:', err);
      return 0;
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(
    async (notificationId: string) => {
      try {
        const response = await fetch(`/api/notifications/${notificationId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (response.ok) {
          // Update local state
          setNotifications(prev => prev.filter(n => n.id !== notificationId));

          // Update unread count if the deleted notification was unread
          const deletedNotification = notifications.find(n => n.id === notificationId);
          if (deletedNotification && !deletedNotification.read) {
            setUnreadCount(prev => Math.max(0, prev - 1));
          }

          return true;
        } else {
          throw new Error(`Failed to delete notification: ${response.statusText}`);
        }
      } catch (err) {
        console.error('Error deleting notification:', err);
        return false;
      }
    },
    [notifications]
  );

  // Load more notifications (for infinite scroll)
  const loadMore = useCallback(() => {
    if (!loading && pagination.hasMore) {
      fetchNotificationHistory(pagination.page + 1, pagination.limit, filters, true);
    }
  }, [
    loading,
    pagination.hasMore,
    pagination.page,
    pagination.limit,
    filters,
    fetchNotificationHistory,
  ]);

  // Refresh notifications
  const refresh = useCallback(() => {
    fetchNotificationHistory(1, pageSize, filters, false);
    fetchUnreadCount();
  }, [fetchNotificationHistory, fetchUnreadCount, pageSize, filters]);

  // Update filters
  const updateFilters = useCallback(
    (newFilters: NotificationHistoryFilter) => {
      fetchNotificationHistory(1, pageSize, newFilters, false);
    },
    [fetchNotificationHistory, pageSize]
  );

  // Initial fetch
  useEffect(() => {
    if (autoFetch) {
      fetchNotificationHistory();
      fetchUnreadCount();
    }
  }, [autoFetch, fetchNotificationHistory, fetchUnreadCount]);

  return {
    // Data
    notifications,
    pagination,
    unreadCount,

    // State
    loading,
    error,

    // Actions
    fetchNotificationHistory,
    fetchUnreadCount,
    markAsRead,
    markMultipleAsRead,
    deleteNotification,
    loadMore,
    refresh,
    updateFilters,

    // Helpers
    hasMore: pagination.hasMore,
    isEmpty: notifications.length === 0 && !loading,
  };
}
