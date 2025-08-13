import { PrismaService } from '../src/prisma/prisma.service';
import { faker } from '@faker-js/faker';

/**
 * Base Factory class providing common utilities for test data generation
 * Follows the Factory Pattern for consistent and reusable test data creation
 */
export abstract class BaseFactory<T> {
  protected prisma: PrismaService;

  constructor(prisma: PrismaService) {
    this.prisma = prisma;
  }

  /**
   * Generate a single entity with optional overrides
   */
  abstract build(overrides?: Partial<T>): T;

  /**
   * Create and persist a single entity to database
   */
  abstract create(overrides?: Partial<T>): Promise<T>;

  /**
   * Create multiple entities in batch
   */
  async createMany(count: number, overrides?: Partial<T>): Promise<T[]> {
    const entities = [];
    for (let i = 0; i < count; i++) {
      entities.push(await this.create(overrides));
    }
    return entities;
  }

  /**
   * Generate multiple entities without persisting
   */
  buildMany(count: number, overrides?: Partial<T>): T[] {
    return Array.from({ length: count }, () => this.build(overrides));
  }

  /**
   * Clean up created entities (for test isolation)
   */
  abstract cleanup(): Promise<void>;

  /**
   * Generate consistent test ID with prefix
   */
  protected generateTestId(prefix: string): string {
    return `test_${prefix}_${Date.now()}_${faker.string.alphanumeric(8)}`;
  }

  /**
   * Generate ADHD-friendly random energy level distribution
   * Based on typical ADHD energy patterns (35% LOW, 40% MEDIUM, 25% HIGH)
   */
  protected generateEnergyLevel(): 'LOW' | 'MEDIUM' | 'HIGH' {
    const rand = faker.number.float({ min: 0, max: 1 });
    if (rand < 0.35) return 'LOW';
    if (rand < 0.75) return 'MEDIUM';
    return 'HIGH';
  }

  /**
   * Generate realistic focus type distribution
   * Based on common ADHD work patterns
   */
  protected generateFocusType(): 'CREATIVE' | 'TECHNICAL' | 'ADMINISTRATIVE' | 'SOCIAL' {
    const types = ['CREATIVE', 'TECHNICAL', 'ADMINISTRATIVE', 'SOCIAL'] as const;
    return faker.helpers.arrayElement(types);
  }

  /**
   * Generate realistic task complexity (1-10 scale)
   * Weighted toward middle complexity for typical workflows
   */
  protected generateComplexity(): number {
    // Bell curve distribution centered around 5-6
    return Math.max(1, Math.min(10, Math.round(faker.number.float({ min: 1, max: 10 }))));
  }

  /**
   * Generate estimated minutes based on complexity and energy level
   */
  protected generateEstimatedMinutes(complexity: number, energyLevel: string): number {
    const baseMinutes = complexity * 15; // 15 min per complexity point
    const energyMultiplier = energyLevel === 'HIGH' ? 0.8 : energyLevel === 'LOW' ? 1.5 : 1.0;
    return Math.round(baseMinutes * energyMultiplier);
  }

  /**
   * Generate realistic deadline based on priority and complexity
   */
  protected generateDeadlines(
    priority: number,
    complexity: number
  ): {
    softDeadline: Date | null;
    hardDeadline: Date | null;
  } {
    const now = new Date();
    const hasDeadlines = faker.number.float({ min: 0, max: 1 }) > 0.3; // 70% of tasks have deadlines

    if (!hasDeadlines) {
      return { softDeadline: null, hardDeadline: null };
    }

    // Higher priority = sooner deadlines
    const daysFromNow = Math.max(1, 14 - priority * 1.5 + complexity * 0.5);

    const softDeadline = faker.date.future({ days: daysFromNow });
    const hardDeadline = faker.date.future({
      days: daysFromNow + faker.number.int({ min: 1, max: 7 }),
    });

    return { softDeadline, hardDeadline };
  }
}

/**
 * Factory state management for test isolation
 */
export class FactoryManager {
  private static instance: FactoryManager;
  private createdEntities: Map<string, string[]> = new Map();

  static getInstance(): FactoryManager {
    if (!FactoryManager.instance) {
      FactoryManager.instance = new FactoryManager();
    }
    return FactoryManager.instance;
  }

  /**
   * Track created entity for cleanup
   */
  trackEntity(entityType: string, id: string): void {
    if (!this.createdEntities.has(entityType)) {
      this.createdEntities.set(entityType, []);
    }
    this.createdEntities.get(entityType)!.push(id);
  }

  /**
   * Get all created entities of a type
   */
  getCreatedEntities(entityType: string): string[] {
    return this.createdEntities.get(entityType) || [];
  }

  /**
   * Clear tracking for entity type
   */
  clearTracking(entityType: string): void {
    this.createdEntities.delete(entityType);
  }

  /**
   * Clear all tracking
   */
  clearAllTracking(): void {
    this.createdEntities.clear();
  }
}
