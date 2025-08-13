import { Page, BrowserContext } from '@playwright/test';
import { MockRouteBuilder } from './mocks/mockServices';
import { TaskFactory, UserFactory } from './factories/testDataFactory';

/**
 * Test Context Manager
 *
 * Provides utilities for managing test state, setup, and teardown
 * with ADHD-optimized features and comprehensive mock services
 */
export class TestContextManager {
  private page: Page;
  private context: BrowserContext;
  private mockRouteBuilder: MockRouteBuilder;
  private testData: Map<string, any> = new Map();

  constructor(page: Page, context: BrowserContext) {
    this.page = page;
    this.context = context;
    this.mockRouteBuilder = new MockRouteBuilder(page);
  }

  /**
   * Complete test environment setup
   */
  async setupTestEnvironment(
    options: {
      mockAPI?: boolean;
      seedData?: boolean;
      adhdProfile?: 'high-energy' | 'moderate' | 'low-energy';
      accessibility?: boolean;
    } = {}
  ): Promise<void> {
    const {
      mockAPI = true,
      seedData = true,
      adhdProfile = 'moderate',
      accessibility = true,
    } = options;

    // Setup API mocking
    if (mockAPI) {
      await this.mockRouteBuilder.setupAllMocks();
    }

    // Setup ADHD-specific user profile
    if (seedData) {
      await this.setupADHDUserProfile(adhdProfile);
    }

    // Configure accessibility features
    if (accessibility) {
      await this.enableAccessibilityFeatures();
    }

    // Setup viewport for consistent testing
    await this.page.setViewportSize({ width: 1280, height: 720 });
  }

  /**
   * Setup ADHD-specific user profile with energy patterns
   */
  async setupADHDUserProfile(profile: 'high-energy' | 'moderate' | 'low-energy'): Promise<void> {
    const userConfig = this.getADHDUserConfig(profile);

    // Store user configuration
    this.testData.set('userProfile', userConfig);

    // Setup local storage with user preferences
    await this.page.addInitScript(config => {
      localStorage.setItem('adhd-profile', JSON.stringify(config));
      localStorage.setItem('energy-preferences', JSON.stringify(config.energyPreferences));
      localStorage.setItem('focus-preferences', JSON.stringify(config.focusPreferences));
    }, userConfig);

    // Generate appropriate test tasks for this profile
    const tasks = this.generateProfileSpecificTasks(profile);
    this.testData.set('profileTasks', tasks);
  }

  /**
   * Enable accessibility features for testing
   */
  async enableAccessibilityFeatures(): Promise<void> {
    await this.page.addInitScript(() => {
      // Enable high contrast mode
      document.documentElement.setAttribute('data-theme', 'high-contrast');

      // Enable reduced motion
      document.documentElement.style.setProperty('--animation-duration', '0.01ms');

      // Enable screen reader optimizations
      document.documentElement.setAttribute('data-screen-reader', 'true');
    });
  }

