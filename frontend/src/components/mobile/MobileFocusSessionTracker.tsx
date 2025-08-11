'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Square,
  Plus,
  Minus,
  Battery,
  Brain,
  Clock,
  Target,
  AlertCircle,
  CheckCircle,
  Coffee,
} from 'lucide-react';
import { useRecordFocusSession } from '../../hooks/useAnalytics';

interface MobileFocusSessionTrackerProps {
  onSessionStart?: () => void;
  onSessionEnd?: (sessionData: FocusSessionData) => void;
  className?: string;
}

interface FocusSessionData {
  duration: number;
  activity: string;
  energyBefore: number;
  energyAfter: number;
  interruptions: number;
  quality: number;
  hyperfocusDetected: boolean;
}

const activityTypes = [
  { id: 'coding', label: 'Coding', icon: '💻', color: 'bg-blue-100 text-blue-800' },
  { id: 'writing', label: 'Writing', icon: '✍️', color: 'bg-purple-100 text-purple-800' },
  { id: 'reading', label: 'Reading', icon: '📚', color: 'bg-green-100 text-green-800' },
  { id: 'planning', label: 'Planning', icon: '📋', color: 'bg-yellow-100 text-yellow-800' },
  { id: 'meeting', label: 'Meeting', icon: '👥', color: 'bg-orange-100 text-orange-800' },
  { id: 'creative', label: 'Creative', icon: '🎨', color: 'bg-pink-100 text-pink-800' },
];

const energyLevels = [
  { value: 1, label: 'Very Low', icon: '😴', color: 'text-red-600' },
  { value: 2, label: 'Low', icon: '😕', color: 'text-orange-600' },
  { value: 3, label: 'Medium', icon: '😐', color: 'text-yellow-600' },
  { value: 4, label: 'Good', icon: '🙂', color: 'text-green-600' },
  { value: 5, label: 'Excellent', icon: '😄', color: 'text-blue-600' },
];

const qualityLevels = [
  { value: 1, label: 'Poor', icon: '😞', description: 'Very distracted, little progress' },
  { value: 2, label: 'Fair', icon: '😕', description: 'Some distractions, slow progress' },
  { value: 3, label: 'Good', icon: '🙂', description: 'Focused, steady progress' },
  { value: 4, label: 'Great', icon: '😊', description: 'Very focused, great progress' },
  { value: 5, label: 'Flow', icon: '🤩', description: 'Deep focus, exceptional progress' },
];

