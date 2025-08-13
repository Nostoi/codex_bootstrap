'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle, XCircle, Loader2, AlertCircle, Calendar } from 'lucide-react';
import { Button } from '@/components/ui';
import { api } from '@/lib/api';

// Force dynamic rendering for OAuth callback
export const dynamic = 'force-dynamic';

// ADHD-optimized feedback colors
const ADHD_COLORS = {
  SUCCESS: 'bg-green-100 text-green-800 border-green-200',
  LOADING: 'bg-blue-100 text-blue-800 border-blue-200',
  ERROR: 'bg-orange-100 text-orange-800 border-orange-200',
} as const;

interface MicrosoftCallbackState {
  status: 'loading' | 'success' | 'error' | 'processing';
  message: string;
  details?: string;
  userInfo?: {
    id: string;
    displayName: string;
    userPrincipalName: string;
    mail: string;
  };
  redirectCountdown?: number;
}

function MicrosoftCallbackContent() {
  const [state, setState] = useState<MicrosoftCallbackState>({
    status: 'loading',
    message: 'Processing your Microsoft calendar connection...',
  });

  const searchParams = useSearchParams();
  const router = useRouter();
  const { refreshToken } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get OAuth parameters
        const code = searchParams.get('code');
        const state = searchParams.get('state'); // Contains userId
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        // Handle OAuth errors from Microsoft
        if (error) {
          setState({
            status: 'error',
            message: 'Microsoft calendar connection was cancelled or failed',
            details: getHumanReadableError(error, errorDescription),
          });
          return;
        }

        // Validate required parameters
        if (!code || !state) {
          setState({
            status: 'error',
            message: 'Missing connection information',
            details: 'The connection process was interrupted. Please try connecting again.',
          });
          return;
        }

        setState({
          status: 'processing',
          message: 'Finalizing your calendar connection...',
        });

        // Process the callback with backend
        try {
          const response = await api.get<{
            success: boolean;
            message: string;
            userId: string;
            userInfo: {
              id: string;
              displayName: string;
              userPrincipalName: string;
              mail: string;
            };
          }>(
            `/auth/microsoft/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`
          );

          if (response.success) {
            setState({
              status: 'success',
              message: 'Microsoft calendar connected successfully!',
              userInfo: response.userInfo,
              redirectCountdown: 3,
            });

            // Refresh auth context
            await refreshToken();

            // Start countdown for redirect
            startRedirectCountdown();
          } else {
            throw new Error(response.message || 'Connection failed');
          }
        } catch (apiError) {
          console.error('OAuth callback API error:', apiError);
          setState({
            status: 'error',
            message: 'Connection processing failed',
            details:
              "We couldn't complete the connection to your Microsoft calendar. Please try again.",
          });
        }
      } catch (error) {
        console.error('OAuth callback error:', error);
        setState({
          status: 'error',
          message: 'Something went wrong',
          details: 'An unexpected error occurred. Please try connecting again.',
        });
      }
    };

    handleCallback();
  }, [searchParams, refreshToken]);

  const startRedirectCountdown = () => {
    let countdown = 3;
    const interval = setInterval(() => {
      countdown -= 1;
      setState(prev => ({ ...prev, redirectCountdown: countdown }));

      if (countdown <= 0) {
        clearInterval(interval);
        router.push('/dashboard');
      }
    }, 1000);
  };

  const getHumanReadableError = (error: string, description?: string | null) => {
    switch (error) {
      case 'access_denied':
        return "You cancelled the connection. That's okay - you can try again anytime.";
      case 'invalid_request':
        return 'Something went wrong with the connection request. Please try again.';
      case 'temporarily_unavailable':
        return "Microsoft's servers are temporarily busy. Please try again in a moment.";
      case 'server_error':
        return "Microsoft's servers encountered an issue. Please try again.";
      default:
        return description || 'An unexpected issue occurred during connection.';
    }
  };

  const handleRetry = () => {
    router.push('/settings/calendar');
  };

  const handleContinue = () => {
    router.push('/dashboard');
  };

  const LoadingState = () => (
    <div className="text-center space-y-6">
      <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>

      <div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">{state.message}</h1>
        <p className="text-gray-600">Please wait while we set up your calendar connection...</p>
      </div>

      <div className={`p-4 rounded-lg border ${ADHD_COLORS.LOADING}`}>
        <div className="flex items-center space-x-3">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="font-medium">Step 2 of 2</span>
        </div>
        <p className="text-sm mt-2 opacity-75">Processing your Microsoft calendar permissions</p>
      </div>
    </div>
  );

  const SuccessState = () => (
    <div className="text-center space-y-6">
      <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
        <CheckCircle className="w-8 h-8 text-green-600" />
      </div>

      <div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">{state.message}</h1>
        {state.userInfo && (
          <p className="text-gray-600">
            Connected to {state.userInfo.displayName}'s Microsoft calendar
          </p>
        )}
      </div>

      <div className={`p-4 rounded-lg border ${ADHD_COLORS.SUCCESS}`}>
        <div className="flex items-center space-x-3 mb-3">
          <Calendar className="w-5 h-5 text-green-600" />
          <span className="font-medium">Your calendar is now syncing</span>
        </div>
        <div className="text-sm space-y-1">
          <p>✅ Events will show energy level indicators</p>
          <p>✅ Conflicts will be automatically detected</p>
          <p>✅ Real-time updates are enabled</p>
        </div>
      </div>

      {state.redirectCountdown !== undefined && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700">
            Taking you to your dashboard in {state.redirectCountdown} second
            {state.redirectCountdown !== 1 ? 's' : ''}...
          </p>
          <Button
            onClick={handleContinue}
            className="mt-3 bg-blue-600 hover:bg-blue-700 text-white"
            size="sm"
          >
            Go to Dashboard Now
          </Button>
        </div>
      )}
    </div>
  );

  const ErrorState = () => (
    <div className="text-center space-y-6">
      <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
        <AlertCircle className="w-8 h-8 text-orange-600" />
      </div>

      <div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">{state.message}</h1>
        {state.details && <p className="text-gray-600 max-w-md mx-auto">{state.details}</p>}
      </div>

      <div className={`p-4 rounded-lg border ${ADHD_COLORS.ERROR}`}>
        <h3 className="font-medium mb-2">What happened?</h3>
        <p className="text-sm">
          The connection to Microsoft calendar couldn't be completed. This happens sometimes and
          it's not your fault.
        </p>
      </div>

      <div className="flex justify-center space-x-3">
        <Button onClick={handleRetry} className="bg-orange-600 hover:bg-orange-700 text-white">
          Try Connecting Again
        </Button>
        <Button
          onClick={handleContinue}
          variant="outline"
          className="border-orange-300 text-orange-600 hover:bg-orange-50"
        >
          Skip for Now
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {state.status === 'loading' && <LoadingState />}
        {state.status === 'processing' && <LoadingState />}
        {state.status === 'success' && <SuccessState />}
        {state.status === 'error' && <ErrorState />}
      </div>
    </div>
  );
}

// Loading fallback for Suspense boundary
function CallbackLoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

export default function MicrosoftOAuthCallback() {
  return (
    <Suspense fallback={<CallbackLoadingFallback />}>
      <MicrosoftCallbackContent />
    </Suspense>
  );
}