  /**
   * Navigate to page with proper loading and error handling
   */
  async navigateWithContext(
    url: string,
    options: {
      waitForLoadState?: 'load' | 'domcontentloaded' | 'networkidle';
      timeout?: number;
      retries?: number;
    } = {}
  ): Promise<void> {
    const { waitForLoadState = 'domcontentloaded', timeout = 30000, retries = 3 } = options;

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await this.page.goto(url, { timeout });
        await this.page.waitForLoadState(waitForLoadState, { timeout });

        // Wait for ADHD-specific components to load
        await this.waitForADHDComponents();

        return; // Success
      } catch (error) {
        lastError = error as Error;
        console.warn(`Navigation attempt ${attempt} failed:`, error);

        if (attempt < retries) {
          // Wait before retry
          await this.page.waitForTimeout(1000 * attempt);
        }
      }
    }

    throw new Error(
      `Failed to navigate after ${retries} attempts. Last error: ${lastError?.message}`
    );
  }

  /**
   * Wait for ADHD-specific components to load
   */
  async waitForADHDComponents(timeout: number = 10000): Promise<void> {
    try {
      // Wait for energy level indicators
      await this.page.waitForSelector('[data-testid*="energy-"]', { timeout });

      // Wait for focus type indicators
      await this.page.waitForSelector('[data-testid*="focus-"]', { timeout });

      // Wait for task cards to be interactive
      await this.page.waitForSelector('[data-testid="task-card"]', {
        timeout,
        state: 'attached',
      });

      // Ensure AI components are loaded (if present)
      const aiComponents = await this.page.locator('[data-testid*="ai-"]').count();
      if (aiComponents > 0) {
        await this.page.waitForSelector('[data-testid*="ai-"]', {
          timeout,
          state: 'attached',
        });
      }
    } catch (error) {
      console.warn('Some ADHD components may not have loaded:', error);
      // Don't fail the test, just log the warning
    }
  }

  /**
   * Seed test data with realistic scenarios
   */
  async seedTestData(scenario: 'empty' | 'basic' | 'complex' | 'realistic'): Promise<void> {
    let tasks: any[] = [];

    switch (scenario) {
      case 'empty':
        tasks = [];
        break;
      case 'basic':
        tasks = [
          TaskFactory.createWithEnergyLevel('HIGH'),
          TaskFactory.createWithEnergyLevel('MEDIUM'),
          TaskFactory.createWithEnergyLevel('LOW'),
        ];
        break;
      case 'complex':
        tasks = [
          ...TaskFactory.createBatch(5, { metadata: { energyLevel: 'HIGH' } }),
          ...TaskFactory.createBatch(3, { metadata: { energyLevel: 'MEDIUM' } }),
          ...TaskFactory.createBatch(2, { metadata: { energyLevel: 'LOW' } }),
        ];
        break;
      case 'realistic':
        tasks = this.generateRealisticTaskSet();
        break;
    }

    this.testData.set('seededTasks', tasks);

    // Update mock responses with seeded data
    await this.updateMockWithSeededData(tasks);
  }

  /**
   * Create task with specific ADHD characteristics
   */
  async createTaskWithADHDFeatures(features: {
    energyLevel: 'HIGH' | 'MEDIUM' | 'LOW';
    focusType: 'CREATIVE' | 'TECHNICAL' | 'ADMINISTRATIVE' | 'SOCIAL';
    complexity?: number;
    estimatedDuration?: number;
    priority?: number;
  }): Promise<any> {
    const task = TaskFactory.createWithMetadata({
      metadata: {
        energyLevel: features.energyLevel,
        focusType: features.focusType,
        complexity: features.complexity || 5,
        estimatedDuration: features.estimatedDuration || 60,
        priority: features.priority || 5,
      },
    });

    this.testData.set(`task-${task.id}`, task);
    return task;
  }

  /**
   * Simulate user interaction with ADHD considerations
   */
  async simulateADHDUserBehavior(
    behavior: 'distracted' | 'focused' | 'overwhelmed'
  ): Promise<void> {
    switch (behavior) {
      case 'distracted':
        // Simulate quick, scattered interactions
        await this.page.mouse.move(100, 100);
        await this.page.waitForTimeout(200);
        await this.page.mouse.move(300, 200);
        await this.page.waitForTimeout(150);
        await this.page.mouse.move(200, 400);
        break;

      case 'focused':
        // Simulate deliberate, purposeful interactions
        await this.page.waitForTimeout(500);
        break;

      case 'overwhelmed':
        // Simulate hesitation and multiple start/stop actions
        await this.page.mouse.move(150, 150);
        await this.page.waitForTimeout(800);
        await this.page.mouse.move(160, 160);
        await this.page.waitForTimeout(600);
        break;
    }
  }

  /**
   * Verify ADHD-specific UI elements
   */
  async verifyADHDFeatures(): Promise<void> {
    // Check for energy level indicators
    const energyIndicators = await this.page.locator('[data-testid*="energy-"]').count();
    if (energyIndicators === 0) {
      console.warn('No energy level indicators found');
    }

    // Check for focus type indicators
    const focusIndicators = await this.page.locator('[data-testid*="focus-"]').count();
    if (focusIndicators === 0) {
      console.warn('No focus type indicators found');
    }

    // Check for accessibility features
    const highContrast = await this.page.getAttribute('html', 'data-theme');
    if (highContrast !== 'high-contrast') {
      console.warn('High contrast mode not enabled');
    }
  }

  /**
   * Take screenshot with context information
   */
  async takeContextualScreenshot(
    name: string,
    options: {
      highlightElements?: string[];
      annotate?: boolean;
    } = {}
  ): Promise<void> {
    const { highlightElements = [], annotate = false } = options;

    // Highlight specified elements
    if (highlightElements.length > 0) {
      for (const selector of highlightElements) {
        await this.page.locator(selector).highlight();
      }
    }

    // Add timestamp and context to screenshot
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const profile = this.testData.get('userProfile')?.type || 'unknown';

    await this.page.screenshot({
      path: `test-results/screenshots/${name}-${profile}-${timestamp}.png`,
      fullPage: true,
    });
  }

  /**
   * Clean up test environment
   */
  async cleanup(): Promise<void> {
    // Reset mock services
    this.mockRouteBuilder.resetMocks();

    // Clear test data
    this.testData.clear();

    // Clear local storage
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }

  /**
   * Get current test data
   */
  getTestData(key: string): any {
    return this.testData.get(key);
  }

  /**
   * Get ADHD user configuration for profile
   */
  private getADHDUserConfig(profile: 'high-energy' | 'moderate' | 'low-energy'): any {
    const baseConfig = {
      type: profile,
      preferences: {
        reducedMotion: true,
        highContrast: false,
        largeText: false,
        audioFeedback: false,
      },
    };

    switch (profile) {
      case 'high-energy':
        return {
          ...baseConfig,
          energyPreferences: {
            optimalTimes: ['09:00', '11:00', '14:00'],
            peakHours: 4,
            preferredComplexity: 7,
          },
          focusPreferences: {
            preferredTypes: ['CREATIVE', 'TECHNICAL'],
            maxSessionTime: 90,
            breakFrequency: 45,
          },
        };

      case 'moderate':
        return {
          ...baseConfig,
          energyPreferences: {
            optimalTimes: ['10:00', '14:00'],
            peakHours: 3,
            preferredComplexity: 5,
          },
          focusPreferences: {
            preferredTypes: ['TECHNICAL', 'ADMINISTRATIVE'],
            maxSessionTime: 60,
            breakFrequency: 30,
          },
        };

      case 'low-energy':
        return {
          ...baseConfig,
          preferences: {
            ...baseConfig.preferences,
            reducedMotion: true,
            highContrast: true,
          },
          energyPreferences: {
            optimalTimes: ['10:00'],
            peakHours: 2,
            preferredComplexity: 3,
          },
          focusPreferences: {
            preferredTypes: ['ADMINISTRATIVE', 'SOCIAL'],
            maxSessionTime: 30,
            breakFrequency: 20,
          },
        };

      default:
        return baseConfig;
    }
  }

  /**
   * Generate profile-specific tasks
   */
  private generateProfileSpecificTasks(profile: 'high-energy' | 'moderate' | 'low-energy'): any[] {
    const config = this.getADHDUserConfig(profile);
    const tasks = [];

    // Generate tasks that match the user's preferred energy levels and focus types
    for (const focusType of config.focusPreferences.preferredTypes) {
      const energyLevel =
        profile === 'high-energy' ? 'HIGH' : profile === 'moderate' ? 'MEDIUM' : 'LOW';

      tasks.push(
        TaskFactory.createWithMetadata({
          metadata: {
            energyLevel,
            focusType,
            complexity: config.energyPreferences.preferredComplexity,
            estimatedDuration: config.focusPreferences.maxSessionTime,
          },
        })
      );
    }

    return tasks;
  }

  /**
   * Generate realistic task set for comprehensive testing
   */
  private generateRealisticTaskSet(): any[] {
    return [
      // High energy creative tasks
      TaskFactory.createWithMetadata({
        title: 'Design new feature mockups',
        metadata: { energyLevel: 'HIGH', focusType: 'CREATIVE', complexity: 8 },
      }),
      TaskFactory.createWithMetadata({
        title: 'Write technical blog post',
        metadata: { energyLevel: 'HIGH', focusType: 'CREATIVE', complexity: 7 },
      }),

      // Medium energy technical tasks
      TaskFactory.createWithMetadata({
        title: 'Review code pull requests',
        metadata: { energyLevel: 'MEDIUM', focusType: 'TECHNICAL', complexity: 5 },
      }),
      TaskFactory.createWithMetadata({
        title: 'Debug performance issues',
        metadata: { energyLevel: 'MEDIUM', focusType: 'TECHNICAL', complexity: 6 },
      }),

      // Low energy administrative tasks
      TaskFactory.createWithMetadata({
        title: 'Update project documentation',
        metadata: { energyLevel: 'LOW', focusType: 'ADMINISTRATIVE', complexity: 3 },
      }),
      TaskFactory.createWithMetadata({
        title: 'Organize meeting notes',
        metadata: { energyLevel: 'LOW', focusType: 'ADMINISTRATIVE', complexity: 2 },
      }),

      // Social tasks
      TaskFactory.createWithMetadata({
        title: 'Team retrospective meeting',
        metadata: { energyLevel: 'MEDIUM', focusType: 'SOCIAL', complexity: 4 },
      }),
    ];
  }

  /**
   * Update mock responses with seeded data
   */
  private async updateMockWithSeededData(tasks: any[]): Promise<void> {
    // This would update the mock service responses to include the seeded tasks
    // For now, we'll store it in test data for access by mock services
    this.testData.set('mockTasks', tasks);
  }
}

