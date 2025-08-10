import { test, expect } from '@playwright/test';

test('DEBUG: Monitor exact API URLs', async ({ page }) => {
  // Monitor ALL network requests
  const requests: string[] = [];
  const responses: { url: string; status: number }[] = [];

  page.on('request', request => {
    const url = request.url();
    requests.push(url);
    if (url.includes('/api/')) {
      console.log(`📡 API REQUEST: ${request.method()} ${url}`);
    }
  });

  page.on('response', response => {
    const url = response.url();
    const status = response.status();
    responses.push({ url, status });
    if (url.includes('/api/')) {
      console.log(`📥 API RESPONSE: ${status} ${url}`);
    }
  });

  // Set up route interception with more patterns
  console.log('🔧 Setting up route interception...');

  const interceptedUrls: string[] = [];

  const mockHandler = async (route: any) => {
    const url = route.request().url();
    interceptedUrls.push(url);
    console.log('🎯 ROUTE INTERCEPTED:', url);

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        tasks: [
          {
            title: 'Test task with sensitive data flags',
            flags: ['sensitive_data_detected'],
          },
        ],
      }),
    });
  };

  // Try multiple route patterns
  const patterns = [
    '**/api/ai/extract-tasks',
    '**/api/ai/extract-tasks/**',
    'http://localhost:*/api/ai/extract-tasks',
    'http://*/api/ai/extract-tasks',
    '**/extract-tasks',
    '/api/ai/extract-tasks',
  ];

  for (const pattern of patterns) {
    await page.route(pattern, mockHandler);
    console.log(`🔧 Route pattern added: ${pattern}`);
  }

  // Navigate to dashboard
  await page.goto('/dashboard');
  await page.waitForTimeout(1000);

  // Fill textarea and click button
  const textarea = page.locator('textarea[placeholder*="AI Assistant"]');
  if (await textarea.isVisible()) {
    const sensitiveText = 'Process payroll data for employee ID 12345 with salary $85000';
    await textarea.fill(sensitiveText);
    await page.waitForTimeout(500);

    const extractButton = page.locator('button:has-text("📋 Extract Tasks")');
    if (await extractButton.isVisible()) {
      console.log('🖱️ Clicking extract button...');
      await extractButton.click();

      // Wait for API calls
      await page.waitForTimeout(3000);

      console.log('\n📊 SUMMARY:');
      console.log(`Total requests: ${requests.length}`);
      console.log(`Total responses: ${responses.length}`);
      console.log(`Intercepted URLs: ${interceptedUrls.length}`);

      console.log('\n📡 API Requests made:');
      requests
        .filter(url => url.includes('/api/'))
        .forEach(url => {
          console.log(`  - ${url}`);
        });

      console.log('\n📥 API Responses received:');
      responses
        .filter(r => r.url.includes('/api/'))
        .forEach(r => {
          console.log(`  - ${r.status} ${r.url}`);
        });

      console.log('\n🎯 Intercepted URLs:');
      interceptedUrls.forEach(url => {
        console.log(`  - ${url}`);
      });

      if (interceptedUrls.length === 0) {
        console.log('\n❌ NO URLS WERE INTERCEPTED - Route patterns may not match actual URLs');
      }
    }
  }
});
