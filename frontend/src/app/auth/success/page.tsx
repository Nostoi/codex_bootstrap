'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

function AuthSuccessContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [userInfo, setUserInfo] = useState<any>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { refreshToken } = useAuth();

  useEffect(() => {
    const handleAuthSuccess = async () => {
      try {
        const userParam = searchParams.get('user');
        
        if (userParam) {
          const user = JSON.parse(decodeURIComponent(userParam));
          setUserInfo(user);
        }

        // Refresh the auth context to get the latest user state
        const refreshed = await refreshToken();
        
        if (refreshed) {
          setStatus('success');
          // Redirect to dashboard after a short delay
          setTimeout(() => {
            router.push('/dashboard');
          }, 2000);
        } else {
          setStatus('error');
        }
      } catch (error) {
        console.error('Auth success handling failed:', error);
        setStatus('error');
      }
    };

    handleAuthSuccess();
  }, [searchParams, refreshToken, router]);

  const handleContinue = () => {
    router.push('/dashboard');
  };

  const handleRetry = () => {
    router.push('/auth/login');
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Completing authentication...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-xl font-semibold text-gray-900">
              Welcome to Helmsman!
            </CardTitle>
            <CardDescription>
              Authentication successful. You&apos;re being redirected to your dashboard.
              {userInfo && (
                <div className="mt-2 text-sm">
                  Welcome back, {userInfo.name || userInfo.email}!
                </div>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleContinue} className="w-full">
              Continue to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <XCircle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            Authentication Failed
          </CardTitle>
          <CardDescription>
            There was a problem completing your authentication. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleRetry} className="w-full">
            Try Again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuthSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthSuccessContent />
    </Suspense>
  );
}