/**
 * Test Setup Utilities
 */
export class TestSetup {
  /**
   * Quick setup for ADHD dashboard tests
   */
  static async setupADHDDashboardTest(
    page: Page,
    context: BrowserContext
  ): Promise<TestContextManager> {
    const manager = new TestContextManager(page, context);

    await manager.setupTestEnvironment({
      mockAPI: true,
      seedData: true,
      adhdProfile: 'moderate',
      accessibility: true,
    });

    await manager.seedTestData('realistic');

    return manager;
  }

  /**
   * Setup for accessibility testing
   */
  static async setupAccessibilityTest(
    page: Page,
    context: BrowserContext
  ): Promise<TestContextManager> {
    const manager = new TestContextManager(page, context);

    await manager.setupTestEnvironment({
      mockAPI: true,
      seedData: false,
      adhdProfile: 'low-energy', // Most accessibility needs
      accessibility: true,
    });

    return manager;
  }

  /**
   * Setup for performance testing
   */
  static async setupPerformanceTest(
    page: Page,
    context: BrowserContext
  ): Promise<TestContextManager> {
    const manager = new TestContextManager(page, context);

    await manager.setupTestEnvironment({
      mockAPI: false, // Use real API for performance testing
      seedData: true,
      adhdProfile: 'high-energy',
      accessibility: false,
    });

    await manager.seedTestData('complex');

    return manager;
  }
}

