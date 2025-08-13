import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../src/prisma/prisma.service';
import { TestDatabaseUtils, TestFactories, TestMocks } from './database.utils';

/**
 * Global test setup utilities for comprehensive E2E testing
 * Provides standardized setup, teardown, and configuration for test suites
 */
export class GlobalTestSetup {
  private static instance: GlobalTestSetup;
  private testingModule: TestingModule | null = null;
  private databaseUtils: TestDatabaseUtils | null = null;

  static getInstance(): GlobalTestSetup {
    if (!GlobalTestSetup.instance) {
      GlobalTestSetup.instance = new GlobalTestSetup();
    }
    return GlobalTestSetup.instance;
  }

  /**
   * Initialize test environment with full application context
   */
  async setupTestEnvironment(): Promise<TestEnvironment> {
    // Configure test module with all required services
    this.testingModule = await Test.createTestingModule({
      imports: [
        // Import minimal required modules for testing
      ],
      providers: [
        PrismaService,
        // Add other required providers
      ],
    }).compile();

    const prisma = this.testingModule.get<PrismaService>(PrismaService);
    this.databaseUtils = TestDatabaseUtils.getInstance(prisma);

    // Setup test database
    await this.databaseUtils.setupTestDatabase();

    return {
      module: this.testingModule,
      prisma,
      databaseUtils: this.databaseUtils,
      factories: this.databaseUtils.getFactories(),
      mocks: this.databaseUtils.getMocks(),
    };
  }

  /**
   * Cleanup test environment
   */
  async teardownTestEnvironment(): Promise<void> {
    if (this.databaseUtils) {
      await this.databaseUtils.cleanDatabase();
    }

    if (this.testingModule) {
      await this.testingModule.close();
    }

    this.testingModule = null;
    this.databaseUtils = null;
  }

  /**
   * Setup for individual test suites
   */
  async setupTestSuite(suiteConfig: TestSuiteConfig = {}): Promise<TestSuiteEnvironment> {
    if (!this.databaseUtils) {
      throw new Error('Test environment not initialized. Call setupTestEnvironment() first.');
    }

    // Clean database for test isolation
    await this.databaseUtils.cleanDatabase();
    await this.databaseUtils.seedBaseData();

    // Create scenario-specific test data
    let scenario: any = null;
    if (suiteConfig.scenario) {
      scenario = await this.createTestScenario(suiteConfig.scenario);
    }

    // Configure mocks based on suite requirements
    if (suiteConfig.mockConfig) {
      this.configureMocks(suiteConfig.mockConfig);
    }

    return {
      databaseUtils: this.databaseUtils,
      factories: this.databaseUtils.getFactories(),
      mocks: this.databaseUtils.getMocks(),
      scenario,
      suiteConfig,
    };
  }

  /**
   * Cleanup for individual test suites
   */
  async teardownTestSuite(): Promise<void> {
    if (this.databaseUtils) {
      await this.databaseUtils.cleanDatabase();
      this.databaseUtils.resetMocks();
    }
  }

  /**
   * Setup for individual tests with optional isolation
   */
  async setupTest(testConfig: TestConfig = {}): Promise<TestEnvironment> {
    if (!this.databaseUtils) {
      throw new Error('Test environment not initialized.');
    }

    // Optional database isolation for specific tests
    if (testConfig.isolateDatabase) {
      await this.databaseUtils.cleanDatabase();
      await this.databaseUtils.seedBaseData();
    }

    // Reset mocks for test isolation
    if (testConfig.resetMocks !== false) {
      this.databaseUtils.resetMocks();
    }

    return {
      module: this.testingModule!,
      prisma: this.testingModule!.get<PrismaService>(PrismaService),
      databaseUtils: this.databaseUtils,
      factories: this.databaseUtils.getFactories(),
      mocks: this.databaseUtils.getMocks(),
    };
  }

