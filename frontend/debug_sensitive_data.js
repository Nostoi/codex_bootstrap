// Quick debug script to test sensitive data pattern matching
const { chromium } = require('playwright');

async function debugSensitiveData() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Listen to console events
  page.on('console', msg => {
    console.log(`Browser [${msg.type()}]:`, msg.text());
  });

  // Set up route interception with detailed logging
  await page.route('**/api/ai/extract-tasks', async route => {
    const requestBody = await route.request().postDataJSON();
    console.log('🔍 API INTERCEPTED:', { requestBody });

    const text = requestBody.text || '';
    const isSensitive =
      text.includes('payroll') || text.includes('employee ID') || text.includes('salary');
    console.log('🔍 Sensitive data check:', { text, isSensitive });

    if (isSensitive) {
      console.log('✅ Returning sensitive data response');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: `extracted-${Date.now()}-${Math.random()}`,
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
          warnings: ['Sensitive data detected: Employee information will be anonymized'],
        }),
      });
    } else {
      console.log('✅ Returning normal response');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: `extracted-${Date.now()}-${Math.random()}`,
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

  // Navigate to the app
  await page.goto('http://localhost:3500/dashboard');
  await page.waitForTimeout(2000);

  // Fill in sensitive data
  const textarea = page.locator('[data-testid="text-input"]');
  await textarea.fill('Process payroll data for employee ID 12345 with salary $85000');

  // Click extract button
  const extractButton = page.locator('[data-testid="extract-button"]');
  await extractButton.click();

  // Wait and check what appears
  await page.waitForTimeout(5000);

  // Check if tasks appeared
  const tasks = await page.locator('[data-testid="suggested-task"]').count();
  console.log('Number of tasks found:', tasks);

  // Check if sensitive data warning appears
  const warning = await page.locator('text=Sensitive data detected').isVisible();
  console.log('Sensitive data warning visible:', warning);

  // Get page content for debugging
  const content = await page.locator('.bg-base-50').textContent();
  console.log('Page content:', content);

  await browser.close();
}

debugSensitiveData().catch(console.error);
