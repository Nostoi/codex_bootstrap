#!/usr/bin/env ts-node

/**
 * Data Migration Script: Backfill Task Metadata
 *
 * This script backfills existing tasks with default metadata values for the new
 * ADHD-optimized task management fields added to the Task model.
 *
 * Default values applied:
 * - energyLevel: MEDIUM
 * - focusType: ADMINISTRATIVE
 * - priority: 3
 * - source: SELF
 *
 * Usage:
 *   npm run migration:backfill-tasks
 *   DATABASE_URL="postgres://user:pass@localhost:5487/db" npm run migration:backfill-tasks
 *
 * Options:
 *   --dry-run: Preview changes without applying them
 *   --rollback: Revert metadata fields to null
 */

// Ensure DATABASE_URL is set, provide default for local development
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    'postgresql://codex:codex@localhost:5487/codex_bootstrap?schema=public';
  console.log('ℹ️  Using default DATABASE_URL for local development');
}

import { PrismaClient, EnergyLevel, FocusType, TaskSource } from '@prisma/client';

const prisma = new PrismaClient();

interface MigrationStats {
  totalTasks: number;
  tasksUpdated: number;
  tasksSkipped: number;
  errors: number;
}

class TaskMetadataBackfillMigration {
  private stats: MigrationStats = {
    totalTasks: 0,
    tasksUpdated: 0,
    tasksSkipped: 0,
    errors: 0,
  };

  private isDryRun = false;
  private isRollback = false;

  constructor() {
    this.isDryRun = process.argv.includes('--dry-run');
    this.isRollback = process.argv.includes('--rollback');
  }

  /**
   * Main migration execution
   */
  async execute(): Promise<void> {
    try {
      console.log('🚀 Starting Task Metadata Backfill Migration');
      console.log(`Mode: ${this.isDryRun ? 'DRY RUN' : this.isRollback ? 'ROLLBACK' : 'LIVE'}`);
      console.log('─'.repeat(50));

      // Pre-migration verification
      await this.preFlightCheck();

      // Execute migration
      if (this.isRollback) {
        await this.rollbackMetadata();
      } else {
        await this.backfillMetadata();
      }

      // Post-migration verification
      await this.postFlightCheck();

      // Summary report
      this.printSummary();
    } catch (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    } finally {
      await prisma.$disconnect();
    }
  }

  /**
   * Pre-migration checks and statistics
   */
  private async preFlightCheck(): Promise<void> {
    console.log('🔍 Pre-flight checks...');

    // Count total tasks
    this.stats.totalTasks = await prisma.task.count();
    console.log(`📊 Total tasks in database: ${this.stats.totalTasks}`);

    if (this.stats.totalTasks === 0) {
      console.log('ℹ️  No tasks found. Nothing to migrate.');
      return;
    }

    if (!this.isRollback) {
      // Count tasks missing metadata
      const tasksNeedingUpdate = await prisma.task.count({
        where: {
          OR: [{ energyLevel: null }, { focusType: null }, { priority: null }, { source: null }],
        },
      });

      console.log(`🎯 Tasks needing metadata backfill: ${tasksNeedingUpdate}`);

      if (tasksNeedingUpdate === 0) {
        console.log('✅ All tasks already have metadata. No migration needed.');
        return;
      }
    } else {
      // Count tasks with metadata for rollback
      const tasksWithMetadata = await prisma.task.count({
        where: {
          OR: [
            { energyLevel: { not: null } },
            { focusType: { not: null } },
            { source: { not: null } },
          ],
        },
      });

      console.log(`🔄 Tasks with metadata to rollback: ${tasksWithMetadata}`);

      if (tasksWithMetadata === 0) {
        console.log('✅ No metadata to rollback. Tasks are already clean.');
        return;
      }
    }

    console.log('─'.repeat(50));
  }

  /**
   * Backfill metadata with default values
   */
  private async backfillMetadata(): Promise<void> {
    console.log('📝 Backfilling task metadata...');

    if (this.isDryRun) {
      console.log('🔍 DRY RUN: Simulating metadata backfill...');
    }

    try {
      // Find tasks that need metadata updates
      const tasksToUpdate = await prisma.task.findMany({
        where: {
          OR: [{ energyLevel: null }, { focusType: null }, { priority: null }, { source: null }],
        },
        select: {
          id: true,
          title: true,
          energyLevel: true,
          focusType: true,
          priority: true,
          source: true,
        },
      });

      console.log(`🎯 Found ${tasksToUpdate.length} tasks to update`);

      // Process each task
      for (const task of tasksToUpdate) {
        try {
          if (!this.isDryRun) {
            await prisma.task.update({
              where: { id: task.id },
              data: {
                energyLevel: task.energyLevel ?? EnergyLevel.MEDIUM,
                focusType: task.focusType ?? FocusType.ADMINISTRATIVE,
                priority: task.priority ?? 3,
                source: task.source ?? TaskSource.SELF,
              },
            });
          }

          this.stats.tasksUpdated++;

          if (this.isDryRun || process.env.NODE_ENV === 'development') {
            console.log(
              `  ✅ ${this.isDryRun ? '[DRY RUN] Would update' : 'Updated'} task: ${task.title?.substring(0, 50)}...`
            );
          }
        } catch (error) {
          this.stats.errors++;
          console.error(`  ❌ Failed to update task ${task.id}:`, error);
        }
      }
    } catch (error) {
      console.error('❌ Error during backfill:', error);
      throw error;
    }
  }

