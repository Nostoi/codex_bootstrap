import { faker } from '@faker-js/faker';
import { BaseFactory, FactoryManager } from './base.factory';
import { PrismaService } from '../../src/prisma/prisma.service';
import { User } from '@prisma/client';

/**
 * User Factory for generating ADHD-focused test users
 * Creates realistic user profiles with ADHD-specific preferences and settings
 */
export class UserFactory extends BaseFactory<User> {
  private factoryManager = FactoryManager.getInstance();

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  /**
   * Build a user with realistic ADHD-focused defaults
   */
  build(overrides: Partial<User> = {}): User {
    const firstName = overrides.firstName || faker.person.firstName();
    const lastName = overrides.lastName || faker.person.lastName();

    return {
      id: this.generateTestId('user'),
      email: overrides.email || faker.internet.email({ firstName, lastName }),
      firstName,
      lastName,
      displayName: overrides.displayName || `${firstName} ${lastName}`,
      avatarUrl: overrides.avatarUrl || faker.image.avatar(),

      // ADHD-specific user preferences
      preferences: overrides.preferences || this.generateAdhdPreferences(),

      // Authentication fields
      googleId: overrides.googleId || (faker.datatype.boolean() ? faker.string.uuid() : null),
      microsoftId: overrides.microsoftId || (faker.datatype.boolean() ? faker.string.uuid() : null),

      // Subscription and feature flags
      subscriptionTier: overrides.subscriptionTier || this.generateSubscriptionTier(),
      features: overrides.features || this.generateFeatureFlags(),

      // Activity tracking
      lastActiveAt: overrides.lastActiveAt || faker.date.recent({ days: 7 }),
      createdAt: overrides.createdAt || faker.date.past({ years: 2 }),
      updatedAt: overrides.updatedAt || new Date(),

      ...overrides,
    } as User;
  }

  /**
   * Create and persist a user to database
   */
  async create(overrides: Partial<User> = {}): Promise<User> {
    const userData = this.build(overrides);

    // Remove id to let Prisma generate it
    const { id, ...createData } = userData;

    const user = await this.prisma.user.create({
      data: createData,
    });

    this.factoryManager.trackEntity('user', user.id);
    return user;
  }

  /**
   * Create user with specific ADHD persona
   */
  async createAdhdPersona(
    persona: 'HIGH_ACHIEVER' | 'OVERWHELMED' | 'CREATIVE' | 'TECHNICAL'
  ): Promise<User> {
    const personaData = this.getAdhdPersonaData(persona);
    return this.create(personaData);
  }

  /**
   * Create multiple users with diverse ADHD profiles
   */
  async createAdhdTestCohort(): Promise<{
    highAchiever: User;
    overwhelmed: User;
    creative: User;
    technical: User;
    newUser: User;
    premiumUser: User;
  }> {
    const [highAchiever, overwhelmed, creative, technical, newUser, premiumUser] =
      await Promise.all([
        this.createAdhdPersona('HIGH_ACHIEVER'),
        this.createAdhdPersona('OVERWHELMED'),
        this.createAdhdPersona('CREATIVE'),
        this.createAdhdPersona('TECHNICAL'),
        this.create({
          createdAt: faker.date.recent({ days: 3 }),
          subscriptionTier: 'FREE',
        }),
        this.create({
          subscriptionTier: 'PREMIUM',
          features: this.generateFeatureFlags(true),
        }),
      ]);

    return {
      highAchiever,
      overwhelmed,
      creative,
      technical,
      newUser,
      premiumUser,
    };
  }

  /**
   * Create user with Google OAuth profile
   */
  async createGoogleUser(overrides: Partial<User> = {}): Promise<User> {
    return this.create({
      googleId: faker.string.uuid(),
      microsoftId: null,
      email: faker.internet.email(),
      avatarUrl: `https://lh3.googleusercontent.com/${faker.string.alphanumeric(21)}`,
      ...overrides,
    });
  }

  /**
   * Create user with Microsoft OAuth profile
   */
  async createMicrosoftUser(overrides: Partial<User> = {}): Promise<User> {
    return this.create({
      microsoftId: faker.string.uuid(),
      googleId: null,
      email: faker.internet.email({ provider: 'outlook.com' }),
      ...overrides,
    });
  }

  /**
   * Cleanup created users
   */
  async cleanup(): Promise<void> {
    const userIds = this.factoryManager.getCreatedEntities('user');

    if (userIds.length > 0) {
      // Delete user-related data first (tasks, projects, etc.)
      await this.prisma.task.deleteMany({
        where: { ownerId: { in: userIds } },
      });

      await this.prisma.project.deleteMany({
        where: { ownerId: { in: userIds } },
      });

      await this.prisma.notification.deleteMany({
        where: { userId: { in: userIds } },
      });

      // Delete users
      await this.prisma.user.deleteMany({
        where: { id: { in: userIds } },
      });
    }

    this.factoryManager.clearTracking('user');
  }

  // Private helper methods

