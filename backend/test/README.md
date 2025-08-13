# Test Data Factory & Mock Strategy - Complete Implementation Guide

## Overview

This document provides comprehensive documentation for the test data factory system implemented to support E2E testing of the Helmsman ADHD-optimized task management application.

## Architecture Components

### 1. Factory System (`/test/factories/`)

#### Base Factory (`base.factory.ts`)

- **Purpose**: Foundation class for all test data factories with ADHD-specific generators
- **Key Features**:
  - Energy level distribution (35% LOW, 40% MEDIUM, 25% HIGH)
  - Focus type generation (CREATIVE, TECHNICAL, ADMINISTRATIVE, SOCIAL)
  - Complexity scoring with bell curve distribution
  - Realistic deadline generation based on priority
  - Test ID generation and entity tracking
- **Usage**: Extended by all concrete factory classes

#### Task Factory (`task.factory.ts`)

- **Purpose**: Generate ADHD-optimized test tasks with realistic patterns
- **Key Methods**:
  - `build()` - Create task objects with ADHD-specific defaults
  - `create()` - Persist tasks to database with tracking
  - `createAdhdScenarios()` - Generate specialized ADHD test scenarios
  - `createProjectTasks()` - Create tasks associated with projects
  - `createWithDependencies()` - Create tasks with dependency chains
- **ADHD Features**:
  - Energy-aware task generation
  - Focus type specialization
  - AI suggestion patterns
  - Realistic time estimation based on complexity

#### User Factory (`user.factory.ts`)

- **Purpose**: Generate ADHD-focused test users with realistic preferences
- **Key Methods**:
  - `createAdhdPersona()` - Generate users with specific ADHD profiles
  - `createAdhdTestCohort()` - Create diverse user group for testing
  - `createGoogleUser()` / `createMicrosoftUser()` - OAuth-specific users
- **ADHD Personas**:
  - **HIGH_ACHIEVER**: Premium user with advanced features enabled
  - **OVERWHELMED**: Free tier user with gentle settings
  - **CREATIVE**: Focus on creative work with longer sessions
  - **TECHNICAL**: Deep work preference with minimal interruptions

#### Project Factory (`project.factory.ts`)

- **Purpose**: Generate test projects with realistic collaboration patterns
- **Key Methods**:
  - `createAdhdProjectScenarios()` - Generate ADHD-focused project types
  - `createWithTasks()` - Create projects with associated tasks
  - `createTeamProject()` - Multi-user collaborative projects
- **Project Types**:
  - Personal organization projects
  - High-priority work sprints
  - Learning and skill development
  - Creative content projects
  - System maintenance projects

### 2. Mock Services (`/test/mocks/`)

#### OpenAI Mock (`openai.mock.ts`)

- **Purpose**: Simulate AI-powered task management features
- **Key Features**:
  - Task extraction from natural language
  - ADHD-optimized task classification
  - Energy/focus pattern matching
  - Daily planning optimization
  - Deterministic responses with caching
- **AI Suggestions**:
  - Energy optimization recommendations
  - Focus batching strategies
  - Deadline management alerts
  - Productivity tips based on ADHD patterns

#### Microsoft Graph Mock (`microsoft-graph.mock.ts`)

- **Purpose**: Simulate Outlook calendar and email integration
- **Key Features**:
  - Realistic calendar event generation
  - Email analysis for task extraction
  - Free/busy scheduling information
  - Calendar sync status and conflict management
  - Business-focused meeting patterns

#### Google Services Mock (`google.mock.ts`)

- **Purpose**: Simulate Google Calendar and Gmail integration
- **Key Features**:
  - Multi-calendar support
  - Gmail thread analysis
  - Calendar list management
  - Free/busy scheduling
  - Comprehensive event attendee management

### 3. Database Utilities (`/test/utils/`)

#### Database Utils (`database.utils.ts`)

- **Purpose**: Centralized database management for tests
- **Key Features**:
  - Test data setup and cleanup
  - Transaction management for isolation
  - Data integrity validation
  - Comprehensive test scenario creation
  - Factory and mock coordination

#### Setup Utils (`setup.utils.ts`)

- **Purpose**: Global test environment configuration
- **Key Features**:
  - Jest integration helpers
  - Test suite configuration
  - Environment health monitoring
  - ADHD-specific test assertions
  - Standardized setup/teardown patterns

## Usage Patterns

### Basic Test Setup

```typescript
import { setupTestSuite, AdhdTestAssertions } from '../utils/setup.utils';

describe('Task Management', () => {
  const getTestEnv = setupTestSuite({
    scenario: 'comprehensive',
    isolateDatabase: true,
  });

  test('should create ADHD-optimized tasks', async () => {
    const { factories } = getTestEnv();

    const tasks = await factories.task.createAdhdScenarios();

    // Validate ADHD patterns
    AdhdTestAssertions.assertEnergyDistribution(tasks.highEnergyTasks);
    AdhdTestAssertions.assertFocusTypeDistribution(tasks.creativeTasks);
  });
});
```

### AI Service Testing

