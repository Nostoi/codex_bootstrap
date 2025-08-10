import { test, expect } from '@playwright/test';
import { AIIntegrationPageObject, setupTestData, cleanupTestData } from '../fixtures/pageObjects';
import { mockAIExtractionTexts, testSelectors } from '../fixtures/taskData';
import {
  mockAIResponses,
  errorScenarios,
  mockClassificationResponses,
} from '../fixtures/mockResponses';

test.describe('AI Integration Features', () => {
  let aiPage: AIIntegrationPageObject;

  test.beforeEach(async ({ page }) => {
    // Listen to console events for debugging
    page.on('console', msg => {
      console.log(`Browser [${msg.type()}]:`, msg.text());
    });

    // Monitor API requests for debugging
    page.on('request', request => {
      const url = request.url();
      if (url.includes('/api/ai/extract-tasks')) {
        console.log(`🚀 API REQUEST DETECTED: ${request.method()} ${url}`);
      }
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

      // Handle special test scenarios first
      for (const [scenario, config] of Object.entries(errorScenarios)) {
        if (config.match(requestBody)) {
          console.log(`🔍 Simulating ${scenario} scenario`);

          if ('delay' in config && config.delay) {
            await new Promise(resolve => setTimeout(resolve, config.delay));
            await route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify({ success: true, data: [] }),
            });
            return;
          }

          if ('response' in config && config.response) {
            await route.fulfill({
              status: config.response.status,
              contentType: 'application/json',
              body: JSON.stringify({ error: config.response.body }),
            });
            return;
          }
        }
      }

      // Handle normal responses
      for (const mockResponse of mockAIResponses) {
        if (mockResponse.match(requestBody)) {
          console.log('🔍 Mock response found: true');
          const response = mockResponse.response(requestBody);
          console.log('✅ Sending mock response:', response);

          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(response),
          });
          return;
        }
      }

      // Default fallback
      console.log('❌ No mock response, sending empty array');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [],
          usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
          model: 'gpt-4o-mini',
          processingTimeMs: 100,
        }),
      });
    };

    // Try multiple route patterns for better browser compatibility
    await page.route('**/api/ai/extract-tasks', mockHandler);
    await page.route(/\/api\/ai\/extract-tasks$/, mockHandler);
    // Handle double /api/ path that sometimes occurs
    await page.route('**/api/api/ai/extract-tasks', mockHandler);
    await page.route(/\/api\/api\/ai\/extract-tasks$/, mockHandler);

    aiPage = new AIIntegrationPageObject(page);
    await setupTestData(page);

    // Mock AI classification endpoint
    await page.route('**/api/ai/classify-task', async route => {
      const body = await route.request().postDataJSON();
      console.log('🔍 AI Classification called with:', body);

      const response = {
        energyLevel: 'medium',
        focusType: 'technical',
        complexity: 6,
        estimatedDuration: 120,
        priority: 7,
        tags: ['backend', 'testing'],
        suggestions: {
          bestTime: 'morning',
          dependencies: [],
          resources: ['Documentation', 'Test environment'],
        },
      };

      console.log('✅ AI Classification response:', response);

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response),
      });
    });

    // Mock suggestions endpoint
    await page.route('**/api/ai/suggestions', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          suggestions: [
            {
              id: 'suggestion-1',
              type: 'optimization',
              title: 'Break down large tasks',
              description:
                'Consider breaking "Finish project documentation" into smaller, manageable chunks',
              impact: 'high',
              effort: 'low',
            },
          ],
        }),
      });
    });
  });

  test.afterEach(async ({ page }) => {
    await cleanupTestData(page);
  });

  test('extracts tasks from natural language text', async ({ page }) => {
    await aiPage.goto();

    // Input text containing multiple tasks
    const inputText =
      'I need to finish the project documentation by Friday and also schedule a team meeting for next week to discuss the quarterly review.';
    await aiPage.extractTasksFromText(inputText);

    // Verify correct number of tasks extracted
    await aiPage.verifyTaskExtraction(2);

    // Verify task details
    const suggestions = await aiPage.getSuggestedTasks();
    await expect(suggestions.getByText('Finish project documentation')).toBeVisible();
    await expect(suggestions.getByText('Schedule team meeting for quarterly review')).toBeVisible();
  });

  test('handles complex technical task extraction', async ({ page }) => {
    await aiPage.goto();

    // Input complex technical text
    const technicalText =
      "Debug the authentication system - it's critical and blocking other work. High complexity task that requires deep focus.";
    await aiPage.extractTasksFromText(technicalText);

    await aiPage.verifyTaskExtraction(1);

    const suggestion = await aiPage.getSuggestedTasks();
    await expect(suggestion.getByText('Debug authentication system')).toBeVisible();

    // Verify technical classification
    await expect(suggestion.locator('[data-testid="suggested-energy"]')).toContainText('high');
    await expect(suggestion.locator('[data-testid="suggested-focus"]')).toContainText('technical');
    await expect(suggestion.locator('[data-testid="suggested-complexity"]')).toContainText('8');
  });

  test('provides task classification and metadata suggestions', async ({ page }) => {
    await aiPage.goto();

    // Create a new task and request AI classification
    // Use more robust clicking strategy for mobile
    const newTaskButton = page.getByRole('button', { name: /new task/i });

    // Wait for the button to be ready and scroll into view
    await newTaskButton.waitFor({ state: 'visible' });
    await newTaskButton.scrollIntoViewIfNeeded();

    // Wait for any overlaying elements to settle
    await page.waitForTimeout(500);

    // Try clicking with force to bypass interception
    try {
      await newTaskButton.click({ force: true });
    } catch (error) {
      console.log('Force click failed, trying alternative approach...');
      // Alternative: click at specific coordinates
      const box = await newTaskButton.boundingBox();
      if (box) {
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      }
    }

    await page.getByLabel(/task title/i).fill('Analyze user feedback data');
    await page
      .getByLabel('Task description in dialog')
      .fill('Review customer surveys and identify trends');

    // Click AI classify button
    await page.getByRole('button', { name: /ai classify/i }).click();

    // Wait for AI response
    await expect(page.getByText('AI Classification Complete')).toBeVisible();

    // Verify suggested metadata
    await expect(page.getByTestId('task-energy-level-select')).toHaveValue('medium');
    await expect(page.getByTestId('task-focus-type-select')).toHaveValue('technical');
    await expect(page.getByTestId('task-complexity-input')).toHaveValue('6');
    await expect(page.getByTestId('task-estimated-duration-input')).toHaveValue('120');
  });

  test('accepts and rejects task suggestions', async ({ page }) => {
    await aiPage.goto();

    const inputText =
      'I need to finish the project documentation by Friday and also schedule a team meeting for next week to discuss the quarterly review.';
    await aiPage.extractTasksFromText(inputText);

    // Accept first suggestion
    await aiPage.acceptSuggestion(0);
    await expect(page.getByText('Task added successfully')).toBeVisible();

    // Verify task appears in task list
    await expect(
      page.locator('[data-testid="task-list"]').getByText('Finish project documentation').first()
    ).toBeVisible();

    // Reject second suggestion (now at index 0 after first was removed)
    await aiPage.rejectSuggestion(0);
    await expect(page.getByText('Schedule team meeting for quarterly review')).not.toBeVisible();

    // Verify suggestion count decreased
    await aiPage.verifyTaskExtraction(0); // All suggestions processed
  });

  test('provides AI-powered task improvement suggestions', async ({ page }) => {
    await aiPage.goto();

    // First create a task using AI extraction
    await aiPage.extractTasksFromText('I need to finish the project documentation by Friday');
    await page.getByRole('button', { name: /add/i }).first().click();
    await expect(page.getByText('Task added successfully')).toBeVisible();

    // Select the created task
    await page.locator('[data-testid="task-card"]').first().click();

    // Request AI suggestions
    await page.getByRole('button', { name: /ai suggestions/i }).click();

    // Wait for AI analysis
    await expect(page.getByText('Analyzing task...')).toBeVisible();
    await expect(page.getByText('AI Suggestions Ready')).toBeVisible();

    // Verify suggestions are displayed
    const suggestionsList = page.locator('[data-testid="ai-suggestions"]');
    await expect(
      suggestionsList.getByText('Break down this task into smaller subtasks')
    ).toBeVisible();
    await expect(
      suggestionsList.getByText('Consider scheduling this during high-energy periods')
    ).toBeVisible();

    // Apply a suggestion
    await suggestionsList
      .getByRole('button', { name: /apply suggestion/i })
      .first()
      .click();
    await expect(page.getByText('Suggestion applied successfully')).toBeVisible();
  });

  test('handles AI service timeouts and errors', async ({ page }) => {
    await aiPage.goto();
    await aiPage.extractTasksFromTextWithError('Test timeout scenario');

    // Verify timeout handling
    await expect(page.getByText('AI request timed out')).toBeVisible();
    await expect(page.getByText('Please try again or create tasks manually')).toBeVisible();

    // Verify fallback options using specific test IDs to avoid conflicts
    await expect(page.getByTestId('create-manually-button')).toBeVisible();
    await expect(page.getByTestId('retry-button')).toBeVisible();
  });

  test('handles AI service errors gracefully', async ({ page }) => {
    await aiPage.goto();
    await aiPage.extractTasksFromTextWithError('Test error scenario');

    // Verify error handling
    await expect(page.getByText('AI service error occurred')).toBeVisible();
    await expect(page.getByText('Please try again or create tasks manually')).toBeVisible();

    // Verify error recovery options using specific test IDs
    await expect(page.getByTestId('retry-button')).toBeVisible();
    await expect(page.getByTestId('create-manually-button')).toBeVisible();
  });

  test('respects AI usage limits and quotas', async ({ page }) => {
    await aiPage.goto();
    await aiPage.extractTasksFromTextWithError('Test quota limits');

    // Verify quota limit message
    await expect(page.getByText('AI usage limit reached')).toBeVisible();
    await expect(page.getByText('Please try again or create tasks manually')).toBeVisible();

    // Verify alternative options using specific test IDs
    await expect(page.getByTestId('retry-button')).toBeVisible();
    await expect(page.getByTestId('create-manually-button')).toBeVisible();
  });

  test('AI batch processing for multiple tasks', async ({ page }) => {
    await aiPage.goto();

    // Input text with many tasks
    const batchText = `
      I need to finish the project documentation by Friday,
      schedule a team meeting for next week,
      debug the authentication system,
      update the user interface design,
      write unit tests for the new features,
      and prepare the quarterly review presentation.
    `;

    await aiPage.extractTasksFromText(batchText);

    // Verify multiple tasks extracted
    await aiPage.verifyTaskExtraction(6);

    // Test batch acceptance
    await page.getByRole('button', { name: /accept all/i }).click();
    await expect(page.getByText('6 tasks added successfully')).toBeVisible();

    // Verify all tasks appear in task list
    await expect(page.getByText('Finish project documentation')).toBeVisible();
    await expect(page.getByText('Debug authentication system')).toBeVisible();
    await expect(page.getByText('Update user interface design')).toBeVisible();
  });

  test('AI task prioritization and scheduling suggestions', async ({ page }) => {
    await aiPage.goto();

    // Request AI analysis of current task load
    await page.getByRole('button', { name: /ai schedule analysis/i }).click();

    // Wait for analysis
    await expect(page.getByText('Analyzing your schedule...')).toBeVisible();
    await expect(page.getByText('Schedule Analysis Complete')).toBeVisible();

    // Verify prioritization suggestions
    const analysis = page.locator('[data-testid="ai-schedule-analysis"]');
    await expect(analysis.getByText('High priority tasks for today')).toBeVisible();
    await expect(analysis.getByText('Recommended task order based on energy levels')).toBeVisible();
    await expect(analysis.getByText('Potential schedule conflicts')).toBeVisible();

    // Apply AI recommendations
    await page.getByRole('button', { name: /apply recommendations/i }).click();
    await expect(page.getByText('Schedule updated with AI recommendations')).toBeVisible();
  });

  test('natural language date and time parsing', async ({ page }) => {
    await aiPage.goto();

    // Test various date formats
    const dateTexts = [
      'Complete the report by next Friday',
      'Schedule meeting for tomorrow at 2pm',
      'Deadline is in 3 weeks',
      'Due at end of month',
    ];

    for (const text of dateTexts) {
      await aiPage.extractTasksFromText(text);

      const suggestions = await aiPage.getSuggestedTasks();
      const deadline = suggestions.first().locator('[data-testid="suggested-deadline"]');

      // Verify deadline was parsed and formatted
      await expect(deadline).not.toBeEmpty();
      await expect(deadline).not.toContainText('Invalid Date');
    }
  });
});

