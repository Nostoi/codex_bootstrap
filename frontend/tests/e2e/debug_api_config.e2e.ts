import { test, expect } from '@playwright/test';

test('DEBUG: Check API URL configuration', async ({ page }) => {
  // Add script to check environment variables
  await page.addInitScript(() => {
    console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
    console.log(
      'API_BASE_URL would be:',
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    );
  });

  // Navigate to dashboard
  await page.goto('/dashboard');

  // Check the environment in the browser context
  const apiUrl = await page.evaluate(() => {
    // Check if there's a way to access the API configuration
    return {
      nextPublicApiUrl: (globalThis as any).__env?.NEXT_PUBLIC_API_URL,
      currentHost: window.location.origin,
      // Try to access environment variables
      processEnv: typeof process !== 'undefined' ? process.env : 'not available',
    };
  });

  console.log('API URL configuration:', apiUrl);

  // Also check what URL would be constructed
  const testUrl = await page.evaluate(() => {
    const API_BASE_URL = (process as any)?.env?.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const endpoint = '/api/ai/extract-tasks';
    return `${API_BASE_URL}${endpoint}`;
  });

  console.log('Constructed API URL would be:', testUrl);
});