```typescript
describe('AI Integration', () => {
  const getTestEnv = setupTestSuite({
    scenario: 'ai-testing',
    mockConfig: {
      openai: {
        responses: {
          'extract:Implement authentication': [
            {
              title: 'Set up OAuth2 providers',
              energyLevel: 'HIGH',
              focusType: 'TECHNICAL',
              confidence: 0.92,
            },
          ],
        },
      },
    },
  });

  test('should extract tasks with ADHD optimization', async () => {
    const { mocks } = getTestEnv();

    const extracted = await mocks.openai.extractTasks(
      'Implement authentication system with OAuth2'
    );

    expect(extracted).toHaveLength(1);
    expect(extracted[0].energyLevel).toBe('HIGH');
    expect(extracted[0].focusType).toBe('TECHNICAL');
  });
});
```

### Calendar Integration Testing

```typescript
describe('Calendar Sync', () => {
  const getTestEnv = setupTestSuite({
    scenario: 'calendar-integration',
  });

  test('should sync events from multiple providers', async () => {
    const { mocks, scenario } = getTestEnv();

    expect(scenario.googleEvents).toHaveLength(3);
    expect(scenario.microsoftEvents).toHaveLength(3);
    expect(scenario.calendarEvents).toHaveLength(6);

    // Validate sync status
    expect(scenario.syncStatus.google.status).toBe('SUCCESS');
    expect(scenario.syncStatus.microsoft.status).toBe('SUCCESS');
  });
});
```

## ADHD Optimization Features

### Energy Level Management

- **Distribution**: 35% LOW, 40% MEDIUM, 25% HIGH (realistic for ADHD users)
- **Scheduling**: Energy-aware task placement based on time of day
- **Batching**: Group similar energy level tasks for optimal flow

### Focus Type Categorization

- **CREATIVE**: Writing, design, brainstorming (flexible timing)
- **TECHNICAL**: Coding, debugging, analysis (deep work blocks)
- **ADMINISTRATIVE**: Email, reports, data entry (low energy periods)
- **SOCIAL**: Meetings, calls, collaboration (scheduled interactions)

### Task Complexity Patterns

- **Bell Curve Distribution**: Most tasks around complexity 5, fewer extreme values
- **Time Estimation**: Complexity-based duration calculation
- **Dependency Management**: Support for task prerequisites and blocking

### User Preference Modeling

- **Peak Energy Hours**: Morning, afternoon, evening, or night preferences
- **Break Patterns**: Pomodoro variations (15, 25, 30, 45, 60 minutes)
- **Notification Styles**: Gentle, standard, or urgent based on ADHD needs
- **UI Preferences**: Reduced motion, high contrast, large fonts

## Data Scenarios

### Comprehensive Scenario

- **Users**: 6 ADHD personas with diverse preferences
- **Projects**: 5 project types (personal, work, learning, creative, maintenance)
- **Tasks**: 50+ tasks across all energy levels and focus types
- **Calendar Events**: 20+ events from both Google and Microsoft
- **Purpose**: Full system integration testing

### AI Testing Scenario

- **Focus**: Task extraction, classification, and AI suggestions
- **Users**: Technical persona with AI-friendly preferences
- **Tasks**: High-complexity technical tasks for AI analysis
- **Mock Responses**: Predefined AI responses for deterministic testing

### Calendar Integration Scenario

- **Focus**: Multi-provider calendar synchronization
- **Users**: Users with both Google and Microsoft OAuth
- **Events**: Realistic meeting patterns with conflicts and overlaps
- **Sync Status**: Comprehensive sync monitoring and error handling

## Best Practices

### Test Isolation

- Use `isolateDatabase: true` for tests that modify shared data
- Reset mocks between tests with `resetMocks: true`
- Clean up factory-created data automatically

### Performance Considerations

- Use cached mock responses for consistent performance
- Batch database operations when creating multiple entities
- Validate data integrity periodically during long test runs

### ADHD-Specific Testing

- Always validate energy level distributions in task creation
- Test focus type variety and realistic patterns
- Verify AI suggestions are contextually appropriate
- Ensure accessibility features are properly modeled

### Error Scenarios

- Test API rate limiting with mock service methods
- Validate authentication failure handling
- Test data integrity with orphaned records
- Verify circular dependency detection

## Maintenance and Extension

### Adding New Factories

1. Extend `BaseFactory` class
2. Implement `build()` and `create()` methods
3. Add ADHD-specific generation patterns
4. Include cleanup functionality
5. Add to `TestFactories` aggregator

### Extending Mock Services

1. Add new methods to existing mock classes
2. Implement realistic data generation
3. Support caching for deterministic responses
4. Add error simulation methods
5. Update mock configuration interfaces

### Creating New Test Scenarios

1. Add scenario type to `TestScenarioType` union
2. Implement scenario creation in `TestDatabaseUtils`
3. Configure required mock responses
4. Document usage patterns and validation approaches

This comprehensive test data strategy enables thorough testing of ADHD-optimized features while maintaining realistic user patterns and data relationships. The factory system supports both unit and integration testing scenarios with proper isolation and cleanup mechanisms.
