import React from 'react';
import { useRealTimeCalendarSync } from '../../hooks/useRealTimeCalendarSync';

/**
 * Real-time sync status indicator component
 * ADHD-friendly visual feedback for sync status
 */
export function RealTimeSyncIndicator() {
  const { syncStatus, hasConflicts, getStatusMessage, getStatusColor } = useRealTimeCalendarSync();

  return (
    <div className={`real-time-sync-indicator alert alert-${getStatusColor()} alert-sm`}>
      <div className="flex items-center space-x-2">
        <div
          className={`w-2 h-2 rounded-full ${
            syncStatus.isConnected ? 'bg-success animate-pulse' : 'bg-error'
          }`}
        />
        <span className="text-xs">{getStatusMessage()}</span>
        {hasConflicts && <button className="btn btn-xs btn-warning">Resolve Conflicts</button>}
      </div>
    </div>
  );
}
