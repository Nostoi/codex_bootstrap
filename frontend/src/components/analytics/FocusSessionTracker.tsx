'use client';

import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Square,
  Clock,
  Target,
  Activity,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Brain,
  Coffee,
  Zap,
} from 'lucide-react';
import { useFocusSessionTracking } from '../../hooks/useAnalytics';
import { FocusSessionData } from '../../hooks/useAnalytics';

interface FocusSessionTrackerProps {
  className?: string;
  onSessionStart?: (session: FocusSessionData) => void;
  onSessionEnd?: (session: FocusSessionData) => void;
}

export function FocusSessionTracker({
  className = '',
  onSessionStart,
  onSessionEnd,
}: FocusSessionTrackerProps) {
  const { currentSession, startSession, endSession, addInterruption, addTaskCompleted } =
    useFocusSessionTracking();

  const [selectedActivity, setSelectedActivity] =
    useState<FocusSessionData['activityType']>('TECHNICAL');
  const [selectedEnergy, setSelectedEnergy] = useState<FocusSessionData['energyLevel']>('MEDIUM');
  const [sessionDuration, setSessionDuration] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Update session duration every second
  useEffect(() => {
    if (!currentSession || isPaused) return;

    const interval = setInterval(() => {
      const duration = Math.floor((Date.now() - currentSession.startTime.getTime()) / 1000);
      setSessionDuration(duration);
    }, 1000);

    return () => clearInterval(interval);
  }, [currentSession, isPaused]);

  const handleStartSession = () => {
    const session = startSession(selectedActivity, selectedEnergy);
    setSessionDuration(0);
    setIsPaused(false);
    onSessionStart?.(session);
  };

  const handleEndSession = async (quality?: FocusSessionData['quality']) => {
    if (!currentSession) return;

    try {
      const endedSession = await endSession(quality);
      if (endedSession) {
        onSessionEnd?.(endedSession);
      }
      setSessionDuration(0);
      setIsPaused(false);
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  };

  const handlePauseToggle = () => {
    setIsPaused(!isPaused);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDurationColor = (seconds: number) => {
    const minutes = seconds / 60;
    if (minutes < 15) return 'text-gray-600';
    if (minutes < 45) return 'text-blue-600';
    if (minutes < 90) return 'text-green-600';
    return 'text-purple-600'; // Hyperfocus territory
  };

  const getActivityIcon = (activity: FocusSessionData['activityType']) => {
    switch (activity) {
      case 'CREATIVE':
        return '🎨';
      case 'TECHNICAL':
        return '💻';
      case 'ADMINISTRATIVE':
        return '📋';
      case 'SOCIAL':
        return '👥';
      case 'BREAK':
        return '☕';
      default:
        return '📝';
    }
  };

  const getEnergyIcon = (energy: FocusSessionData['energyLevel']) => {
    switch (energy) {
      case 'HIGH':
        return '🚀';
      case 'MEDIUM':
        return '⚡';
      case 'LOW':
        return '🔋';
      default:
        return '⚡';
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Target className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Focus Session Tracker</h2>
            <p className="text-sm text-gray-600">Track your focus sessions for ADHD insights</p>
          </div>
        </div>
      </div>

      {!currentSession ? (
        /* Session Setup */
        <div className="p-6">
          <div className="space-y-6">
            {/* Activity Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Activity Type</label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {(['CREATIVE', 'TECHNICAL', 'ADMINISTRATIVE', 'SOCIAL', 'BREAK'] as const).map(
                  activity => (
                    <button
                      key={activity}
                      onClick={() => setSelectedActivity(activity)}
                      className={`p-3 text-center rounded-lg border transition-colors ${
                        selectedActivity === activity
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      <div className="text-lg mb-1">{getActivityIcon(activity)}</div>
                      <div className="text-xs font-medium capitalize">{activity.toLowerCase()}</div>
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Energy Level Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Current Energy Level
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['LOW', 'MEDIUM', 'HIGH'] as const).map(energy => (
                  <button
                    key={energy}
                    onClick={() => setSelectedEnergy(energy)}
                    className={`p-4 text-center rounded-lg border transition-colors ${
                      selectedEnergy === energy
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <div className="text-2xl mb-2">{getEnergyIcon(energy)}</div>
                    <div className="text-sm font-medium">{energy}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {energy === 'HIGH' && 'Peak focus'}
                      {energy === 'MEDIUM' && 'Steady work'}
                      {energy === 'LOW' && 'Light tasks'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={handleStartSession}
              className="w-full flex items-center justify-center gap-3 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Play className="w-5 h-5" />
              Start Focus Session
            </button>
          </div>
        </div>
      ) : (
        /* Active Session */
        <div className="p-6">
          <div className="space-y-6">
            {/* Session Info */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="text-lg">{getActivityIcon(currentSession.activityType)}</div>
                  <span className="font-medium text-blue-900 capitalize">
                    {currentSession.activityType.toLowerCase()} Session
                  </span>
                  <div className="text-lg">{getEnergyIcon(currentSession.energyLevel)}</div>
                </div>
                <div
                  className={`text-2xl font-mono font-bold ${getDurationColor(sessionDuration)}`}
                >
                  {formatDuration(sessionDuration)}
                </div>
              </div>

              {sessionDuration > 5400 && ( // 90 minutes
                <div className="flex items-center gap-2 text-purple-700 bg-purple-100 px-3 py-2 rounded-lg">
                  <Brain className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Hyperfocus detected! Consider taking a break.
                  </span>
                </div>
              )}
            </div>

            {/* Session Controls */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handlePauseToggle}
                className="flex items-center justify-center gap-2 py-3 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors"
              >
                {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                {isPaused ? 'Resume' : 'Pause'}
              </button>

              <button
                onClick={() => handleEndSession()}
                className="flex items-center justify-center gap-2 py-3 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors"
              >
                <Square className="w-4 h-4" />
                End Session
              </button>
            </div>

            {/* Session Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={addInterruption}
                className="flex items-center justify-center gap-2 py-2 text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors"
              >
                <AlertTriangle className="w-4 h-4" />
                Mark Interruption ({currentSession.interruptions})
              </button>

              <button
                onClick={addTaskCompleted}
                className="flex items-center justify-center gap-2 py-2 text-green-600 border border-green-200 rounded-lg hover:bg-green-50 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Task Completed ({currentSession.tasksCompleted})
              </button>
            </div>

            {/* Quality Rating for End */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                How would you rate this session's quality?
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['poor', 'fair', 'good', 'excellent'] as const).map(quality => (
                  <button
                    key={quality}
                    onClick={() => handleEndSession(quality)}
                    className={`py-2 px-3 text-sm rounded-lg border transition-colors ${
                      quality === 'excellent'
                        ? 'border-green-500 text-green-700 hover:bg-green-50'
                        : quality === 'good'
                          ? 'border-blue-500 text-blue-700 hover:bg-blue-50'
                          : quality === 'fair'
                            ? 'border-yellow-500 text-yellow-700 hover:bg-yellow-50'
                            : 'border-red-500 text-red-700 hover:bg-red-50'
                    }`}
                  >
                    {quality}
                  </button>
                ))}
              </div>
            </div>

            {/* Tips */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Coffee className="w-5 h-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-700 font-medium mb-1">Focus Tips</p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• Take a 5-minute break every 25 minutes (Pomodoro technique)</li>
                    <li>• If you feel hyperfocus coming on, set a timer for 90 minutes</li>
                    <li>• Mark interruptions to identify patterns and improve focus</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