export function MobileFocusSessionTracker({
  onSessionStart,
  onSessionEnd,
  className = '',
}: MobileFocusSessionTrackerProps) {
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [selectedActivity, setSelectedActivity] = useState(activityTypes[0].id);
  const [energyBefore, setEnergyBefore] = useState(3);
  const [energyAfter, setEnergyAfter] = useState(3);
  const [interruptions, setInterruptions] = useState(0);
  const [quality, setQuality] = useState(3);
  const [showPreSession, setShowPreSession] = useState(true);
  const [showPostSession, setShowPostSession] = useState(false);
  const [hyperfocusDetected, setHyperfocusDetected] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const recordMutation = useRecordFocusSession();

  // Timer logic
  useEffect(() => {
    if (isActive && !isPaused) {
      intervalRef.current = setInterval(() => {
        setDuration(prev => {
          const newDuration = prev + 1;
          // Detect potential hyperfocus (sessions over 2 hours)
          if (newDuration > 7200 && !hyperfocusDetected) {
            setHyperfocusDetected(true);
          }
          return newDuration;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, isPaused, hyperfocusDetected]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const startSession = () => {
    setIsActive(true);
    setIsPaused(false);
    setShowPreSession(false);
    setDuration(0);
    setInterruptions(0);
    setHyperfocusDetected(false);
    onSessionStart?.();
  };

  const pauseSession = () => {
    setIsPaused(!isPaused);
  };

  const endSession = () => {
    setIsActive(false);
    setIsPaused(false);
    setShowPostSession(true);
  };

  const saveSession = async () => {
    const sessionData: FocusSessionData = {
      duration,
      activity: selectedActivity,
      energyBefore,
      energyAfter,
      interruptions,
      quality,
      hyperfocusDetected,
    };

    try {
      await recordMutation.mutateAsync({
        duration,
        activity: selectedActivity,
        energyBefore,
        energyAfter,
        interruptions,
        quality,
      });

      onSessionEnd?.(sessionData);

      // Reset for next session
      setShowPostSession(false);
      setShowPreSession(true);
      setDuration(0);
      setEnergyBefore(3);
      setInterruptions(0);
      setQuality(3);
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  };

  const addInterruption = () => {
    setInterruptions(prev => prev + 1);
  };

  // Pre-session setup
  if (showPreSession && !isActive) {
    return (
      <div className={`card bg-base-100 shadow-lg ${className}`}>
        <div className="card-body p-6">
          <h2 className="card-title text-2xl mb-6 flex items-center gap-2">
            <Brain className="w-7 h-7 text-primary" />
            Start Focus Session
          </h2>

          {/* Activity Selection */}
          <div className="mb-6">
            <label className="label">
              <span className="label-text text-lg font-semibold">What will you work on?</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {activityTypes.map(activity => (
                <button
                  key={activity.id}
                  onClick={() => setSelectedActivity(activity.id)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedActivity === activity.id
                      ? 'border-primary bg-primary/10'
                      : 'border-base-300 hover:border-base-400'
                  }`}
                >
                  <div className="text-2xl mb-2">{activity.icon}</div>
                  <div className="text-sm font-medium">{activity.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Energy Level Before */}
          <div className="mb-6">
            <label className="label">
              <span className="label-text text-lg font-semibold">How's your energy?</span>
            </label>
            <div className="flex gap-2">
              {energyLevels.map(level => (
                <button
                  key={level.value}
                  onClick={() => setEnergyBefore(level.value)}
                  className={`btn btn-circle flex-1 min-h-[60px] ${
                    energyBefore === level.value ? 'btn-primary' : 'btn-outline'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl">{level.icon}</div>
                    <div className="text-xs">{level.label}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Start Button */}
          <button
            onClick={startSession}
            className="btn btn-primary btn-lg w-full min-h-[60px] text-xl gap-3"
          >
            <Play className="w-6 h-6" />
            Start Focus Session
          </button>
        </div>
      </div>
    );
  }

  // Active session
  if (isActive || showPostSession) {
    return (
      <div className={`card bg-base-100 shadow-lg ${className}`}>
        <div className="card-body p-6">
          {/* Session Header */}
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold mb-2">{formatTime(duration)}</h2>
            <div className="flex items-center justify-center gap-2 text-lg">
              <span className="text-2xl">
                {activityTypes.find(a => a.id === selectedActivity)?.icon}
              </span>
              <span className="font-medium">
                {activityTypes.find(a => a.id === selectedActivity)?.label}
              </span>
            </div>
          </div>

          {/* Hyperfocus Warning */}
          {hyperfocusDetected && isActive && (
            <div className="alert alert-warning mb-4">
              <Brain className="w-6 h-6" />
              <div>
                <h3 className="font-bold">Hyperfocus Detected!</h3>
                <div className="text-sm">Consider taking a break soon to avoid burnout.</div>
              </div>
            </div>
          )}

          {/* Session Controls */}
          {isActive && !showPostSession && (
            <div className="flex gap-3 mb-6">
              <button
                onClick={pauseSession}
                className={`btn flex-1 min-h-[60px] text-lg gap-2 ${
                  isPaused ? 'btn-success' : 'btn-warning'
                }`}
              >
                {isPaused ? (
                  <>
                    <Play className="w-6 h-6" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="w-6 h-6" />
                    Pause
                  </>
                )}
              </button>
              <button
                onClick={endSession}
                className="btn btn-error flex-1 min-h-[60px] text-lg gap-2"
              >
                <Square className="w-6 h-6" />
                End Session
              </button>
            </div>
          )}

          {/* Interruption Counter */}
          {isActive && !showPostSession && (
            <div className="flex items-center justify-between p-4 bg-base-200 rounded-lg mb-6">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-500" />
                <span className="font-medium">Interruptions: {interruptions}</span>
              </div>
              <button
                onClick={addInterruption}
                className="btn btn-circle btn-outline btn-sm min-h-[44px] min-w-[44px]"
                aria-label="Add interruption"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Post-session feedback */}
          {showPostSession && (
            <div className="space-y-6">
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">Session Complete!</h3>
                <p className="text-base-content/70">Great work! Please rate your session.</p>
              </div>

              {/* Energy After */}
              <div>
                <label className="label">
                  <span className="label-text text-lg font-semibold">Energy after session:</span>
                </label>
                <div className="flex gap-2">
                  {energyLevels.map(level => (
                    <button
                      key={level.value}
                      onClick={() => setEnergyAfter(level.value)}
                      className={`btn btn-circle flex-1 min-h-[60px] ${
                        energyAfter === level.value ? 'btn-primary' : 'btn-outline'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-2xl">{level.icon}</div>
                        <div className="text-xs">{level.label}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quality Rating */}
              <div>
                <label className="label">
                  <span className="label-text text-lg font-semibold">Session quality:</span>
                </label>
                <div className="space-y-2">
                  {qualityLevels.map(level => (
                    <button
                      key={level.value}
                      onClick={() => setQuality(level.value)}
                      className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                        quality === level.value
                          ? 'border-primary bg-primary/10'
                          : 'border-base-300 hover:border-base-400'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{level.icon}</span>
                        <div>
                          <div className="font-semibold">{level.label}</div>
                          <div className="text-sm text-base-content/70">{level.description}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Save Button */}
              <button
                onClick={saveSession}
                disabled={recordMutation.isPending}
                className="btn btn-primary btn-lg w-full min-h-[60px] text-xl gap-3"
              >
                {recordMutation.isPending ? (
                  <span className="loading loading-spinner"></span>
                ) : (
                  <CheckCircle className="w-6 h-6" />
                )}
                Save Session
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}

export default MobileFocusSessionTracker;
