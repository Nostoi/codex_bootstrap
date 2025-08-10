import { test, expect } from '@playwright/test';

test('DEBUG: Network calls during sensitive data test', async ({ page }) => {
  // 1. Network monitoring - capture ALL requests
  const requests: string[] = [];
  page.on('request', request => {
    const url = request.url();
    console.log(`📡 REQUEST: ${request.method()} ${url}`);
    requests.push(`${request.method()} ${url}`);
  });

  // 2. Response monitoring
  page.on('response', response => {
    console.log(`📥 RESPONSE: ${response.status()} ${response.url()}`);
  });

  // 3. Set up route interception with detailed logging
  await page.route('**/api/ai/extract-tasks', async route => {
    console.log('🔍 API INTERCEPTED:', route.request().url());
    console.log('🔍 Request method:', route.request().method());
    console.log('🔍 Request headers:', await route.request().allHeaders());

    const body = await route.request().postDataJSON();
    console.log('🔍 Request body:', body);

    // Return mock response for sensitive data
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        tasks: [
          {
            title: 'Process payroll data for employee [REDACTED]',
            description: 'Handle employee payroll information',
            estimatedDuration: 30,
            priority: 'high',
            energyLevel: 'medium',
            focusType: 'administrative',
            flags: ['sensitive_data_detected'],
          },
        ],
      }),
    });
  });

  // 4. Navigate to the AI page (using the same flow as other tests)
  await page.goto('/dashboard');

  // 5. Wait for page to be ready
  await page.waitForSelector('[data-testid="ai-integration-textarea"]');
  console.log('✅ Page ready, AI textarea found');

  // 6. Fill the textarea with sensitive data
  const sensitiveText = 'Process payroll data for employee ID 12345 with salary $85000';
  const textarea = page.locator('[data-testid="ai-integration-textarea"]');

  console.log(`📝 Filling textarea with: ${sensitiveText}`);
  await textarea.clear();
  await textarea.fill(sensitiveText);

  // Verify text was filled
  const textValue = await textarea.inputValue();
  console.log(`✅ Text filled, value: ${textValue}`);

  // 7. Find and click the extract button
  const extractButton = page.locator('[data-testid="ai-extract-tasks-button"]');
  console.log('🔍 Looking for extract button...');

  const isVisible = await extractButton.isVisible();
  console.log(`👁️ Extract button visible: ${isVisible}`);

  if (!isVisible) {
    console.log('❌ Extract button not visible, taking screenshot');
    await page.screenshot({ path: 'debug-no-extract-button.png' });

    // Try to find ANY buttons on the page
    const allButtons = await page.locator('button').all();
    console.log(`🔍 Found ${allButtons.length} buttons on page:`);
    for (let i = 0; i < allButtons.length; i++) {
      const buttonText = await allButtons[i].textContent();
      console.log(`  Button ${i}: "${buttonText}"`);
    }

    throw new Error('Extract button not found');
  }

  // 8. Click the extract button
  console.log('🖱️ Clicking extract button...');
  await extractButton.click();

  // 9. Wait and see what happens
  console.log('⏳ Waiting for API call and response...');
  await page.waitForTimeout(5000);

  // 10. Check if any API requests were made
  console.log('📊 SUMMARY:');
  console.log(`Total requests made: ${requests.length}`);
  requests.forEach(req => console.log(`  - ${req}`));

  const apiRequests = requests.filter(req => req.includes('/api/ai/extract-tasks'));
  console.log(`API requests to extract-tasks: ${apiRequests.length}`);

  if (apiRequests.length === 0) {
    console.log('❌ NO API REQUESTS MADE TO /api/ai/extract-tasks');

    // Take a screenshot to see the current state
    await page.screenshot({ path: 'debug-no-api-call.png' });

    // Check if there are any error messages visible
    const errorMessages = await page.locator('.text-red-500, .text-error, [role="alert"]').all();
    console.log(`Found ${errorMessages.length} potential error messages:`);
    for (const error of errorMessages) {
      const text = await error.textContent();
      console.log(`  Error: "${text}"`);
    }
  } else {
    console.log('✅ API request was made!');
  }
});
