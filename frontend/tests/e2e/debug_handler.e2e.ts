import { test, expect } from '@playwright/test';

test('DEBUG: Verify button click calls handler', async ({ page }) => {
  // Add console monitoring to see React component logs
  page.on('console', msg => {
    const text = msg.text();
    if (
      text.includes('Extracting tasks from text') ||
      text.includes('handleTaskExtraction') ||
      text.includes('🔍') ||
      text.includes('[MOCK DEBUG]')
    ) {
      console.log(`🎯 COMPONENT LOG [${msg.type()}]:`, text);
    }
  });

  // Navigate to dashboard
  await page.goto('/dashboard');

  // Wait for AI textarea
  await page.waitForSelector('[data-testid="ai-integration-textarea"]', { timeout: 10000 });

  // Fill with sensitive data
  const sensitiveText = 'Process payroll data for employee ID 12345 with salary $85000';
  const textarea = page.locator('[data-testid="ai-integration-textarea"]');
  await textarea.fill(sensitiveText);

  // Wait a moment for React to update
  await page.waitForTimeout(500);

  // Check if extract button is visible
  const extractButton = page.locator('button:has-text("📋 Extract Tasks")');
  const isVisible = await extractButton.isVisible();
  console.log(`👁️ Extract button visible: ${isVisible}`);

  if (!isVisible) {
    // Debug: check what buttons exist
    const buttons = await page.locator('button').all();
    console.log(`Found ${buttons.length} buttons:`);
    for (let i = 0; i < buttons.length; i++) {
      const text = await buttons[i].textContent();
      const classes = await buttons[i].getAttribute('class');
      console.log(`  Button ${i}: "${text}" classes: ${classes}`);
    }
    throw new Error('Extract button not found');
  }

  // Add event listener to monitor clicks
  await page.evaluate(() => {
    document.addEventListener('click', e => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'BUTTON') {
        console.log('🖱️ CLICK EVENT:', target.textContent, target.className);
      }
    });
  });

  console.log('🖱️ About to click extract button...');
  await extractButton.click();
  console.log('🖱️ Extract button clicked!');

  // Wait for potential async operations
  await page.waitForTimeout(3000);

  console.log('✅ Test complete');
});