  /**
   * Cleanup for individual tests
   */
  async teardownTest(testConfig: TestConfig = {}): Promise<void> {
    if (this.databaseUtils && testConfig.cleanupAfterTest !== false) {
      // Clean up only data created during test
      await this.databaseUtils.getFactories().cleanup();
    }
  }

  /**
   * Validate test environment health
   */
  async validateTestEnvironment(): Promise<EnvironmentHealthReport> {
    if (!this.databaseUtils) {
      return {
        isHealthy: false,
        issues: ['Test environment not initialized'],
        checkedAt: new Date(),
      };
    }

    const stats = await this.databaseUtils.getDatabaseStats();
    const integrity = await this.databaseUtils.validateDataIntegrity();

    return {
      isHealthy: integrity.isValid,
      issues: integrity.issues,
      stats,
      checkedAt: new Date(),
    };
  }

  // Private helper methods

  private async createTestScenario(scenarioType: TestScenarioType): Promise<any> {
    if (!this.databaseUtils) {
      throw new Error('Database utils not initialized');
    }

    switch (scenarioType) {
      case 'comprehensive':
        return this.databaseUtils.createComprehensiveTestScenario();

      case 'ai-testing':
        return this.databaseUtils.createAiTestScenario();

      case 'calendar-integration':
        return this.databaseUtils.createCalendarTestScenario();

      case 'minimal':
        // Just use base seeded data
        return null;

      default:
        throw new Error(`Unknown scenario type: ${scenarioType}`);
    }
  }

  private configureMocks(mockConfig: MockConfiguration): void {
    if (!this.databaseUtils) return;

    const mocks = this.databaseUtils.getMocks();

    // Configure OpenAI mock
    if (mockConfig.openai) {
      if (mockConfig.openai.responses) {
        Object.entries(mockConfig.openai.responses).forEach(([key, value]) => {
          mocks.openai.setMockResponse(key, value);
        });
      }
    }

    // Configure Microsoft Graph mock
    if (mockConfig.microsoftGraph) {
      if (mockConfig.microsoftGraph.responses) {
        Object.entries(mockConfig.microsoftGraph.responses).forEach(([key, value]) => {
          mocks.microsoftGraph.setMockResponse(key, value);
        });
      }
    }

    // Configure Google mock
    if (mockConfig.google) {
      if (mockConfig.google.responses) {
        Object.entries(mockConfig.google.responses).forEach(([key, value]) => {
          mocks.google.setMockResponse(key, value);
        });
      }
    }
  }
}

/**
 * Jest setup helper for easy integration
 */
export function setupTestFramework() {
  const globalSetup = GlobalTestSetup.getInstance();

  // Global setup before all tests
  beforeAll(async () => {
    await globalSetup.setupTestEnvironment();
  });

  // Global cleanup after all tests
  afterAll(async () => {
    await globalSetup.teardownTestEnvironment();
  });

  return globalSetup;
}

/**
 * Test suite setup helper with configuration options
 */
export function setupTestSuite(config: TestSuiteConfig = {}) {
  const globalSetup = GlobalTestSetup.getInstance();
  let suiteEnvironment: TestSuiteEnvironment;

  beforeAll(async () => {
    suiteEnvironment = await globalSetup.setupTestSuite(config);
  });

  afterAll(async () => {
    await globalSetup.teardownTestSuite();
  });

  return () => suiteEnvironment;
}

/**
 * Individual test setup helper
 */
export function setupTest(config: TestConfig = {}) {
  const globalSetup = GlobalTestSetup.getInstance();
  let testEnvironment: TestEnvironment;

  beforeEach(async () => {
    testEnvironment = await globalSetup.setupTest(config);
  });

  afterEach(async () => {
    await globalSetup.teardownTest(config);
  });

  return () => testEnvironment;
}

/**
 * Utility function for ADHD-specific test assertions
 */
