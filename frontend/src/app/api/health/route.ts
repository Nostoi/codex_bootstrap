import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check if backend is accessible
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    let backendStatus = 'unknown';
    try {
      const response = await fetch(`${backendUrl}/health`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        // Short timeout for health checks
        signal: AbortSignal.timeout(3000),
      });
      backendStatus = response.ok ? 'healthy' : 'unhealthy';
    } catch (error) {
      backendStatus = 'unreachable';
    }

    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_APP_VERSION || '0.0.1',
      environment: process.env.NODE_ENV || 'development',
      backend: {
        status: backendStatus,
        url: backendUrl,
      },
      services: {
        nextjs: 'healthy',
        frontend: 'healthy',
      },
    };

    return NextResponse.json(healthData, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
