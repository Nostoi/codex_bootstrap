#!/usr/bin/env ts-node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTestTasks = createTestTasks;
if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "postgresql://codex:codex@localhost:5487/codex_bootstrap?schema=public";
}
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function createTestTasks() {
    try {
        console.log('🏗️  Creating test tasks for migration testing...');
        const user = await prisma.user.findFirst();
        if (!user) {
            console.error('❌ No users found. Please run db:seed first.');
            process.exit(1);
        }
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
                projectId: null
            }
        ];
        for (const taskData of testTasks) {
            await prisma.task.create({
                data: {
                    ...taskData,
                    energyLevel: null,
                    focusType: null,
                    source: null,
                    priority: null
                }
            });
        }
        console.log(`✅ Created ${testTasks.length} test tasks without metadata`);
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
    }
    catch (error) {
        console.error('❌ Error creating test tasks:', error);
        process.exit(1);
    }
    finally {
        await prisma.$disconnect();
    }
}
if (require.main === module) {
    createTestTasks();
}
//# sourceMappingURL=create-test-tasks.js.map