  private generateAdhdPreferences(): Record<string, any> {
    return {
      // Energy pattern preferences
      peakEnergyHours: faker.helpers.arrayElement([
        'MORNING', // 7-11 AM
        'AFTERNOON', // 1-5 PM
        'EVENING', // 6-9 PM
        'NIGHT', // 10 PM - 1 AM
      ]),

      // Task management preferences
      preferredTaskBatchSize: faker.number.int({ min: 3, max: 8 }),
      breakReminders: faker.datatype.boolean(),
      timerDuration: faker.helpers.arrayElement([15, 25, 30, 45, 60]), // Pomodoro variants

      // UI/UX preferences
      reducedMotion: faker.datatype.boolean({ probability: 0.3 }),
      highContrast: faker.datatype.boolean({ probability: 0.2 }),
      largeFonts: faker.datatype.boolean({ probability: 0.25 }),

      // Notification preferences
      gentleReminders: faker.datatype.boolean({ probability: 0.7 }),
      deadlineAlerts: faker.helpers.arrayElement(['GENTLE', 'STANDARD', 'URGENT']),
      dailyPlanning: faker.datatype.boolean({ probability: 0.8 }),

      // Focus preferences
      preferredFocusTypes: faker.helpers.arrayElements(
        ['CREATIVE', 'TECHNICAL', 'ADMINISTRATIVE', 'SOCIAL'],
        { min: 1, max: 3 }
      ),
      avoidInterruptions: faker.datatype.boolean({ probability: 0.6 }),

      // Calendar and scheduling
      bufferTime: faker.number.int({ min: 5, max: 30 }), // minutes between tasks
      autoScheduling: faker.datatype.boolean({ probability: 0.5 }),
      timeBlocking: faker.datatype.boolean({ probability: 0.4 }),

      // Productivity insights
      trackEnergyLevels: faker.datatype.boolean({ probability: 0.6 }),
      weeklyReports: faker.datatype.boolean({ probability: 0.3 }),
    };
  }

  private generateSubscriptionTier(): string {
    return faker.helpers.weightedArrayElement([
      { weight: 60, value: 'FREE' },
      { weight: 30, value: 'PREMIUM' },
      { weight: 10, value: 'ENTERPRISE' },
    ]);
  }

  private generateFeatureFlags(isPremium: boolean = false): Record<string, boolean> {
    const baseFeatures = {
      darkMode: faker.datatype.boolean(),
      betaFeatures: faker.datatype.boolean({ probability: 0.2 }),
      calendarSync: faker.datatype.boolean({ probability: 0.7 }),
      emailIntegration: faker.datatype.boolean({ probability: 0.4 }),
    };

    if (isPremium) {
      return {
        ...baseFeatures,
        aiSuggestions: true,
        advancedAnalytics: true,
        prioritySupport: true,
        customThemes: true,
        exportFeatures: true,
        teamCollaboration: faker.datatype.boolean({ probability: 0.6 }),
      };
    }

    return baseFeatures;
  }

  private getAdhdPersonaData(persona: string): Partial<User> {
    const baseData = {
      preferences: this.generateAdhdPreferences(),
      features: this.generateFeatureFlags(),
    };

    switch (persona) {
      case 'HIGH_ACHIEVER':
        return {
          ...baseData,
          subscriptionTier: 'PREMIUM',
          preferences: {
            ...baseData.preferences,
            peakEnergyHours: 'MORNING',
            preferredTaskBatchSize: 6,
            timerDuration: 25, // Pomodoro
            dailyPlanning: true,
            autoScheduling: true,
            trackEnergyLevels: true,
            weeklyReports: true,
            preferredFocusTypes: ['TECHNICAL', 'ADMINISTRATIVE'],
          },
        };

      case 'OVERWHELMED':
        return {
          ...baseData,
          subscriptionTier: 'FREE',
          preferences: {
            ...baseData.preferences,
            preferredTaskBatchSize: 3,
            breakReminders: true,
            timerDuration: 15, // Shorter focus sessions
            gentleReminders: true,
            deadlineAlerts: 'GENTLE',
            reducedMotion: true,
            bufferTime: 15, // More time between tasks
            avoidInterruptions: true,
            preferredFocusTypes: ['ADMINISTRATIVE'],
          },
        };

      case 'CREATIVE':
        return {
          ...baseData,
          subscriptionTier: faker.helpers.arrayElement(['FREE', 'PREMIUM']),
          preferences: {
            ...baseData.preferences,
            peakEnergyHours: faker.helpers.arrayElement(['MORNING', 'EVENING']),
            timerDuration: 45, // Longer creative sessions
            timeBlocking: true,
            preferredFocusTypes: ['CREATIVE', 'SOCIAL'],
            avoidInterruptions: true,
            bufferTime: 20,
          },
        };

      case 'TECHNICAL':
        return {
          ...baseData,
          subscriptionTier: 'PREMIUM',
          preferences: {
            ...baseData.preferences,
            peakEnergyHours: faker.helpers.arrayElement(['MORNING', 'NIGHT']),
            timerDuration: 60, // Deep work sessions
            preferredFocusTypes: ['TECHNICAL'],
            avoidInterruptions: true,
            autoScheduling: true,
            trackEnergyLevels: true,
            bufferTime: 10,
          },
        };

      default:
        return baseData;
    }
  }
}
