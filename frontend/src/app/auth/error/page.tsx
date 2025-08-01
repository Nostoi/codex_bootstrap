'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AuthErrorPage() {
  const [errorMessage, setErrorMessage] = useState('An unknown error occurred');
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const message = searchParams.get('message');
    if (message) {
      setErrorMessage(decodeURIComponent(message));
    }
  }, [searchParams]);

  const handleRetry = () => {
    router.push('/auth/login');
  };

  const handleHome = () => {
    router.push('/');
  };

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
            {errorMessage}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={handleRetry} className="w-full">
            Try Again
          </Button>
          <Button onClick={handleHome} variant="outline" className="w-full">
            Go Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
