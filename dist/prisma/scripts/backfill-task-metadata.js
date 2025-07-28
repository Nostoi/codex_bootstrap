#!/usr/bin/env ts-node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskMetadataBackfillMigration = void 0;
if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "postgresql://codex:codex@localhost:5487/codex_bootstrap?schema=public";
    console.log('ℹ️  Using default DATABASE_URL for local development');
}
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class TaskMetadataBackfillMigration {
    constructor() {
        this.stats = {
            totalTasks: 0,
            tasksUpdated: 0,
            tasksSkipped: 0,
            errors: 0
        };
        this.isDryRun = false;
        this.isRollback = false;
        this.isDryRun = process.argv.includes('--dry-run');
        this.isRollback = process.argv.includes('--rollback');
    }
    async execute() {
        try {
            console.log('🚀 Starting Task Metadata Backfill Migration');
            console.log(`Mode: ${this.isDryRun ? 'DRY RUN' : this.isRollback ? 'ROLLBACK' : 'LIVE'}`);
            console.log('─'.repeat(50));
            await this.preFlightCheck();
            if (this.isRollback) {
                await this.rollbackMetadata();
            }
            else {
                await this.backfillMetadata();
            }
            await this.postFlightCheck();
            this.printSummary();
        }
        catch (error) {
            console.error('❌ Migration failed:', error);
            process.exit(1);
        }
        finally {
            await prisma.$disconnect();
        }
    }
    async preFlightCheck() {
        console.log('🔍 Pre-flight checks...');
        this.stats.totalTasks = await prisma.task.count();
        console.log(`📊 Total tasks in database: ${this.stats.totalTasks}`);
        if (this.stats.totalTasks === 0) {
            console.log('ℹ️  No tasks found. Nothing to migrate.');
            return;
        }
        if (!this.isRollback) {
            const tasksNeedingUpdate = await prisma.task.count({
                where: {
                    OR: [
                        { energyLevel: null },
                        { focusType: null },
                        { priority: null },
                        { source: null }
                    ]
                }
            });
            console.log(`🎯 Tasks needing metadata backfill: ${tasksNeedingUpdate}`);
            if (tasksNeedingUpdate === 0) {
                console.log('✅ All tasks already have metadata. No migration needed.');
                return;
            }
        }
        else {
            const tasksWithMetadata = await prisma.task.count({
                where: {
                    OR: [
                        { energyLevel: { not: null } },
                        { focusType: { not: null } },
                        { source: { not: null } }
                    ]
                }
            });
            console.log(`🔄 Tasks with metadata to rollback: ${tasksWithMetadata}`);
            if (tasksWithMetadata === 0) {
                console.log('✅ No metadata to rollback. Tasks are already clean.');
                return;
            }
        }
        console.log('─'.repeat(50));
    }
    async backfillMetadata() {
        console.log('📝 Backfilling task metadata...');
        if (this.isDryRun) {
            console.log('🔍 DRY RUN: Simulating metadata backfill...');
        }
        try {
            const tasksToUpdate = await prisma.task.findMany({
                where: {
                    OR: [
                        { energyLevel: null },
                        { focusType: null },
                        { priority: null },
                        { source: null }
                    ]
                },
                select: {
                    id: true,
                    title: true,
                    energyLevel: true,
                    focusType: true,
                    priority: true,
                    source: true
                }
            });
            console.log(`🎯 Found ${tasksToUpdate.length} tasks to update`);
            for (const task of tasksToUpdate) {
                try {
                    if (!this.isDryRun) {
                        await prisma.task.update({
                            where: { id: task.id },
                            data: {
                                energyLevel: task.energyLevel ?? client_1.EnergyLevel.MEDIUM,
                                focusType: task.focusType ?? client_1.FocusType.ADMINISTRATIVE,
                                priority: task.priority ?? 3,
                                source: task.source ?? client_1.TaskSource.SELF
                            }
                        });
                    }
                    this.stats.tasksUpdated++;
                    if (this.isDryRun || process.env.NODE_ENV === 'development') {
                        console.log(`  ✅ ${this.isDryRun ? '[DRY RUN] Would update' : 'Updated'} task: ${task.title?.substring(0, 50)}...`);
                    }
                }
                catch (error) {
                    this.stats.errors++;
                    console.error(`  ❌ Failed to update task ${task.id}:`, error);
                }
            }
        }
        catch (error) {
            console.error('❌ Error during backfill:', error);
            throw error;
        }
    }
    async rollbackMetadata() {
        console.log('🔄 Rolling back task metadata...');
        if (this.isDryRun) {
            console.log('🔍 DRY RUN: Simulating metadata rollback...');
        }
        try {
            const tasksToRollback = await prisma.task.findMany({
                where: {
                    OR: [
                        { energyLevel: { not: null } },
                        { focusType: { not: null } },
                        { source: { not: null } }
                    ]
                },
                select: {
                    id: true,
                    title: true
                }
            });
            console.log(`🎯 Found ${tasksToRollback.length} tasks to rollback`);
            for (const task of tasksToRollback) {
                try {
                    if (!this.isDryRun) {
                        await prisma.task.update({
                            where: { id: task.id },
                            data: {
                                energyLevel: null,
                                focusType: null,
                                source: null
                            }
                        });
                    }
                    this.stats.tasksUpdated++;
                    if (this.isDryRun || process.env.NODE_ENV === 'development') {
                        console.log(`  ✅ ${this.isDryRun ? '[DRY RUN] Would rollback' : 'Rolled back'} task: ${task.title?.substring(0, 50)}...`);
                    }
                }
                catch (error) {
                    this.stats.errors++;
                    console.error(`  ❌ Failed to rollback task ${task.id}:`, error);
                }
            }
        }
        catch (error) {
            console.error('❌ Error during rollback:', error);
            throw error;
        }
    }
    async postFlightCheck() {
        console.log('─'.repeat(50));
        console.log('🔍 Post-flight verification...');
        if (this.isDryRun) {
            console.log('ℹ️  Skipping verification for dry run');
            return;
        }
        try {
            if (!this.isRollback) {
                const tasksWithoutMetadata = await prisma.task.count({
                    where: {
                        OR: [
                            { energyLevel: null },
                            { focusType: null },
                            { priority: null },
                            { source: null }
                        ]
                    }
                });
                if (tasksWithoutMetadata === 0) {
                    console.log('✅ Verification passed: All tasks have metadata');
                }
                else {
                    console.warn(`⚠️  Warning: ${tasksWithoutMetadata} tasks still missing metadata`);
                }
                const sampleTasks = await prisma.task.findMany({
                    take: 3,
                    select: {
                        id: true,
                        title: true,
                        energyLevel: true,
                        focusType: true,
                        priority: true,
                        source: true
                    }
                });
                console.log('📋 Sample task metadata:');
                sampleTasks.forEach(task => {
                    console.log(`  • ${task.title?.substring(0, 30)}... | Energy: ${task.energyLevel} | Focus: ${task.focusType} | Priority: ${task.priority} | Source: ${task.source}`);
                });
            }
            else {
                const tasksWithMetadata = await prisma.task.count({
                    where: {
                        OR: [
                            { energyLevel: { not: null } },
                            { focusType: { not: null } },
                            { source: { not: null } }
                        ]
                    }
                });
                if (tasksWithMetadata === 0) {
                    console.log('✅ Verification passed: All metadata rolled back');
                }
                else {
                    console.warn(`⚠️  Warning: ${tasksWithMetadata} tasks still have metadata`);
                }
            }
        }
        catch (error) {
            console.error('❌ Verification failed:', error);
            throw error;
        }
    }
    printSummary() {
        console.log('─'.repeat(50));
        console.log('📊 Migration Summary');
        console.log(`Mode: ${this.isDryRun ? 'DRY RUN' : this.isRollback ? 'ROLLBACK' : 'LIVE'}`);
        console.log(`Total tasks in database: ${this.stats.totalTasks}`);
        console.log(`Tasks ${this.isRollback ? 'rolled back' : 'updated'}: ${this.stats.tasksUpdated}`);
        console.log(`Tasks skipped: ${this.stats.tasksSkipped}`);
        console.log(`Errors encountered: ${this.stats.errors}`);
        if (this.stats.errors === 0) {
            console.log('✅ Migration completed successfully!');
        }
        else {
            console.log('⚠️  Migration completed with errors. Please review logs.');
        }
        if (this.isDryRun) {
            console.log('ℹ️  This was a dry run. No actual changes were made.');
            console.log('ℹ️  To apply changes, run without --dry-run flag.');
        }
    }
}
exports.TaskMetadataBackfillMigration = TaskMetadataBackfillMigration;
if (require.main === module) {
    const migration = new TaskMetadataBackfillMigration();
    migration.execute().catch(error => {
        console.error('💥 Migration execution failed:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=backfill-task-metadata.js.map