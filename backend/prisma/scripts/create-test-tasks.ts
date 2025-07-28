#!/usr/bin/env ts-node

/**
 * Test data setup for migration testing
 * Creates tasks with missing metadata to test the backfill migration
 */

// Ensure DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "postgresql://codex:codex@localhost:5487/codex_bootstrap?schema=public";
}

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestTasks() {
  try {
    console.log('🏗️  Creating test tasks for migration testing...');

    // Get a user to assign tasks to
    const user = await prisma.user.findFirst();
    
    if (!user) {
      console.error('❌ No users found. Please run db:seed first.');
      process.exit(1);
    }

    // Create a project
    const project = await prisma.project.upsert({
      where: { id: 'test-project-1' },
      update: {},
      create: {
        id: 'test-project-1',
        name: 'Test Project for Migration',
        description: 'A project to test task metadata migration',
        ownerId: user.id
      }
    });

    // Create tasks without metadata (using raw SQL to bypass defaults)
    const testTasks = [
      {
        title: 'Review code changes',
        description: 'Review the recent pull request changes',
        completed: false,
        ownerId: user.id,
        projectId: project.id
      },
      {
        title: 'Update documentation',
        description: 'Update the API documentation with new endpoints',
        completed: false,
        ownerId: user.id,
        projectId: project.id
      },
      {
        title: 'Fix UI bug',
        description: 'Fix the layout issue on mobile devices',
        completed: true,
        ownerId: user.id,
        projectId: project.id
      },
      {
        title: 'Write unit tests',
        description: 'Add comprehensive unit tests for the new features',
        completed: false,
        ownerId: user.id,
        projectId: null // No project assigned
      }
    ];

    for (const taskData of testTasks) {
      await prisma.task.create({
        data: {
          ...taskData,
          // Explicitly setting metadata fields to null to test migration
          energyLevel: null,
          focusType: null,
          source: null,
          priority: null
        }
      });
    }

    console.log(`✅ Created ${testTasks.length} test tasks without metadata`);
    
    // Verify created tasks
    const tasksCount = await prisma.task.count();
    const tasksWithoutMetadata = await prisma.task.count({
      where: {
        OR: [
          { energyLevel: null },
          { focusType: null },
          { source: null },
          { priority: null }
        ]
      }
    });

    console.log(`📊 Total tasks: ${tasksCount}`);
    console.log(`🎯 Tasks without metadata: ${tasksWithoutMetadata}`);
    console.log('🚀 Ready for migration testing!');

  } catch (error) {
    console.error('❌ Error creating test tasks:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  createTestTasks();
}

export { createTestTasks };
