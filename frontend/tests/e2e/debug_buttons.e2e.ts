import { test, expect } from '@playwright/test';

test('DEBUG: Check multiple extract buttons', async ({ page }) => {
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

  // Navigate to dashboard (same as working tests)
  await page.goto('/dashboard');

  // Wait for the page to load
  await page.waitForTimeout(1000);

  // Fill textarea to trigger button appearance
  const sensitiveText = 'Process payroll data for employee ID 12345 with salary $85000';

  // First, check if AI textarea exists
  const textarea = page.locator('[data-testid="ai-integration-textarea"]');
  const textareaExists = await textarea.isVisible();
  console.log(`🔍 AI textarea exists: ${textareaExists}`);

  if (textareaExists) {
    await textarea.fill(sensitiveText);
    await page.waitForTimeout(500); // Let React update
  }

  // Check ALL buttons with Extract Tasks text
  const allExtractButtons = page.locator('button:has-text("📋 Extract Tasks")');
  const count = await allExtractButtons.count();
  console.log(`🔍 Found ${count} buttons with "📋 Extract Tasks" text`);

  for (let i = 0; i < count; i++) {
    const button = allExtractButtons.nth(i);
    const isVisible = await button.isVisible();
    const isEnabled = await button.isEnabled();
    const text = await button.textContent();
    const classes = await button.getAttribute('class');
    const onClick = await button.evaluate(el => {
      // Check if button has onclick handler
      return {
        hasOnClick: typeof (el as any).onclick === 'function',
        hasEventListeners: (el as any)._events !== undefined,
      };
    });

    console.log(`Button ${i}:`);
    console.log(`  Text: "${text}"`);
    console.log(`  Visible: ${isVisible}`);
    console.log(`  Enabled: ${isEnabled}`);
    console.log(`  Classes: ${classes}`);
    console.log(`  Has onClick: ${onClick.hasOnClick}`);
    console.log(`  Has Event Listeners: ${onClick.hasEventListeners}`);
  }

  // Try to find the actual ChatGPT integration component
  const chatComponent = page.locator('[data-testid="ai-integration"]');
  const chatExists = await chatComponent.isVisible();
  console.log(`🔍 ChatGPT integration component exists: ${chatExists}`);

  // Look for any buttons inside the chat component specifically
  if (chatExists) {
    const chatButtons = chatComponent.locator('button');
    const chatButtonCount = await chatButtons.count();
    console.log(`🔍 Found ${chatButtonCount} buttons inside chat component`);

    for (let i = 0; i < chatButtonCount; i++) {
      const button = chatButtons.nth(i);
      const text = await button.textContent();
      const isVisible = await button.isVisible();
      console.log(`  Chat Button ${i}: "${text}" (visible: ${isVisible})`);
    }
  }

  // Also check what testid selector finds
  const testidButton = page.locator('[data-testid="ai-extract-tasks-button"]');
  const testidExists = await testidButton.isVisible();
  console.log(`🔍 data-testid="ai-extract-tasks-button" exists: ${testidExists}`);

  console.log('✅ Debug complete');
});