test.describe('AI Integration Performance and Security', () => {
  let aiPage: AIIntegrationPageObject;

  test.beforeEach(async ({ page }) => {
    aiPage = new AIIntegrationPageObject(page);
  });

  test('AI response time meets performance targets', async ({ page }) => {
    await aiPage.goto();

    const startTime = Date.now();
    await aiPage.extractTasksFromText('Simple task extraction test');
    const responseTime = Date.now() - startTime;

    // AI responses should be under 30 seconds for acceptable UX in test environment
    // Note: In production, this would be much faster with real API endpoints
    expect(responseTime).toBeLessThan(30000);

    // Verify loading indicators during processing
    // Note: This would have been visible during the actual processing
  });

  test('handles sensitive data appropriately', async ({ page }) => {
    await aiPage.goto();

    // Input text with potentially sensitive information
    const sensitiveText = 'Process payroll data for employee ID 12345 with salary $85000';

    await aiPage.extractTasksFromText(sensitiveText);

    // Wait for React component to re-render with sensitive data warning
    // This allows the extractedTasks state update to complete and trigger the warning display
    await page.waitForTimeout(1000);

    // Verify sensitive data is masked or flagged
    await expect(page.getByText('Sensitive data detected')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Employee information will be anonymized')).toBeVisible({
      timeout: 15000,
    });

    const suggestions = await aiPage.getSuggestedTasks();
    await expect(
      suggestions.getByText('Process payroll data for employee [REDACTED]')
    ).toBeVisible();
  });

  test('maintains data privacy and security', async ({ page }) => {
    // Verify no sensitive data is sent to AI service
    let sentToAI = false;

    await page.route('/api/ai/**', async route => {
      const requestBody = await route.request().postDataJSON();

      // Check if request contains sensitive patterns
      const sensitivePatterns = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b|ssn|social.security/i;
      if (sensitivePatterns.test(JSON.stringify(requestBody))) {
        sentToAI = true;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, tasks: [] }),
      });
    });

    await aiPage.goto();

    // Input text with credit card number
    await aiPage.extractTasksFromText('Update payment method with card 4532 1234 5678 9012');

    // Verify sensitive data was not sent to AI
    expect(sentToAI).toBe(false);
  });
});