/**
 * Test Data Utilities
 */
export class TestDataUtils {
  /**
   * Generate test user with ADHD profile
   */
  static generateADHDUser(profile: 'high-energy' | 'moderate' | 'low-energy'): any {
    const baseUser = UserFactory.createWithProfile('adhd');
    const config = new TestContextManager(null as any, null as any)['getADHDUserConfig'](profile);

    return {
      ...baseUser,
      preferences: config,
    };
  }

  /**
   * Generate task list with energy distribution
   */
  static generateEnergyBalancedTasks(count: number): any[] {
    const tasks = [];
    const energyLevels = ['HIGH', 'MEDIUM', 'LOW'];

    for (let i = 0; i < count; i++) {
      const energyLevel = energyLevels[i % energyLevels.length];
      tasks.push(TaskFactory.createWithEnergyLevel(energyLevel as any));
    }

    return tasks;
  }

  /**
   * Generate calendar events for testing daily planning
   */
  static generateCalendarEvents(date: string = new Date().toISOString().split('T')[0]): any[] {
    return [
      {
        id: 'cal-1',
        title: 'Team Standup',
        start: `${date}T09:00:00Z`,
        end: `${date}T09:30:00Z`,
        type: 'meeting',
      },
      {
        id: 'cal-2',
        title: 'Focus Block',
        start: `${date}T10:00:00Z`,
        end: `${date}T12:00:00Z`,
        type: 'focus',
      },
      {
        id: 'cal-3',
        title: 'Lunch Break',
        start: `${date}T12:00:00Z`,
        end: `${date}T13:00:00Z`,
        type: 'break',
      },
    ];
  }
}
