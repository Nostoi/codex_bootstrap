'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FcGoogle } from 'react-icons/fc';
// import { SiMicrosoft } from 'react-icons/si'; // Temporary comment out for build

interface LoginFormProps {
  onSuccess?: () => void;
  redirectUri?: string;
}

export function LoginForm({ onSuccess, redirectUri }: LoginFormProps) {
  const { login, isLoading } = useAuth();

  const handleLogin = async (provider: 'google' | 'microsoft') => {
    try {
      await login(provider);
      onSuccess?.();
    } catch (error) {
      console.error('Login failed:', error);
      // You could add toast notification here
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Sign in to Helmsman</CardTitle>
        <CardDescription className="text-center">
          Choose your preferred authentication provider
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          variant="outline"
          size="lg"
          className="w-full"
          onClick={() => handleLogin('google')}
          disabled={isLoading}
        >
          <FcGoogle className="mr-2 h-5 w-5" />
          Continue with Google
        </Button>
        
        {/* Temporarily commented out until SiMicrosoft import is fixed
        <Button
          variant="outline"
          size="lg"
          className="w-full"
          onClick={() => handleLogin('microsoft')}
          disabled={isLoading}
        >
          <SiMicrosoft className="mr-2 h-5 w-5 text-blue-600" />
          Continue with Microsoft
        </Button>
        */}
        
        <div className="text-xs text-gray-500 text-center mt-4">
          By signing in, you agree to our Terms of Service and Privacy Policy.
          We&apos;ll request access to your calendar to sync your tasks and events.
        </div>
      </CardContent>
    </Card>
  );
}
