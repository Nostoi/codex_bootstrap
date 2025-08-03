'use client';

import React, { 
  createContext, 
  useContext, 
  useEffect, 
  useState, 
  useRef, 
  useCallback,
  ReactNode 
} from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

export interface NotificationData {
  id: string;
  type: 'task-update' | 'calendar-sync' | 'deadline-reminder' | 'conflict-alert' | 'plan-regeneration';
  title: string;
  message: string;
  data?: any;
  timestamp: string;
  read?: boolean;
  readAt?: string;
  deliveryStatus?: 'pending' | 'delivered' | 'failed' | 'retry';
  retryCount?: number;
  severity?: 'low' | 'medium' | 'high' | 'urgent';
  notificationType?: string;
  metadata?: Record<string, any>;
}

export interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  isConnecting: boolean;
  notifications: NotificationData[];
  unreadCount: number;
  connect: () => void;
  disconnect: () => void;
  markNotificationAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  sendMessage: (event: string, data: any) => void;
  subscribeToTaskUpdates: (taskId: string) => void;
  unsubscribeFromTaskUpdates: (taskId: string) => void;
  subscribeToCalendarSync: () => void;
  unsubscribeFromCalendarSync: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
  children: ReactNode;
  serverUrl?: string;
}

export function WebSocketProvider({ 
  children, 
  serverUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001' 
}: WebSocketProviderProps) {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Calculate unread notifications count
  const unreadCount = notifications.filter(n => !n.read).length;

  const connect = useCallback(() => {
    if (!isAuthenticated || !user || socketRef.current?.connected) {
      return;
    }

    setIsConnecting(true);

    try {
      const newSocket = io(serverUrl, {
        auth: {
          userId: user.id,
        },
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      // Connection event handlers
      newSocket.on('connect', () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setIsConnecting(false);
        reconnectAttempts.current = 0;
        
        // Request offline notifications
        newSocket.emit('get-offline-notifications');
      });

      newSocket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason);
        setIsConnected(false);
        setIsConnecting(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        setIsConnecting(false);
        reconnectAttempts.current++;
        
        if (reconnectAttempts.current >= maxReconnectAttempts) {
          console.error('Max reconnection attempts reached');
          newSocket.disconnect();
        }
      });

      // Notification handlers
      newSocket.on('notification', (notification: NotificationData) => {
        console.log('Received notification:', notification);
        setNotifications(prev => {
          // Avoid duplicates
          if (prev.some(n => n.id === notification.id)) {
            return prev;
          }
          
          // Add new notification at the beginning
          const updated = [{ ...notification, read: false }, ...prev];
          
          // Keep only last 100 notifications
          return updated.slice(0, 100);
        });

        // Show browser notification for high priority items
        if (notification.severity === 'high' || notification.severity === 'urgent') {
          showBrowserNotification(notification);
        }
      });

      newSocket.on('offline-notifications', (offlineNotifications: NotificationData[]) => {
        console.log('Received offline notifications:', offlineNotifications);
        setNotifications(prev => {
          const combined = [...offlineNotifications, ...prev];
          // Remove duplicates based on ID
          const unique = combined.filter((notification, index, self) => 
            index === self.findIndex(n => n.id === notification.id)
          );
          // Keep only last 100 notifications
          return unique.slice(0, 100);
        });
      });

      // Task update handlers
      newSocket.on('task-updated', (data) => {
        console.log('Task updated:', data);
        // Emit custom event for task update listeners
        window.dispatchEvent(new CustomEvent('task-updated', { detail: data }));
      });

      newSocket.on('task-created', (data) => {
        console.log('Task created:', data);
        window.dispatchEvent(new CustomEvent('task-created', { detail: data }));
      });

      newSocket.on('task-deleted', (data) => {
        console.log('Task deleted:', data);
        window.dispatchEvent(new CustomEvent('task-deleted', { detail: data }));
      });

      // Calendar sync handlers
      newSocket.on('calendar-sync-completed', (data) => {
        console.log('Calendar sync completed:', data);
        window.dispatchEvent(new CustomEvent('calendar-sync-completed', { detail: data }));
      });

      newSocket.on('calendar-conflict-detected', (data) => {
        console.log('Calendar conflict detected:', data);
        window.dispatchEvent(new CustomEvent('calendar-conflict-detected', { detail: data }));
      });

      socketRef.current = newSocket;
      setSocket(newSocket);

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setIsConnecting(false);
    }
  }, [isAuthenticated, user, serverUrl]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
      setIsConnecting(false);
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
  }, []);

  const sendMessage = useCallback((event: string, data: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn('Cannot send message: WebSocket not connected');
    }
  }, []);

  // Notification management functions
  const markNotificationAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Task subscription functions
  const subscribeToTaskUpdates = useCallback((taskId: string) => {
    sendMessage('subscribe-task-updates', { taskId });
  }, [sendMessage]);

  const unsubscribeFromTaskUpdates = useCallback((taskId: string) => {
    sendMessage('unsubscribe-task-updates', { taskId });
  }, [sendMessage]);

  const subscribeToCalendarSync = useCallback(() => {
    sendMessage('subscribe-calendar-sync', {});
  }, [sendMessage]);

  const unsubscribeFromCalendarSync = useCallback(() => {
    sendMessage('unsubscribe-calendar-sync', {});
  }, [sendMessage]);

  // Browser notification helper
  const showBrowserNotification = useCallback((notification: NotificationData) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id,
        requireInteraction: notification.severity === 'urgent',
      });
    }
  }, []);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Connect when authenticated, disconnect when not
  useEffect(() => {
    if (isAuthenticated && user) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [isAuthenticated, user, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  const value: WebSocketContextType = {
    socket,
    isConnected,
    isConnecting,
    notifications,
    unreadCount,
    connect,
    disconnect,
    markNotificationAsRead,
    markAllAsRead,
    clearNotifications,
    sendMessage,
    subscribeToTaskUpdates,
    unsubscribeFromTaskUpdates,
    subscribeToCalendarSync,
    unsubscribeFromCalendarSync,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}

// Custom hook for task-specific WebSocket operations
export function useTaskWebSocket(taskId?: string) {
  const { subscribeToTaskUpdates, unsubscribeFromTaskUpdates, sendMessage, isConnected } = useWebSocket();

  useEffect(() => {
    if (taskId && isConnected) {
      subscribeToTaskUpdates(taskId);
      
      return () => {
        unsubscribeFromTaskUpdates(taskId);
      };
    }
  }, [taskId, isConnected, subscribeToTaskUpdates, unsubscribeFromTaskUpdates]);

  const updateTaskStatus = useCallback((status: string) => {
    if (taskId) {
      sendMessage('update-task-status', { taskId, status });
    }
  }, [taskId, sendMessage]);

  const updateTaskProgress = useCallback((progress: number) => {
    if (taskId) {
      sendMessage('update-task-progress', { taskId, progress });
    }
  }, [taskId, sendMessage]);

  return {
    updateTaskStatus,
    updateTaskProgress,
  };
}

// Custom hook for calendar-specific WebSocket operations
export function useCalendarWebSocket() {
  const { subscribeToCalendarSync, unsubscribeFromCalendarSync, sendMessage, isConnected } = useWebSocket();

  useEffect(() => {
    if (isConnected) {
      subscribeToCalendarSync();
      
      return () => {
        unsubscribeFromCalendarSync();
      };
    }
  }, [isConnected, subscribeToCalendarSync, unsubscribeFromCalendarSync]);

  const triggerCalendarSync = useCallback(() => {
    sendMessage('trigger-calendar-sync', {});
  }, [sendMessage]);

  const resolveCalendarConflict = useCallback((conflictId: string, resolution: string) => {
    sendMessage('resolve-calendar-conflict', { conflictId, resolution });
  }, [sendMessage]);

  return {
    triggerCalendarSync,
    resolveCalendarConflict,
  };
}