  /**
   * Rollback metadata to null values
   */
  private async rollbackMetadata(): Promise<void> {
    console.log('🔄 Rolling back task metadata...');

    if (this.isDryRun) {
      console.log('🔍 DRY RUN: Simulating metadata rollback...');
    }

    try {
      // Find tasks with metadata to rollback
      const tasksToRollback = await prisma.task.findMany({
        where: {
          OR: [
            { energyLevel: { not: null } },
            { focusType: { not: null } },
            { source: { not: null } },
          ],
        },
        select: {
          id: true,
          title: true,
        },
      });

      console.log(`🎯 Found ${tasksToRollback.length} tasks to rollback`);

      // Process each task
      for (const task of tasksToRollback) {
        try {
          if (!this.isDryRun) {
            await prisma.task.update({
              where: { id: task.id },
              data: {
                energyLevel: null,
                focusType: null,
                source: null,
                // Note: priority stays at 3 as it has a default value
              },
            });
          }

          this.stats.tasksUpdated++;

          if (this.isDryRun || process.env.NODE_ENV === 'development') {
            console.log(
              `  ✅ ${this.isDryRun ? '[DRY RUN] Would rollback' : 'Rolled back'} task: ${task.title?.substring(0, 50)}...`
            );
          }
        } catch (error) {
          this.stats.errors++;
          console.error(`  ❌ Failed to rollback task ${task.id}:`, error);
        }
      }
    } catch (error) {
      console.error('❌ Error during rollback:', error);
      throw error;
    }
  }

  /**
   * Post-migration verification
   */
  private async postFlightCheck(): Promise<void> {
    console.log('─'.repeat(50));
    console.log('🔍 Post-flight verification...');

    if (this.isDryRun) {
      console.log('ℹ️  Skipping verification for dry run');
      return;
    }

    try {
      // Verify all tasks have required metadata (for backfill) or don't have metadata (for rollback)
      if (!this.isRollback) {
        const tasksWithoutMetadata = await prisma.task.count({
          where: {
            OR: [{ energyLevel: null }, { focusType: null }, { priority: null }, { source: null }],
          },
        });

        if (tasksWithoutMetadata === 0) {
          console.log('✅ Verification passed: All tasks have metadata');
        } else {
          console.warn(`⚠️  Warning: ${tasksWithoutMetadata} tasks still missing metadata`);
        }

        // Sample verification - check a few random tasks
        const sampleTasks = await prisma.task.findMany({
          take: 3,
          select: {
            id: true,
            title: true,
            energyLevel: true,
            focusType: true,
            priority: true,
            source: true,
          },
        });

        console.log('📋 Sample task metadata:');
        sampleTasks.forEach(task => {
          console.log(
            `  • ${task.title?.substring(0, 30)}... | Energy: ${task.energyLevel} | Focus: ${task.focusType} | Priority: ${task.priority} | Source: ${task.source}`
          );
        });
      } else {
        const tasksWithMetadata = await prisma.task.count({
          where: {
            OR: [
              { energyLevel: { not: null } },
              { focusType: { not: null } },
              { source: { not: null } },
            ],
          },
        });

        if (tasksWithMetadata === 0) {
          console.log('✅ Verification passed: All metadata rolled back');
        } else {
          console.warn(`⚠️  Warning: ${tasksWithMetadata} tasks still have metadata`);
        }
      }
    } catch (error) {
      console.error('❌ Verification failed:', error);
      throw error;
    }
  }

  /**
   * Print migration summary
   */
  private printSummary(): void {
    console.log('─'.repeat(50));
    console.log('📊 Migration Summary');
    console.log(`Mode: ${this.isDryRun ? 'DRY RUN' : this.isRollback ? 'ROLLBACK' : 'LIVE'}`);
    console.log(`Total tasks in database: ${this.stats.totalTasks}`);
    console.log(`Tasks ${this.isRollback ? 'rolled back' : 'updated'}: ${this.stats.tasksUpdated}`);
    console.log(`Tasks skipped: ${this.stats.tasksSkipped}`);
    console.log(`Errors encountered: ${this.stats.errors}`);

    if (this.stats.errors === 0) {
      console.log('✅ Migration completed successfully!');
    } else {
      console.log('⚠️  Migration completed with errors. Please review logs.');
    }

    if (this.isDryRun) {
      console.log('ℹ️  This was a dry run. No actual changes were made.');
      console.log('ℹ️  To apply changes, run without --dry-run flag.');
    }
  }
}

// Execute migration
if (require.main === module) {
  const migration = new TaskMetadataBackfillMigration();
  migration.execute().catch(error => {
    console.error('💥 Migration execution failed:', error);
    process.exit(1);
  });
}

export { TaskMetadataBackfillMigration };
