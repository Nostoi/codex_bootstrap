import { test, expect } from '@playwright/test';

test('debug sensitive data mock', async ({ page }) => {
  // Listen to console events for debugging
  page.on('console', msg => {
    console.log(`Browser [${msg.type()}]:`, msg.text());
  });

  // Simple mock for sensitive data
  await page.route('**/api/ai/extract-tasks', async route => {
    const requestBody = await route.request().postDataJSON();
    console.log('🔍 API INTERCEPTED:', requestBody);

    const text = requestBody.text || '';
    const isSensitive =
      text.includes('payroll') || text.includes('employee ID') || text.includes('salary');
    console.log('🔍 Text:', text);
    console.log('🔍 Is sensitive:', isSensitive);

    if (isSensitive) {
      console.log('✅ Returning sensitive data response');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: `test-sensitive-${Date.now()}`,
              name: 'Process payroll data for employee [REDACTED]',
              description: 'Employee information will be anonymized',
              priority: 6,
              estimatedHours: 1,
              dependencies: [],
              tags: ['sensitive', 'hr'],
              energyLevel: 'medium',
              focusType: 'administrative',
              complexity: 5,
              flags: ['sensitive_data_detected'],
            },
          ],
          usage: { promptTokens: 75, completionTokens: 40, totalTokens: 115 },
          model: 'gpt-4o-mini',
          processingTimeMs: 800,
        }),
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: `test-normal-${Date.now()}`,
              name: 'Normal task',
              description: '',
              priority: 3,
              estimatedHours: 1,
              dependencies: [],
              tags: [],
              energyLevel: 'medium',
              focusType: 'administrative',
              complexity: 3,
              flags: [],
            },
          ],
          usage: { promptTokens: 50, completionTokens: 25, totalTokens: 75 },
          model: 'gpt-4o-mini',
          processingTimeMs: 500,
        }),
      });
    }
  });

  // Navigate to dashboard
  await page.goto('http://localhost:3500/dashboard');
  await page.waitForTimeout(2000);

  // Fill in sensitive data text
  const textarea = page.locator('textarea[placeholder*="AI Assistant"]');
  await textarea.fill('Process payroll data for employee ID 12345 with salary $85000');

  // Find and click extract button
  const extractButton = page
    .locator('button')
    .filter({ hasText: /extract/i })
    .first();
  await extractButton.click();

  // Wait for processing
  await page.waitForTimeout(3000);

  // Check if sensitive data warning appears
  await expect(page.getByText('Sensitive data detected')).toBeVisible({ timeout: 5000 });
});
