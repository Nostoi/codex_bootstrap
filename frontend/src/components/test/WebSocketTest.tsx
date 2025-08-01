'use client';

import React from 'react';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { useNotifications } from '../../hooks/useNotifications';
import { useRealTimeTasks } from '../../hooks/useRealTimeTasks';
import { NotificationsPanel } from '../../components/notifications/NotificationsPanel';
import { RealTimeStatus } from '../../components/realtime/RealTimeStatus';

export function WebSocketTest() {
  const { isConnected, sendMessage } = useWebSocket();
  const { notifications, unreadCount } = useNotifications();
  const { tasks, isLoading } = useRealTimeTasks();

  const sendTestMessage = () => {
    sendMessage('test-message', { message: 'Hello from frontend!' });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">WebSocket Real-time Integration Test</h1>
      
      {/* Connection Status */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Connection Status</h2>
        <RealTimeStatus showDetails={true} className="mb-4" />
        
        <button
          onClick={sendTestMessage}
          disabled={!isConnected}
          className={`px-4 py-2 rounded-lg ${
            isConnected
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Send Test Message
        </button>
      </div>

      {/* Notifications Panel */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Notifications ({unreadCount} unread)</h2>
        <div className="border rounded-lg p-4">
          <NotificationsPanel />
          
          {notifications.length === 0 ? (
            <p className="text-gray-500">No notifications yet</p>
          ) : (
            <div className="mt-4">
              <h3 className="font-medium mb-2">Recent notifications:</h3>
              <div className="space-y-2">
                {notifications.slice(0, 3).map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-2 rounded border-l-4 ${
                      notification.severity === 'urgent'
                        ? 'border-red-500 bg-red-50'
                        : notification.severity === 'high'
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-blue-500 bg-blue-50'
                    }`}
                  >
                    <div className="font-medium">{notification.title}</div>
                    <div className="text-sm text-gray-600">{notification.message}</div>
                    <div className="text-xs text-gray-400">{notification.timestamp}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tasks */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Real-time Tasks</h2>
        <div className="border rounded-lg p-4">
          {isLoading ? (
            <p className="text-gray-500">Loading tasks...</p>
          ) : tasks.length === 0 ? (
            <p className="text-gray-500">No tasks found</p>
          ) : (
            <div className="space-y-2">
              {tasks.slice(0, 5).map((task) => (
                <div
                  key={task.id}
                  className="p-3 border rounded-lg flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium">{task.title}</div>
                    <div className="text-sm text-gray-600">
                      Status: {task.status} | Priority: {task.priority}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    {task.updatedAt}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Debug Info */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Debug Information</h2>
        <div className="bg-gray-100 p-4 rounded-lg">
          <pre className="text-sm">
            {JSON.stringify(
              {
                isConnected,
                notificationCount: notifications.length,
                unreadCount,
                taskCount: tasks.length,
                isLoading,
              },
              null,
              2
            )}
          </pre>
        </div>
      </div>
    </div>
  );
}
