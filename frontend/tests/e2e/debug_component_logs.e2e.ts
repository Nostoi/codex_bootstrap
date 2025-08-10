import { test, expect } from '@playwright/test';

test('DEBUG: Add component logging', async ({ page }) => {
  // Listen to console events for debugging
  page.on('console', msg => {
    console.log(`Browser [${msg.type()}]:`, msg.text());
  });

  // Add script to override the handleTaskExtraction function with logging
  await page.addInitScript(() => {
    // Override console.log to add prefix
    const originalLog = console.log;
    console.log = (...args) => {
      originalLog('🎯 COMPONENT:', ...args);
    };

    // Add event listener to capture all button clicks
    document.addEventListener(
      'click',
      e => {
        const target = e.target as HTMLElement;
        if (target.tagName === 'BUTTON') {
          originalLog('🖱️ BUTTON CLICKED:', {
            text: target.textContent,
            className: target.className,
            onclick: typeof (target as any).onclick,
            hasEventListeners:
              !!(target as any)._reactInternalFiber || !!(target as any)._reactInternalInstance,
          });
        }
      },
      true
    );
  });

  // Navigate to dashboard
  await page.goto('/dashboard');

  // Wait for page load
  await page.waitForTimeout(2000);

  // Fill sensitive data
  const sensitiveText = 'Process payroll data for employee ID 12345 with salary $85000';

  // Try multiple selectors to find the textarea
  const textareaSelectors = [
    '[data-testid="ai-integration-textarea"]',
    'textarea[placeholder*="AI Assistant"]',
    'textarea[placeholder*="Ask AI Assistant"]',
    'textarea',
  ];

  let textarea = null;
  for (const selector of textareaSelectors) {
    try {
      textarea = page.locator(selector).first();
      const isVisible = await textarea.isVisible({ timeout: 1000 });
      if (isVisible) {
        console.log(`✅ Found textarea with selector: ${selector}`);
        break;
      }
    } catch (e) {
      console.log(`❌ Selector ${selector} not found`);
    }
  }

  if (textarea) {
    await textarea.fill(sensitiveText);
    console.log('✅ Filled textarea with sensitive data');

    // Wait a moment for React to update
    await page.waitForTimeout(500);

    // Now look for extract button
    const extractButton = page.locator('button:has-text("📋 Extract Tasks")');
    const buttonExists = await extractButton.isVisible();
    console.log(`🔍 Extract button visible: ${buttonExists}`);

    if (buttonExists) {
      console.log('🖱️ About to click extract button...');
      await extractButton.click();
      console.log('🖱️ Extract button clicked!');

      // Wait for any async operations
      await page.waitForTimeout(3000);
    }
  } else {
    console.log('❌ No textarea found with any selector');

    // List all textareas on the page
    const allTextareas = await page.locator('textarea').all();
    console.log(`Found ${allTextareas.length} textareas on page`);
    for (let i = 0; i < allTextareas.length; i++) {
      const placeholder = await allTextareas[i].getAttribute('placeholder');
      const classes = await allTextareas[i].getAttribute('class');
      console.log(`  Textarea ${i}: placeholder="${placeholder}" class="${classes}"`);
    }
  }

  console.log('✅ Debug complete');
});
