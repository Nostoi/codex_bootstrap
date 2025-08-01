'use client';

import React from 'react';
import { Wifi, WifiOff, Users, Clock, AlertCircle } from 'lucide-react';
import { useWebSocket } from '../../contexts/WebSocketContext';

interface RealTimeStatusProps {
  className?: string;
  showDetails?: boolean;
}

export function RealTimeStatus({ className = '', showDetails = false }: RealTimeStatusProps) {
  const { isConnected, isConnecting } = useWebSocket();

  const getStatusIcon = () => {
    if (isConnecting) {
      return <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />;
    }
    
    if (isConnected) {
      return <Wifi className="w-4 h-4 text-green-500" />;
    }
    
    return <WifiOff className="w-4 h-4 text-red-500" />;
  };

  const getStatusText = () => {
    if (isConnecting) return 'Connecting...';
    if (isConnected) return 'Real-time sync active';
    return 'Disconnected';
  };

  const getStatusColor = () => {
    if (isConnecting) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (isConnected) return 'text-green-600 bg-green-50 border-green-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  if (!showDetails) {
    return (
      <div className={`flex items-center gap-2 ${className}`} title={getStatusText()}>
        {getStatusIcon()}
        {showDetails && <span className="text-sm">{getStatusText()}</span>}
      </div>
    );
  }

  return (
    <div className={`rounded-lg border p-3 ${getStatusColor()} ${className}`}>
      <div className="flex items-center gap-3">
        {getStatusIcon()}
        <div className="flex-1">
          <div className="font-medium text-sm">{getStatusText()}</div>
          {isConnected && (
            <div className="text-xs opacity-75 mt-1">
              Live updates for tasks, calendar, and notifications
            </div>
          )}
          {!isConnected && !isConnecting && (
            <div className="text-xs opacity-75 mt-1">
              Changes will sync when connection is restored
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ConnectionStatsProps {
  className?: string;
}

export function ConnectionStats({ className = '' }: ConnectionStatsProps) {
  const { isConnected } = useWebSocket();
  
  // Mock data - in a real app, you'd get this from the WebSocket context
  const stats = {
    onlineUsers: 3,
    lastSync: new Date(Date.now() - 30000), // 30 seconds ago
    messagesReceived: 42,
    uptime: '2h 15m',
  };

  if (!isConnected) {
    return null;
  }

  return (
    <div className={`grid grid-cols-2 gap-4 ${className}`}>
      <div className="flex items-center gap-2 text-sm">
        <Users className="w-4 h-4 text-blue-500" />
        <span className="text-gray-600">
          {stats.onlineUsers} online
        </span>
      </div>
      
      <div className="flex items-center gap-2 text-sm">
        <Clock className="w-4 h-4 text-green-500" />
        <span className="text-gray-600">
          Synced {Math.floor((Date.now() - stats.lastSync.getTime()) / 1000)}s ago
        </span>
      </div>
      
      <div className="flex items-center gap-2 text-sm">
        <AlertCircle className="w-4 h-4 text-purple-500" />
        <span className="text-gray-600">
          {stats.messagesReceived} updates
        </span>
      </div>
      
      <div className="flex items-center gap-2 text-sm">
        <Wifi className="w-4 h-4 text-blue-500" />
        <span className="text-gray-600">
          Up {stats.uptime}
        </span>
      </div>
    </div>
  );
}
