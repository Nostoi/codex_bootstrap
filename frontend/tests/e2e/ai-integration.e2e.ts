import { test, expect } from '@playwright/test';
import { AIIntegrationPageObject, setupTestData, cleanupTestData } from '../fixtures/pageObjects';
import { mockAIExtractionTexts, testSelectors } from '../fixtures/taskData';

test.describe('AI Integration Features', () => {
  let aiPage: AIIntegrationPageObject;

  test.beforeEach(async ({ page }) => {
    aiPage = new AIIntegrationPageObject(page);
    await setupTestData(page);

    // Mock AI service endpoints
    await page.route('/api/ai/extract-tasks', async route => {
      const requestBody = await route.request().postDataJSON();
      const inputText = requestBody.text;

      // Find matching mock response
      const mockResponse = mockAIExtractionTexts.find(mock =>
        inputText.includes(mock.input.split(' ').slice(0, 3).join(' '))
      );

      if (mockResponse) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            tasks: mockResponse.expectedTasks,
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            tasks: [],
          }),
        });
      }
    });

    await page.route('/api/ai/classify-task', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          classification: {
            energyLevel: 'medium',
            focusType: 'analytical',
            complexity: 5,
            estimatedDuration: 60,
          },
        }),
      });
    });

    await page.route('/api/ai/suggest-improvements', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          suggestions: [
            'Break down this task into smaller subtasks',
            'Consider scheduling this during high-energy periods',
            'Add more specific details to improve clarity',
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
    const inputText = mockAIExtractionTexts[0].input;
    await aiPage.extractTasksFromText(inputText);

    // Verify correct number of tasks extracted
    await aiPage.verifyTaskExtraction(2);

    // Verify task details
    const suggestions = await aiPage.getSuggestedTasks();
    await expect(suggestions.getByText('Finish project documentation')).toBeVisible();
    await expect(suggestions.getByText('Schedule team meeting for quarterly review')).toBeVisible();

    // Verify priority classifications
    await expect(suggestions.first().locator('[data-testid="suggested-priority"]')).toContainText(
      'medium'
    );
    await expect(suggestions.nth(1).locator('[data-testid="suggested-priority"]')).toContainText(
      'low'
    );
  });

  test('handles complex technical task extraction', async ({ page }) => {
    await aiPage.goto();

    // Input complex technical text
    const technicalText = mockAIExtractionTexts[1].input;
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
    await page.getByRole('button', { name: /new task/i }).click();
    await page.getByLabel(/task title/i).fill('Analyze user feedback data');
    await page.getByLabel(/description/i).fill('Review customer surveys and identify trends');

    // Click AI classify button
    await page.getByRole('button', { name: /ai classify/i }).click();

    // Wait for AI response
    await expect(page.getByText('AI Classification Complete')).toBeVisible();

    // Verify suggested metadata
    await expect(page.getByLabel(/energy level/i)).toHaveValue('medium');
    await expect(page.getByLabel(/focus type/i)).toHaveValue('analytical');
    await expect(page.getByLabel(/complexity/i)).toHaveValue('5');
    await expect(page.getByLabel(/estimated duration/i)).toHaveValue('60');
  });

  test('accepts and rejects task suggestions', async ({ page }) => {
    await aiPage.goto();

    const inputText = mockAIExtractionTexts[0].input;
    await aiPage.extractTasksFromText(inputText);

    // Accept first suggestion
    await aiPage.acceptSuggestion(0);
    await expect(page.getByText('Task added successfully')).toBeVisible();

    // Verify task appears in task list
    await expect(
      page.locator('[data-testid="task-list"]').getByText('Finish project documentation')
    ).toBeVisible();

    // Reject second suggestion
    await aiPage.rejectSuggestion(1);
    await expect(page.getByText('Schedule team meeting for quarterly review')).not.toBeVisible();

    // Verify suggestion count decreased
    await aiPage.verifyTaskExtraction(0); // All suggestions processed
  });

  test('provides AI-powered task improvement suggestions', async ({ page }) => {
    await aiPage.goto();

    // Select an existing task
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
    // Mock slow AI response
    await page.route('/api/ai/extract-tasks', async route => {
      await new Promise(resolve => setTimeout(resolve, 16000)); // Longer than timeout
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, tasks: [] }),
      });
    });

    await aiPage.goto();
    await aiPage.extractTasksFromText('Test timeout scenario');

    // Verify timeout handling
    await expect(page.getByText('AI request timed out')).toBeVisible({ timeout: 20000 });
    await expect(page.getByText('Please try again or create tasks manually')).toBeVisible();

    // Verify fallback options
    await expect(page.getByRole('button', { name: /create manually/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /retry/i })).toBeVisible();
  });

  test('handles AI service errors gracefully', async ({ page }) => {
    // Mock AI service error
    await page.route('/api/ai/extract-tasks', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'AI service unavailable' }),
      });
    });

    await aiPage.goto();
    await aiPage.extractTasksFromText('Test error scenario');

    // Verify error handling
    await expect(page.getByText('AI service temporarily unavailable')).toBeVisible();
    await expect(page.getByText('You can still create tasks manually')).toBeVisible();

    // Verify manual creation fallback
    await page.getByRole('button', { name: /create manually/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByLabel(/task title/i)).toBeVisible();
  });

  test('respects AI usage limits and quotas', async ({ page }) => {
    // Mock quota exceeded response
    await page.route('/api/ai/extract-tasks', async route => {
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Rate limit exceeded',
          resetTime: '2025-01-15T18:00:00Z',
        }),
      });
    });

    await aiPage.goto();
    await aiPage.extractTasksFromText('Test quota limits');

    // Verify quota limit message
    await expect(page.getByText('AI usage limit reached')).toBeVisible();
    await expect(page.getByText('Resets at 6:00 PM today')).toBeVisible();

    // Verify alternative options
    await expect(page.getByRole('button', { name: /upgrade plan/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /continue manually/i })).toBeVisible();
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

    // AI responses should be under 5 seconds for good UX
    expect(responseTime).toBeLessThan(5000);

    // Verify loading indicators during processing
    await expect(page.getByText('Processing with AI...')).toHaveBeenVisible();
  });

  test('handles sensitive data appropriately', async ({ page }) => {
    await aiPage.goto();

    // Input text with potentially sensitive information
    const sensitiveText = 'Process payroll data for employee ID 12345 with salary $85000';

    await aiPage.extractTasksFromText(sensitiveText);

    // Verify sensitive data is masked or flagged
    await expect(page.getByText('Sensitive data detected')).toBeVisible();
    await expect(page.getByText('Employee information will be anonymized')).toBeVisible();

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
