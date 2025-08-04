import { test, expect } from '@playwright/test';

test('debug - check console errors', async ({ page }) => {
  // Capture console messages
  const consoleMessages: string[] = [];
  page.on('console', msg => {
    consoleMessages.push(`${msg.type()}: ${msg.text()}`);
  });

  // Capture JavaScript errors
  const pageErrors: string[] = [];
  page.on('pageerror', error => {
    pageErrors.push(error.message);
  });

  // Capture failed requests
  const failedRequests: string[] = [];
  page.on('requestfailed', request => {
    failedRequests.push(`${request.method()} ${request.url()} - ${request.failure()?.errorText}`);
  });

  await page.goto('/');
  await page.waitForLoadState('networkidle');

  console.log('Console messages:', consoleMessages);
  console.log('Page errors:', pageErrors);
  console.log('Failed requests:', failedRequests);

  // Try to see the actual error
  const errorText = await page.locator('body').textContent();
  console.log('Body text content:', errorText);
});
