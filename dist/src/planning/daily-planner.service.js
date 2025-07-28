"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var DailyPlannerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DailyPlannerService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const tasks_service_1 = require("../tasks/tasks.service");
const client_1 = require("@prisma/client");
let DailyPlannerService = DailyPlannerService_1 = class DailyPlannerService {
    constructor(prisma, tasksService) {
        this.prisma = prisma;
        this.tasksService = tasksService;
        this.logger = new common_1.Logger(DailyPlannerService_1.name);
    }
    async generatePlan(userId, date) {
        try {
            this.logger.log(`Generating plan for user ${userId} on ${date.toISOString()}`);
            const input = await this.gatherPlanningData(userId, date);
            const readyTasks = await this.filterReadyTasks(input.availableTasks);
            const scoredTasks = this.scoreTasks(readyTasks, date, input.userSettings);
            const timeSlots = this.generateTimeSlots(date, input.userSettings, input.existingCommitments);
            const assignments = this.assignTasksToSlots(scoredTasks, timeSlots);
            const scheduleBlocks = this.createScheduleBlocks(assignments);
            const optimization = this.calculateOptimizationMetrics(scheduleBlocks, scoredTasks);
            const plan = {
                date,
                scheduleBlocks,
                unscheduledTasks: scoredTasks.filter(t => !assignments.has(t.id)),
                totalEstimatedMinutes: scheduleBlocks.reduce((sum, block) => sum + (block.task.estimatedMinutes || 30), 0),
                ...optimization
            };
            return this.transformToDto(plan);
        }
        catch (error) {
            this.logger.error(`Failed to generate plan: ${error.message}`, error.stack);
            throw new common_1.BadRequestException(`Plan generation failed: ${error.message}`);
        }
    }
    async gatherPlanningData(userId, date) {
        const tasks = await this.tasksService.findAll(userId);
        const availableTasks = tasks.filter(task => task.status !== client_1.TaskStatus.DONE &&
            task.status !== client_1.TaskStatus.BLOCKED);
        let userSettings = await this.prisma.userSettings.findUnique({
            where: { userId }
        });
        if (!userSettings) {
            userSettings = await this.prisma.userSettings.create({
                data: {
                    userId,
                    morningEnergyLevel: client_1.EnergyLevel.HIGH,
                    afternoonEnergyLevel: client_1.EnergyLevel.MEDIUM,
                    workStartTime: "09:00",
                    workEndTime: "17:00",
                    focusSessionLength: 90,
                    preferredFocusTypes: [],
                }
            });
        }
        const workingHours = this.getWorkingHours(date, userSettings);
        const existingCommitments = [];
        return {
            userId,
            date,
            availableTasks,
            userSettings,
            workingHours,
            existingCommitments
        };
    }
    async filterReadyTasks(tasks) {
        const dependencyGraph = await this.buildDependencyGraph(tasks);
        this.detectCircularDependencies(dependencyGraph);
        const readyTasks = [];
        for (const task of tasks) {
            const dependencies = dependencyGraph.edges.get(task.id) || new Set();
            const isReady = Array.from(dependencies).every(depId => {
                const depTask = dependencyGraph.nodes.get(depId);
                return depTask?.status === client_1.TaskStatus.DONE;
            });
            if (isReady) {
                readyTasks.push(task);
            }
        }
        this.logger.log(`Filtered ${readyTasks.length} ready tasks from ${tasks.length} total`);
        return readyTasks;
    }
    async buildDependencyGraph(tasks) {
        const nodes = new Map();
        const edges = new Map();
        const inDegree = new Map();
        for (const task of tasks) {
            nodes.set(task.id, task);
            edges.set(task.id, new Set());
            inDegree.set(task.id, 0);
        }
        for (const task of tasks) {
            const dependencies = await this.tasksService.findTaskDependencies(task.id);
            for (const dep of dependencies) {
                const depTaskId = dep.dependsOn;
                if (nodes.has(depTaskId)) {
                    edges.get(depTaskId)?.add(task.id);
                    inDegree.set(task.id, (inDegree.get(task.id) || 0) + 1);
                }
            }
        }
        return { nodes, edges, inDegree };
    }
    detectCircularDependencies(graph) {
        const visited = new Set();
        const recursionStack = new Set();
        const hasCycle = (nodeId) => {
            if (recursionStack.has(nodeId)) {
                return true;
            }
            if (visited.has(nodeId)) {
                return false;
            }
            visited.add(nodeId);
            recursionStack.add(nodeId);
            const neighbors = graph.edges.get(nodeId) || new Set();
            for (const neighbor of neighbors) {
                if (hasCycle(neighbor)) {
                    return true;
                }
            }
            recursionStack.delete(nodeId);
            return false;
        };
        for (const nodeId of graph.nodes.keys()) {
            if (!visited.has(nodeId) && hasCycle(nodeId)) {
                throw new common_1.BadRequestException(`Circular dependency detected involving task ${nodeId}. Please resolve dependencies manually.`);
            }
        }
    }
    scoreTasks(tasks, targetDate, userSettings) {
        return tasks.map(task => {
            const scores = this.calculateTaskScore(task, targetDate, userSettings);
            return {
                ...task,
                score: scores.total,
                priorityScore: scores.priority,
                deadlineScore: scores.deadline,
                energyScore: scores.energy,
                focusScore: scores.focus
            };
        }).sort((a, b) => b.score - a.score);
    }
    calculateTaskScore(task, targetDate, _userSettings) {
        let priorityScore = 0;
        let deadlineScore = 0;
        let energyScore = 0;
        let focusScore = 0;
        if (task.priority) {
            priorityScore = task.priority * 8;
        }
        if (task.hardDeadline) {
            const daysUntilDeadline = Math.max(0, (task.hardDeadline.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24));
            deadlineScore = Math.max(0, 30 - (daysUntilDeadline * 5));
        }
        const energyBonus = {
            [client_1.EnergyLevel.HIGH]: 20,
            [client_1.EnergyLevel.MEDIUM]: 15,
            [client_1.EnergyLevel.LOW]: 10
        };
        energyScore = energyBonus[task.energyLevel || client_1.EnergyLevel.MEDIUM];
        const focusBonus = {
            [client_1.FocusType.CREATIVE]: 8,
            [client_1.FocusType.TECHNICAL]: 8,
            [client_1.FocusType.ADMINISTRATIVE]: 6,
            [client_1.FocusType.SOCIAL]: 10
        };
        focusScore = focusBonus[task.focusType || client_1.FocusType.ADMINISTRATIVE];
        const total = priorityScore + deadlineScore + energyScore + focusScore;
        return {
            total,
            priority: priorityScore,
            deadline: deadlineScore,
            energy: energyScore,
            focus: focusScore
        };
    }
    generateTimeSlots(date, userSettings, commitments) {
        const slots = [];
        const startHour = 9;
        const endHour = 17;
        const slotDuration = userSettings.focusSessionLength || 90;
        let currentTime = new Date(date);
        currentTime.setHours(startHour, 0, 0, 0);
        const endTime = new Date(date);
        endTime.setHours(endHour, 0, 0, 0);
        while (currentTime < endTime) {
            const slotEnd = new Date(currentTime.getTime() + slotDuration * 60000);
            if (slotEnd <= endTime) {
                const energyLevel = this.getEnergyLevelForTime(currentTime, userSettings);
                const preferredFocusTypes = this.getPreferredFocusTypes(energyLevel);
                slots.push({
                    startTime: new Date(currentTime),
                    endTime: slotEnd,
                    energyLevel,
                    preferredFocusTypes,
                    isAvailable: !this.hasConflictWithCommitments(currentTime, slotEnd, commitments)
                });
            }
            currentTime = new Date(slotEnd.getTime() + 15 * 60000);
        }
        return slots.filter(slot => slot.isAvailable);
    }
    getEnergyLevelForTime(time, userSettings) {
        const hour = time.getHours();
        if (hour < 12) {
            return userSettings.morningEnergyLevel || client_1.EnergyLevel.HIGH;
        }
        else if (hour < 17) {
            return userSettings.afternoonEnergyLevel || client_1.EnergyLevel.MEDIUM;
        }
        else {
            return client_1.EnergyLevel.LOW;
        }
    }
    getPreferredFocusTypes(energyLevel) {
        switch (energyLevel) {
            case client_1.EnergyLevel.HIGH:
                return [client_1.FocusType.CREATIVE, client_1.FocusType.TECHNICAL];
            case client_1.EnergyLevel.MEDIUM:
                return [client_1.FocusType.TECHNICAL, client_1.FocusType.ADMINISTRATIVE];
            case client_1.EnergyLevel.LOW:
                return [client_1.FocusType.ADMINISTRATIVE, client_1.FocusType.SOCIAL];
            default:
                return [client_1.FocusType.ADMINISTRATIVE];
        }
    }
    hasConflictWithCommitments(start, end, commitments) {
        return commitments.some(commitment => (start < commitment.endTime && end > commitment.startTime));
    }
    getWorkingHours(date, _userSettings) {
        const startTime = new Date(date);
        startTime.setHours(9, 0, 0, 0);
        const endTime = new Date(date);
        endTime.setHours(17, 0, 0, 0);
        return [{
                startTime,
                endTime,
                energyLevel: client_1.EnergyLevel.MEDIUM,
                preferredFocusTypes: [client_1.FocusType.ADMINISTRATIVE],
                isAvailable: true
            }];
    }
    assignTasksToSlots(tasks, slots) {
        const assignments = new Map();
        const usedSlots = new Set();
        for (const task of tasks) {
            const bestSlotIndex = this.findBestSlotForTask(task, slots, usedSlots);
            if (bestSlotIndex !== -1) {
                const slot = slots[bestSlotIndex];
                const energyMatch = this.calculateEnergyMatch(task, slot);
                const focusMatch = this.calculateFocusMatch(task, slot);
                assignments.set(task.id, {
                    task,
                    timeSlot: slot,
                    energyMatch,
                    focusMatch,
                    reasoning: this.generateSchedulingReasoning(task, slot, energyMatch, focusMatch)
                });
                usedSlots.add(bestSlotIndex);
            }
        }
        return assignments;
    }
    findBestSlotForTask(task, slots, usedSlots) {
        let bestSlotIndex = -1;
        let bestScore = -1;
        for (let i = 0; i < slots.length; i++) {
            if (usedSlots.has(i))
                continue;
            const slot = slots[i];
            const energyMatch = this.calculateEnergyMatch(task, slot);
            const focusMatch = this.calculateFocusMatch(task, slot);
            const durationFit = this.calculateDurationFit(task, slot);
            const score = (energyMatch * 0.4) + (focusMatch * 0.3) + (durationFit * 0.3);
            if (score > bestScore) {
                bestScore = score;
                bestSlotIndex = i;
            }
        }
        return bestSlotIndex;
    }
    calculateEnergyMatch(task, slot) {
        if (!task.energyLevel)
            return 0.5;
        return task.energyLevel === slot.energyLevel ? 1.0 : 0.3;
    }
    calculateFocusMatch(task, slot) {
        if (!task.focusType)
            return 0.5;
        return slot.preferredFocusTypes.includes(task.focusType) ? 1.0 : 0.4;
    }
    calculateDurationFit(task, slot) {
        const taskDuration = task.estimatedMinutes || 30;
        const slotDuration = (slot.endTime.getTime() - slot.startTime.getTime()) / (1000 * 60);
        if (taskDuration <= slotDuration) {
            return 1.0;
        }
        else {
            return Math.max(0, 1 - ((taskDuration - slotDuration) / slotDuration));
        }
    }
    generateSchedulingReasoning(task, slot, energyMatch, focusMatch) {
        const reasons = [];
        if (energyMatch > 0.8) {
            reasons.push(`energy level matches (${task.energyLevel})`);
        }
        if (focusMatch > 0.8) {
            reasons.push(`focus type aligns (${task.focusType})`);
        }
        if (task.hardDeadline) {
            reasons.push('deadline consideration');
        }
        if (task.priority && task.priority > 3) {
            reasons.push('high priority');
        }
        return reasons.length > 0
            ? `Scheduled due to: ${reasons.join(', ')}`
            : 'Best available slot';
    }
    createScheduleBlocks(assignments) {
        const blocks = [];
        for (const assignment of assignments.values()) {
            blocks.push({
                startTime: assignment.timeSlot.startTime,
                endTime: assignment.timeSlot.endTime,
                task: assignment.task,
                energyMatch: assignment.energyMatch,
                focusMatch: assignment.focusMatch,
                reasoning: assignment.reasoning
            });
        }
        return blocks.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    }
    calculateOptimizationMetrics(blocks, allTasks) {
        if (blocks.length === 0) {
            return {
                energyOptimization: 0,
                focusOptimization: 0,
                deadlineRisk: 0
            };
        }
        const energyOptimization = blocks.reduce((sum, block) => sum + block.energyMatch, 0) / blocks.length;
        const focusOptimization = blocks.reduce((sum, block) => sum + block.focusMatch, 0) / blocks.length;
        const deadlineTasks = allTasks.filter(t => t.hardDeadline && t.priority && t.priority > 3);
        const scheduledDeadlineTasks = blocks.filter(b => b.task.hardDeadline && b.task.priority && b.task.priority > 3).length;
        const deadlineRisk = deadlineTasks.length > 0
            ? 1 - (scheduledDeadlineTasks / deadlineTasks.length)
            : 0;
        return {
            energyOptimization,
            focusOptimization,
            deadlineRisk
        };
    }
    transformToDto(plan) {
        return {
            date: plan.date.toISOString().split('T')[0],
            scheduleBlocks: plan.scheduleBlocks.map(block => ({
                startTime: block.startTime.toISOString(),
                endTime: block.endTime.toISOString(),
                task: {
                    id: block.task.id,
                    title: block.task.title,
                    description: block.task.description,
                    energyLevel: block.task.energyLevel,
                    focusType: block.task.focusType,
                    estimatedMinutes: block.task.estimatedMinutes,
                    priority: block.task.priority,
                    hardDeadline: block.task.hardDeadline?.toISOString()
                },
                energyMatch: block.energyMatch,
                focusMatch: block.focusMatch,
                reasoning: block.reasoning
            })),
            unscheduledTasks: plan.unscheduledTasks.map(task => ({
                id: task.id,
                title: task.title,
                description: task.description,
                energyLevel: task.energyLevel,
                focusType: task.focusType,
                estimatedMinutes: task.estimatedMinutes,
                priority: task.priority,
                hardDeadline: task.hardDeadline?.toISOString()
            })),
            totalEstimatedMinutes: plan.totalEstimatedMinutes,
            energyOptimization: plan.energyOptimization,
            focusOptimization: plan.focusOptimization,
            deadlineRisk: plan.deadlineRisk
        };
    }
};
exports.DailyPlannerService = DailyPlannerService;
exports.DailyPlannerService = DailyPlannerService = DailyPlannerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        tasks_service_1.TasksService])
], DailyPlannerService);
//# sourceMappingURL=daily-planner.service.js.map