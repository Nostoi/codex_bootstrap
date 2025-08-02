'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui';
import { CheckCircle, Calendar, Clock, Users, ArrowRight } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
// import { SiMicrosoft } from 'react-icons/si'; // Temporarily disabled - export not found

interface OnboardingFlowProps {
  onComplete?: () => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [calendarPermissions, setCalendarPermissions] = useState({
    google: false,
    microsoft: false,
  });
  const { user } = useAuth();

  const steps = [
    {
      id: 1,
      title: 'Welcome to Helmsman',
      description: 'Your AI-augmented task management system',
    },
    {
      id: 2,
      title: 'Calendar Integration',
      description: 'Connect your calendars for seamless task scheduling',
    },
    {
      id: 3,
      title: 'You\'re All Set!',
      description: 'Start managing your tasks with AI assistance',
    },
  ];

  const handleCalendarConnect = async (provider: 'google' | 'microsoft') => {
    try {
      // Request calendar permissions
      const response = await fetch(`/api/auth/${provider}/calendar-permissions`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        // Redirect to OAuth with calendar scopes
        if (typeof window !== 'undefined') { // SSR check
          window.location.href = data.authUrl;
        }
      } else {
        throw new Error('Failed to request calendar permissions');
      }
    } catch (error) {
      console.error('Calendar connection failed:', error);
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete?.();
    }
  };

  const handleSkip = () => {
    if (currentStep === 2) {
      setCurrentStep(3);
    } else {
      onComplete?.();
    }
  };

  const currentStepData = steps.find(step => step.id === currentStep);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center space-x-2 mb-6">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step.id <= currentStep
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {step.id < currentStep ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  step.id
                )}
              </div>
            ))}
          </div>
          <CardTitle className="text-2xl font-bold">
            {currentStepData?.title}
          </CardTitle>
          <CardDescription>
            {currentStepData?.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {currentStep === 1 && (
            <div className="text-center space-y-4">
              <div className="text-lg">
                Welcome, {user?.name || user?.email}! 👋
              </div>
              <div className="text-gray-600">
                Helmsman helps you manage tasks with AI assistance and seamless calendar integration.
                Let&apos;s get you set up in just a few steps.
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="flex flex-col items-center p-4 border rounded-lg">
                  <Calendar className="h-8 w-8 text-blue-600 mb-2" />
                  <div className="font-medium">Calendar Sync</div>
                  <div className="text-sm text-gray-500 text-center">
                    Integrate with Google Calendar and Outlook
                  </div>
                </div>
                <div className="flex flex-col items-center p-4 border rounded-lg">
                  <Clock className="h-8 w-8 text-green-600 mb-2" />
                  <div className="font-medium">Smart Scheduling</div>
                  <div className="text-sm text-gray-500 text-center">
                    AI-powered task scheduling and time blocking
                  </div>
                </div>
                <div className="flex flex-col items-center p-4 border rounded-lg">
                  <Users className="h-8 w-8 text-purple-600 mb-2" />
                  <div className="font-medium">Collaboration</div>
                  <div className="text-sm text-gray-500 text-center">
                    Share projects and collaborate with your team
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center text-gray-600">
                Connect your calendars to enable automatic task scheduling and conflict detection.
                You can skip this step and set it up later in settings.
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FcGoogle className="h-6 w-6" />
                    <div>
                      <div className="font-medium">Google Calendar</div>
                      <div className="text-sm text-gray-500">
                        Sync with Google Calendar and Gmail
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleCalendarConnect('google')}
                    variant={calendarPermissions.google ? 'outline' : 'default'}
                    size="sm"
                  >
                    {calendarPermissions.google ? 'Connected' : 'Connect'}
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-6 w-6 text-blue-600" /> {/* TODO: Replace with SiMicrosoft when available */}
                    <div>
                      <div className="font-medium">Microsoft Outlook</div>
                      <div className="text-sm text-gray-500">
                        Sync with Outlook Calendar and Microsoft 365
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleCalendarConnect('microsoft')}
                    variant={calendarPermissions.microsoft ? 'outline' : 'default'}
                    size="sm"
                  >
                    {calendarPermissions.microsoft ? 'Connected' : 'Connect'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="space-y-2">
                <div className="text-lg font-medium">You&apos;re ready to go!</div>
                <div className="text-gray-600">
                  Your Helmsman workspace is set up and ready. Start creating projects and tasks to
                  experience AI-powered productivity.
                </div>
              </div>
              <div className="flex justify-center">
                <Button onClick={handleNext} size="lg" className="flex items-center space-x-2">
                  <span>Start Using Helmsman</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {currentStep < 3 && (
            <div className="flex justify-between pt-6">
              <Button
                onClick={handleSkip}
                variant="ghost"
              >
                {currentStep === 2 ? 'Skip for now' : 'Skip'}
              </Button>
              <Button onClick={handleNext}>
                {currentStep === steps.length ? 'Complete' : 'Next'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
