import { test, expect } from '@playwright/test';
import { AIIntegrationPageObject, setupTestData, cleanupTestData } from '../fixtures/pageObjects';
import { mockAIExtractionTexts, testSelectors } from '../fixtures/taskData';
import {
  mockAIResponses,
  errorScenarios,
  mockClassificationResponses,
} from '../fixtures/mockResponses';

test('DEBUG: Check extract button with full test setup', async ({ page }) => {
  // Listen to console events for debugging
  page.on('console', msg => {
    console.log(`Browser [${msg.type()}]:`, msg.text());
  });

  // Disable service worker aggressively to prevent interference with route interception
  await page.addInitScript(() => {
    // @ts-ignore
    if ('serviceWorker' in navigator) {
      // @ts-ignore
      Object.defineProperty(navigator, 'serviceWorker', {
        value: undefined,
        writable: false,
      });
    }
  });

  // Set up route interception BEFORE navigation
  // Mock AI service endpoints with WebKit-compatible patterns
  // Use both wildcard and specific URL patterns for better browser compatibility
  const mockHandler = async (route: any) => {
    const requestBody = await route.request().postDataJSON();
    const inputText = requestBody.text;

    console.log('🔍 Mock API called with:', { requestBody, inputText });

    // Check sensitive data patterns
    console.log('[MOCK DEBUG] Checking sensitive data pattern for text:', inputText);
    const sensitiveDataPatterns = [
      /\bpayroll\b/i,
      /\bemployee\s+id\b/i,
      /\bsalary\b/i,
      /\bssn\b/i,
      /\bsocial.security\b/i,
    ];

    const hasSensitiveData = sensitiveDataPatterns.some(pattern => pattern.test(inputText));
    console.log('[MOCK DEBUG] Sensitive data match:', hasSensitiveData);

    if (hasSensitiveData) {
      console.log('[MOCK DEBUG] Returning sensitive data response with flags');
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
      return;
    }

    // Default response for normal text
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        tasks: [
          {
            title: 'Regular task from text',
            description: 'Normal processing',
            estimatedDuration: 30,
            priority: 'medium',
            energyLevel: 'medium',
            focusType: 'technical',
          },
        ],
      }),
    });
  };

  // Set up multiple route patterns for broader compatibility
  await page.route('**/api/ai/extract-tasks', mockHandler);
  await page.route('**/api/ai/extract-tasks/**', mockHandler);
  await page.route('http://localhost:3501/api/ai/extract-tasks', mockHandler);
  await page.route('http://localhost:3501/api/ai/extract-tasks/**', mockHandler);

  // Mock other API endpoints to prevent 500 errors
  await page.route('**/api/tasks', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  await page.route('**/api/plans/**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [] }),
    });
  });

  // Create AI page object and navigate
  const aiPage = new AIIntegrationPageObject(page);
  await aiPage.goto();

  // Now check what buttons exist
  console.log('🔍 Checking buttons after full setup...');

  // Check if AI textarea exists now
  const textarea = page.locator('[data-testid="ai-integration-textarea"]');
  const textareaExists = await textarea.isVisible();
  console.log(`🔍 AI textarea exists: ${textareaExists}`);

  if (textareaExists) {
    // Fill with sensitive data
    const sensitiveText = 'Process payroll data for employee ID 12345 with salary $85000';
    await textarea.fill(sensitiveText);
    await page.waitForTimeout(500);

    // Check extract buttons
    const allExtractButtons = page.locator('button:has-text("📋 Extract Tasks")');
    const count = await allExtractButtons.count();
    console.log(`🔍 Found ${count} buttons with "📋 Extract Tasks" text`);

    if (count > 0) {
      console.log('🖱️ Clicking the extract button...');
      await allExtractButtons.first().click();

      // Wait for any API calls or component updates
      await page.waitForTimeout(3000);

      console.log('✅ Button clicked, waiting for results...');
    }
  }

  console.log('✅ Debug complete');
});
