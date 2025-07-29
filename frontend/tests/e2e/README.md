# E2E Test Suite for Helmsman Features

This directory contains comprehensive end-to-end tests for all Helmsman AI-Augmented Task Management features.

## Test Structure

### Core Test Files

- `task-metadata.spec.ts` - Task creation, display, and metadata management
- `daily-planning.e2e.ts` - Daily planning features and energy matching
- `ai-integration.e2e.ts` - AI task extraction and classification
- `accessibility.e2e.ts` - WCAG compliance and ADHD-friendly features
- `dependency-management.e2e.ts` - Task dependencies and blocking workflows
- `performance.e2e.ts` - Performance benchmarks and optimization

### Support Files

- `fixtures/taskData.ts` - Mock data and test scenarios
- `fixtures/pageObjects.ts` - Page object models and test helpers

## Test Coverage

### Task Metadata Features ✅
- Task creation with all metadata fields (energy, focus, complexity, etc.)
- Metadata editing and validation
- Energy level color coding and visual indicators
- Priority sorting and filtering
- Deadline tracking and overdue warnings
- Bulk metadata operations

### Daily Planning Features ✅
- Energy pattern-based scheduling
- Manual drag-and-drop task scheduling
- Time slot conflict detection and resolution
- Break scheduling and work-life balance
- Calendar integration with external events
- Focus time and deep work blocks

### AI Integration Features ✅
- Natural language task extraction
- Automatic task classification and metadata suggestion
- AI-powered improvement recommendations
- Batch processing for multiple tasks
- Error handling for AI service failures
- Privacy and security safeguards

### Accessibility Features ✅
- WCAG 2.1 AA compliance testing
- Keyboard navigation and focus management
- Screen reader compatibility
- Color contrast validation
- ADHD-specific accommodations
- Reduced motion and high contrast support

### Dependency Management Features ✅
- Visual dependency chain display
- Automatic task blocking/unblocking
- Circular dependency prevention
- Dependency impact analysis
- Critical path analysis
- Bulk dependency operations

### Performance Testing ✅
- Page load time benchmarks
- Large dataset handling
- Memory usage monitoring
- Network request optimization
- Error recovery testing

## Running the Tests

### Prerequisites
```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### Run All E2E Tests
```bash
pnpm test:e2e:all
```

### Run Specific Test Suite
```bash
pnpm test:e2e task-metadata.spec.ts
pnpm test:e2e daily-planning.e2e.ts
pnpm test:e2e ai-integration.e2e.ts
pnpm test:e2e accessibility.e2e.ts
pnpm test:e2e dependency-management.e2e.ts
pnpm test:e2e performance.e2e.ts
```

### Run with UI Mode
```bash
pnpm test:e2e:ui
```

### Run in Headed Mode (See Browser)
```bash
pnpm test:e2e:headed
```

## Test Data and Mocking

### Mock Data Setup
- `mockTasks`: Standard task dataset with various metadata
- `mockTasksWithDependencies`: Tasks with dependency relationships
- `mockLargeDashboardTasks`: Large dataset for performance testing
- `mockAIExtractionTexts`: Sample texts for AI extraction testing
- `mockDailyPlans`: Daily planning scenarios

### API Mocking
Tests use Playwright route interception to mock API responses, ensuring:
- Consistent test data across runs
- Fast test execution without real API calls
- Error scenario testing
- Performance benchmarking with controlled data

## Performance Targets

- Dashboard load time: < 3 seconds
- Task filtering response: < 500ms
- AI extraction response: < 5 seconds
- 200+ task rendering: < 5 seconds
- Memory growth: < 50MB per operation

## Accessibility Standards

- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatibility
- Color contrast ratio 4.5:1 minimum
- Focus management in modals
- ADHD-friendly design patterns

## Error Scenarios Tested

- Network failures and timeouts
- Malformed API responses
- AI service unavailability
- Large dataset performance
- Invalid user input handling
- Dependency conflict resolution

## Browser Support

Tests run on:
- Chromium (Desktop)
- Firefox (Desktop)
- WebKit/Safari (Desktop)
- Mobile Chrome (Pixel 5)

## Continuous Integration

The E2E test suite is designed to run in CI environments with:
- Headless browser execution
- Screenshot and video capture on failures
- Performance regression detection
- Accessibility compliance verification

## Troubleshooting

### Common Issues

1. **Development server not running**
   ```bash
   pnpm dev
   ```

2. **Port conflicts**
   - Tests expect dev server on port 3000
   - Update playwright.config.ts if using different port

3. **Slow tests**
   - Check network mock setup
   - Verify waitForLoadState usage
   - Consider test parallelization

4. **Flaky tests**
   - Review wait conditions
   - Check for race conditions
   - Verify proper cleanup in afterEach

### Debug Mode
```bash
# Run with browser visible
pnpm test:e2e:headed

# Run with Playwright inspector
PWDEBUG=1 pnpm test:e2e

# Generate trace files
pnpm test:e2e --trace on
```

## Contributing

When adding new E2E tests:

1. Follow the page object pattern
2. Use consistent test data from fixtures
3. Include accessibility checks
4. Add performance assertions
5. Test error scenarios
6. Update this documentation

## Test Results

All E2E tests validate the comprehensive functionality of the Helmsman system, ensuring:
- Feature completeness and correctness
- Performance within acceptable bounds
- Accessibility compliance for all users
- Robust error handling and recovery
- Seamless user experience across all supported browsers
