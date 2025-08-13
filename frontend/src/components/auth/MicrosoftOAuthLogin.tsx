'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, CheckCircle, Clock, Shield, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui';

// ADHD-optimized color scheme
const ADHD_COLORS = {
  SUCCESS: 'bg-green-100 text-green-800 border-green-200',
  LOADING: 'bg-blue-100 text-blue-800 border-blue-200',
  ERROR: 'bg-orange-100 text-orange-800 border-orange-200',
  NEUTRAL: 'bg-gray-100 text-gray-800 border-gray-200',
} as const;

interface ADHDAuthState {
  showOnlyEssential: boolean;
  enableFocusMode: boolean;
  provideCalmingAnimations: boolean;
  minimizeDecisions: boolean;
}

interface MicrosoftOAuthLoginProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
  adhdOptions?: Partial<ADHDAuthState>;
}

export function MicrosoftOAuthLogin({
  onSuccess,
  onCancel,
  className = '',
  adhdOptions = {},
}: MicrosoftOAuthLoginProps) {
  const [authState, setAuthState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  // ADHD configuration with defaults
  const adhdConfig: ADHDAuthState = {
    showOnlyEssential: true,
    enableFocusMode: true,
    provideCalmingAnimations: true,
    minimizeDecisions: true,
    ...adhdOptions,
  };

  const handleConnect = useCallback(async () => {
    try {
      setAuthState('loading');
      setErrorMessage('');

      // Provide immediate feedback
      await new Promise(resolve => setTimeout(resolve, 100));

      await login('microsoft');

      setAuthState('success');
      onSuccess?.();
    } catch (error) {
      setAuthState('error');
      setErrorMessage(
        error instanceof Error
          ? "Connection didn't work. This sometimes happens."
          : "Something went wrong. Let's try again."
      );
    }
  }, [login, onSuccess]);

  const handleRetry = useCallback(() => {
    setAuthState('idle');
    setErrorMessage('');
  }, []);

  const CalendarPreview = () => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      <h4 className="text-sm font-medium text-gray-700 mb-3">What you'll see:</h4>
      <div className="space-y-2">
        <div className="flex items-center space-x-3 p-2 bg-green-50 rounded border-l-4 border-green-400">
          <Calendar className="w-4 h-4 text-green-600" />
          <div>
            <div className="text-sm font-medium text-green-800">Team Meeting</div>
            <div className="text-xs text-green-600">9:00 AM - HIGH energy needed</div>
          </div>
        </div>
        <div className="flex items-center space-x-3 p-2 bg-yellow-50 rounded border-l-4 border-yellow-400">
          <Calendar className="w-4 h-4 text-yellow-600" />
          <div>
            <div className="text-sm font-medium text-yellow-800">Code Review</div>
            <div className="text-xs text-yellow-600">2:00 PM - MEDIUM energy needed</div>
          </div>
        </div>
      </div>
    </div>
  );

  const LoadingState = () => (
    <div className={`flex items-center space-x-3 p-4 rounded-lg border ${ADHD_COLORS.LOADING}`}>
      <div className="animate-spin w-5 h-5 border-2 border-blue-300 border-t-blue-600 rounded-full" />
      <div>
        <div className="font-medium">Connecting to Microsoft...</div>
        <div className="text-sm opacity-75">This takes about 30 seconds</div>
      </div>
    </div>
  );

  const SuccessState = () => (
    <div className={`flex items-center space-x-3 p-4 rounded-lg border ${ADHD_COLORS.SUCCESS}`}>
      <CheckCircle className="w-5 h-5 text-green-600" />
      <div>
        <div className="font-medium">Successfully connected!</div>
        <div className="text-sm opacity-75">Your calendar is now syncing</div>
      </div>
    </div>
  );

  const ErrorState = () => (
    <div className={`p-6 rounded-lg border ${ADHD_COLORS.ERROR}`}>
      <div className="flex items-center space-x-3 mb-4">
        <AlertCircle className="w-5 h-5 text-orange-600" />
        <h3 className="font-medium">Connection Issue</h3>
      </div>
      <p className="text-sm mb-4">
        We couldn't connect to your Microsoft calendar. This sometimes happens and it's not your
        fault.
      </p>
      <div className="flex space-x-3">
        <Button
          onClick={handleConnect}
          className="bg-orange-600 hover:bg-orange-700 text-white"
          size="sm"
        >
          Try Again
        </Button>
        {onCancel && (
          <Button
            onClick={onCancel}
            variant="outline"
            className="border-orange-300 text-orange-600 hover:bg-orange-50"
            size="sm"
          >
            Maybe Later
          </Button>
        )}
      </div>
    </div>
  );

  const IdleState = () => (
    <div className="space-y-6">
      {/* Value Proposition */}
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Calendar className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Connect Your Microsoft Calendar
        </h2>
        <p className="text-gray-600 max-w-md mx-auto">
          See all your Outlook events with ADHD-friendly energy level indicators in one place.
        </p>
      </div>

      {/* Preview Toggle */}
      {!adhdConfig.showOnlyEssential && (
        <div className="text-center">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="text-blue-600 hover:text-blue-700 text-sm underline"
          >
            {showPreview ? 'Hide preview' : 'See what this looks like'}
          </button>
        </div>
      )}

      {/* Calendar Preview */}
      {showPreview && <CalendarPreview />}

      {/* Benefits List */}
      <div className="space-y-3">
        <div className="flex items-center space-x-3">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <span className="text-sm text-gray-700">Automatic energy level detection</span>
        </div>
        <div className="flex items-center space-x-3">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <span className="text-sm text-gray-700">Smart conflict resolution</span>
        </div>
        <div className="flex items-center space-x-3">
          <Shield className="w-5 h-5 text-blue-500" />
          <span className="text-sm text-gray-700">Your privacy is protected</span>
        </div>
        <div className="flex items-center space-x-3">
          <Clock className="w-5 h-5 text-purple-500" />
          <span className="text-sm text-gray-700">Takes about 30 seconds</span>
        </div>
      </div>

      {/* Main Action */}
      <div className="text-center">
        <Button
          onClick={handleConnect}
          size="lg"
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
          aria-describedby="connect-description"
        >
          Connect Microsoft Calendar
        </Button>
        <p id="connect-description" className="text-xs text-gray-500 mt-2">
          You'll be redirected to Microsoft to approve access
        </p>
      </div>

      {/* Cancel Option */}
      {onCancel && (
        <div className="text-center">
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-700 text-sm">
            Skip for now
          </button>
        </div>
      )}
    </div>
  );

  // Focus mode background overlay
  const FocusModeOverlay = () =>
    adhdConfig.enableFocusMode && authState !== 'idle' ? (
      <div className="fixed inset-0 bg-black bg-opacity-20 z-40" />
    ) : null;

  return (
    <>
      <FocusModeOverlay />
      <div
        className={`
          relative max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg
          ${adhdConfig.enableFocusMode && authState !== 'idle' ? 'z-50' : ''}
          ${className}
        `}
        role="dialog"
        aria-labelledby="oauth-login-title"
        aria-describedby="oauth-login-description"
      >
        {/* Progress Indicator */}
        {authState !== 'idle' && (
          <div className="mb-4">
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <span>Step 1 of 2</span>
              <span>•</span>
              <span>Connecting...</span>
            </div>
          </div>
        )}

        {/* Content based on state */}
        {authState === 'idle' && <IdleState />}
        {authState === 'loading' && <LoadingState />}
        {authState === 'success' && <SuccessState />}
        {authState === 'error' && <ErrorState />}
      </div>
    </>
  );
}

export default MicrosoftOAuthLogin;