export class AdhdTestAssertions {
  /**
   * Assert that tasks are properly distributed across energy levels
   */
  static assertEnergyDistribution(tasks: any[], expectedRatios: EnergyDistribution = {}) {
    const defaults = { LOW: 0.35, MEDIUM: 0.4, HIGH: 0.25 };
    const ratios = { ...defaults, ...expectedRatios };

    const energyCount = tasks.reduce((acc, task) => {
      acc[task.energyLevel] = (acc[task.energyLevel] || 0) + 1;
      return acc;
    }, {});

    const total = tasks.length;
    Object.entries(ratios).forEach(([level, expectedRatio]) => {
      const actualRatio = (energyCount[level] || 0) / total;
      const tolerance = 0.15; // 15% tolerance

      expect(actualRatio).toBeGreaterThanOrEqual(expectedRatio - tolerance);
      expect(actualRatio).toBeLessThanOrEqual(expectedRatio + tolerance);
    });
  }

  /**
   * Assert that focus types are properly distributed
   */
  static assertFocusTypeDistribution(tasks: any[]) {
    const focusTypes = ['CREATIVE', 'TECHNICAL', 'ADMINISTRATIVE', 'SOCIAL'];
    const focusCount = tasks.reduce((acc, task) => {
      acc[task.focusType] = (acc[task.focusType] || 0) + 1;
      return acc;
    }, {});

    // Each focus type should be represented
    focusTypes.forEach(type => {
      expect(focusCount[type]).toBeGreaterThan(0);
    });
  }

  /**
   * Assert that task complexity follows realistic patterns
   */
  static assertComplexityDistribution(tasks: any[]) {
    const complexities = tasks.map(t => t.complexity || 5);
    const average = complexities.reduce((sum, c) => sum + c, 0) / complexities.length;

    // Average complexity should be around 5 (bell curve distribution)
    expect(average).toBeGreaterThan(4);
    expect(average).toBeLessThan(6);

    // Should have variety in complexity levels
    const uniqueComplexities = new Set(complexities);
    expect(uniqueComplexities.size).toBeGreaterThan(3);
  }

  /**
   * Assert that AI suggestions are contextually appropriate
   */
  static assertAiSuggestionQuality(suggestion: any, task: any) {
    expect(suggestion).toHaveProperty('type');
    expect(suggestion).toHaveProperty('title');
    expect(suggestion).toHaveProperty('description');
    expect(suggestion).toHaveProperty('priority');
    expect(suggestion).toHaveProperty('actionable');

    // Suggestion should be relevant to task characteristics
    if (task.energyLevel === 'HIGH') {
      expect(suggestion.description.toLowerCase()).toMatch(/energy|peak|focus|high/);
    }

    if (task.priority >= 8) {
      expect(suggestion.priority).toBe('HIGH');
    }
  }
}

// Type definitions

export interface TestEnvironment {
  module: TestingModule;
  prisma: PrismaService;
  databaseUtils: TestDatabaseUtils;
  factories: TestFactories;
  mocks: TestMocks;
}

export interface TestSuiteEnvironment {
  databaseUtils: TestDatabaseUtils;
  factories: TestFactories;
  mocks: TestMocks;
  scenario: any;
  suiteConfig: TestSuiteConfig;
}

export interface TestSuiteConfig {
  scenario?: TestScenarioType;
  mockConfig?: MockConfiguration;
  isolateDatabase?: boolean;
}

export interface TestConfig {
  isolateDatabase?: boolean;
  resetMocks?: boolean;
  cleanupAfterTest?: boolean;
}

export type TestScenarioType = 'comprehensive' | 'ai-testing' | 'calendar-integration' | 'minimal';

export interface MockConfiguration {
  openai?: {
    responses?: Record<string, any>;
  };
  microsoftGraph?: {
    responses?: Record<string, any>;
  };
  google?: {
    responses?: Record<string, any>;
  };
}

export interface EnvironmentHealthReport {
  isHealthy: boolean;
  issues: string[];
  stats?: any;
  checkedAt: Date;
}

export interface EnergyDistribution {
  LOW?: number;
  MEDIUM?: number;
  HIGH?: number;
}
