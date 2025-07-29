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
const google_service_1 = require("../integrations/google/google.service");
const client_1 = require("@prisma/client");
let DailyPlannerService = DailyPlannerService_1 = class DailyPlannerService {
    constructor(prisma, tasksService, googleService) {
        this.prisma = prisma;
        this.tasksService = tasksService;
        this.googleService = googleService;
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
                unscheduledTasks: scoredTasks.filter((t) => !assignments.has(t.id)),
                totalEstimatedMinutes: scheduleBlocks.reduce((sum, block) => sum + (block.task.estimatedMinutes || 30), 0),
                ...optimization,
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
        const availableTasks = tasks.filter((task) => task.status !== client_1.TaskStatus.DONE && task.status !== client_1.TaskStatus.BLOCKED);
        let userSettings = await this.prisma.userSettings.findUnique({
            where: { userId },
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
                },
            });
        }
        const workingHours = this.getWorkingHours(date, userSettings);
        const existingCommitments = await this.getExistingCommitments(userId, date);
        return {
            userId,
            date,
            availableTasks,
            userSettings,
            workingHours,
            existingCommitments,
        };
    }
    async filterReadyTasks(tasks) {
        const dependencyGraph = await this.buildDependencyGraph(tasks);
        this.detectCircularDependencies(dependencyGraph);
        const readyTasks = [];
        for (const task of tasks) {
            const dependencies = dependencyGraph.edges.get(task.id) || new Set();
            const isReady = Array.from(dependencies).every((depId) => {
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
    async resolveTaskDependencies(tasks) {
        try {
            this.logger.log(`Resolving dependencies for ${tasks.length} tasks`);
            const dependencyGraph = await this.buildDependencyGraph(tasks);
            try {
                this.detectCircularDependencies(dependencyGraph);
            }
            catch (error) {
                return this.handleCircularDependencyError(tasks, error.message);
            }
            const readyTasks = [];
            const blockedTasks = [];
            for (const task of tasks) {
                const blockingReasons = await this.getTaskBlockingReasons(task, dependencyGraph);
                if (blockingReasons.length === 0) {
                    readyTasks.push(task);
                }
                else {
                    blockedTasks.push({
                        task,
                        reasons: blockingReasons,
                    });
                }
            }
            const result = {
                readyTasks,
                blockedTasks,
                totalTasks: tasks.length,
                readyCount: readyTasks.length,
                blockedCount: blockedTasks.length,
            };
            this.logger.log(`Dependency resolution complete: ${result.readyCount} ready, ${result.blockedCount} blocked`);
            return result;
        }
        catch (error) {
            this.logger.error(`Failed to resolve task dependencies: ${error.message}`, error.stack);
            throw new common_1.BadRequestException(`Dependency resolution failed: ${error.message}`);
        }
    }
    async getTaskBlockingReasons(task, dependencyGraph) {
        const reasons = [];
        try {
            const dependencies = await this.tasksService.findTaskDependencies(task.id);
            for (const dep of dependencies) {
                const dependencyTaskId = dep.dependsOn;
                const dependencyTask = dependencyGraph.nodes.get(dependencyTaskId);
                if (!dependencyTask) {
                    reasons.push({
                        type: "orphaned_dependency",
                        message: `Task depends on non-existent task ${dependencyTaskId}`,
                        dependencyTaskId,
                    });
                }
                else if (dependencyTask.status !== client_1.TaskStatus.DONE) {
                    reasons.push({
                        type: "incomplete_dependency",
                        message: `Task depends on incomplete task "${dependencyTask.title}" (${dependencyTask.status})`,
                        dependencyTaskId,
                    });
                }
            }
            return reasons;
        }
        catch (error) {
            this.logger.error(`Failed to get blocking reasons for task ${task.id}: ${error.message}`);
            reasons.push({
                type: "missing_dependency",
                message: `Unable to verify dependencies: ${error.message}`,
            });
            return reasons;
        }
    }
    handleCircularDependencyError(tasks, errorMessage) {
        const blockedTasks = tasks.map((task) => ({
            task,
            reasons: [
                {
                    type: "circular_dependency",
                    message: errorMessage,
                },
            ],
        }));
        return {
            readyTasks: [],
            blockedTasks,
            totalTasks: tasks.length,
            readyCount: 0,
            blockedCount: tasks.length,
        };
    }
    scoreTasks(tasks, targetDate, userSettings) {
        return tasks
            .map((task) => {
            const scores = this.calculateTaskScore(task, targetDate, userSettings);
            return {
                ...task,
                score: scores.total,
                priorityScore: scores.priority,
                deadlineScore: scores.deadline,
                energyScore: scores.energy,
                focusScore: scores.focus,
            };
        })
            .sort((a, b) => b.score - a.score);
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
            const daysUntilDeadline = Math.max(0, (task.hardDeadline.getTime() - targetDate.getTime()) /
                (1000 * 60 * 60 * 24));
            deadlineScore = Math.max(0, 30 - daysUntilDeadline * 5);
        }
        const energyBonus = {
            [client_1.EnergyLevel.HIGH]: 20,
            [client_1.EnergyLevel.MEDIUM]: 15,
            [client_1.EnergyLevel.LOW]: 10,
        };
        energyScore = energyBonus[task.energyLevel || client_1.EnergyLevel.MEDIUM];
        const focusBonus = {
            [client_1.FocusType.CREATIVE]: 8,
            [client_1.FocusType.TECHNICAL]: 8,
            [client_1.FocusType.ADMINISTRATIVE]: 6,
            [client_1.FocusType.SOCIAL]: 10,
        };
        focusScore = focusBonus[task.focusType || client_1.FocusType.ADMINISTRATIVE];
        const total = priorityScore + deadlineScore + energyScore + focusScore;
        return {
            total,
            priority: priorityScore,
            deadline: deadlineScore,
            energy: energyScore,
            focus: focusScore,
        };
    }
    generateTimeSlots(date, userSettings, commitments) {
        const slots = [];
        const { hour: startHour, minute: startMinute } = this.parseWorkTime(userSettings.workStartTime || "09:00");
        const { hour: endHour, minute: endMinute } = this.parseWorkTime(userSettings.workEndTime || "17:00");
        const slotDuration = userSettings.focusSessionLength || 90;
        const breakDuration = this.calculateBreakDuration(slotDuration);
        let currentTime = new Date(date);
        currentTime.setHours(startHour, startMinute, 0, 0);
        const endTime = new Date(date);
        endTime.setHours(endHour, endMinute, 0, 0);
        this.logger.log(`Generating time slots from ${currentTime.toISOString()} to ${endTime.toISOString()}`);
        while (currentTime < endTime) {
            const slotEnd = new Date(currentTime.getTime() + slotDuration * 60000);
            if (slotEnd <= endTime) {
                const energyLevel = this.getEnhancedEnergyLevelForTime(currentTime, userSettings);
                const preferredFocusTypes = this.getOptimizedFocusTypes(energyLevel, currentTime);
                const slot = {
                    startTime: new Date(currentTime),
                    endTime: slotEnd,
                    energyLevel,
                    preferredFocusTypes,
                    isAvailable: !this.hasConflictWithCommitments(currentTime, slotEnd, commitments),
                };
                slots.push(slot);
            }
            currentTime = new Date(slotEnd.getTime() + breakDuration * 60000);
        }
        const availableSlots = slots.filter((slot) => slot.isAvailable);
        this.logger.log(`Generated ${slots.length} total slots, ${availableSlots.length} available`);
        return availableSlots;
    }
    parseWorkTime(timeString) {
        try {
            const [hourStr, minuteStr] = timeString.split(":");
            const hour = parseInt(hourStr, 10);
            const minute = parseInt(minuteStr, 10);
            if (isNaN(hour) ||
                isNaN(minute) ||
                hour < 0 ||
                hour > 23 ||
                minute < 0 ||
                minute > 59) {
                this.logger.warn(`Invalid time format: ${timeString}, using defaults`);
                return { hour: 9, minute: 0 };
            }
            return { hour, minute };
        }
        catch (error) {
            this.logger.warn(`Failed to parse time ${timeString}: ${error.message}, using defaults`);
            return { hour: 9, minute: 0 };
        }
    }
    calculateBreakDuration(sessionLength) {
        if (sessionLength <= 60)
            return 10;
        if (sessionLength <= 90)
            return 15;
        if (sessionLength <= 120)
            return 20;
        return 25;
    }
    getEnhancedEnergyLevelForTime(time, userSettings) {
        const hour = time.getHours();
        const minute = time.getMinutes();
        const timeInMinutes = hour * 60 + minute;
        const morningEnergy = userSettings.morningEnergyLevel || client_1.EnergyLevel.HIGH;
        const afternoonEnergy = userSettings.afternoonEnergyLevel || client_1.EnergyLevel.MEDIUM;
        if (timeInMinutes < 8 * 60) {
            return this.adjustEnergyForEarlyMorning(morningEnergy);
        }
        if (timeInMinutes < 11 * 60) {
            return morningEnergy;
        }
        if (timeInMinutes < 12 * 60) {
            return this.decreaseEnergyLevel(morningEnergy);
        }
        if (timeInMinutes < 13 * 60) {
            return client_1.EnergyLevel.LOW;
        }
        if (timeInMinutes < 14 * 60) {
            return this.adjustEnergyForPostLunch(afternoonEnergy);
        }
        if (timeInMinutes < 16 * 60) {
            return afternoonEnergy;
        }
        if (timeInMinutes < 18 * 60) {
            return this.decreaseEnergyLevel(afternoonEnergy);
        }
        return client_1.EnergyLevel.LOW;
    }
    getOptimizedFocusTypes(energyLevel, time) {
        const hour = time.getHours();
        switch (energyLevel) {
            case client_1.EnergyLevel.HIGH:
                if (hour < 11) {
                    return [client_1.FocusType.CREATIVE, client_1.FocusType.TECHNICAL];
                }
                return [client_1.FocusType.TECHNICAL, client_1.FocusType.CREATIVE];
            case client_1.EnergyLevel.MEDIUM:
                if (hour < 15) {
                    return [client_1.FocusType.TECHNICAL, client_1.FocusType.ADMINISTRATIVE];
                }
                return [client_1.FocusType.ADMINISTRATIVE, client_1.FocusType.TECHNICAL];
            case client_1.EnergyLevel.LOW:
                if (hour >= 16) {
                    return [client_1.FocusType.SOCIAL, client_1.FocusType.ADMINISTRATIVE];
                }
                return [client_1.FocusType.ADMINISTRATIVE, client_1.FocusType.SOCIAL];
            default:
                return [client_1.FocusType.ADMINISTRATIVE];
        }
    }
    adjustEnergyForEarlyMorning(baseEnergy) {
        switch (baseEnergy) {
            case client_1.EnergyLevel.HIGH:
                return client_1.EnergyLevel.MEDIUM;
            case client_1.EnergyLevel.MEDIUM:
                return client_1.EnergyLevel.LOW;
            case client_1.EnergyLevel.LOW:
                return client_1.EnergyLevel.LOW;
            default:
                return client_1.EnergyLevel.LOW;
        }
    }
    adjustEnergyForPostLunch(baseEnergy) {
        switch (baseEnergy) {
            case client_1.EnergyLevel.HIGH:
                return client_1.EnergyLevel.MEDIUM;
            case client_1.EnergyLevel.MEDIUM:
                return client_1.EnergyLevel.LOW;
            case client_1.EnergyLevel.LOW:
                return client_1.EnergyLevel.LOW;
            default:
                return client_1.EnergyLevel.LOW;
        }
    }
    decreaseEnergyLevel(currentLevel) {
        switch (currentLevel) {
            case client_1.EnergyLevel.HIGH:
                return client_1.EnergyLevel.MEDIUM;
            case client_1.EnergyLevel.MEDIUM:
                return client_1.EnergyLevel.LOW;
            case client_1.EnergyLevel.LOW:
                return client_1.EnergyLevel.LOW;
            default:
                return client_1.EnergyLevel.LOW;
        }
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
        return commitments.some((commitment) => start < commitment.endTime && end > commitment.startTime);
    }
    getWorkingHours(date, _userSettings) {
        const startTime = new Date(date);
        startTime.setHours(9, 0, 0, 0);
        const endTime = new Date(date);
        endTime.setHours(17, 0, 0, 0);
        return [
            {
                startTime,
                endTime,
                energyLevel: client_1.EnergyLevel.MEDIUM,
                preferredFocusTypes: [client_1.FocusType.ADMINISTRATIVE],
                isAvailable: true,
            },
        ];
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
                    reasoning: this.generateSchedulingReasoning(task, slot, energyMatch, focusMatch),
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
            const score = energyMatch * 0.4 + focusMatch * 0.3 + durationFit * 0.3;
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
            return Math.max(0, 1 - (taskDuration - slotDuration) / slotDuration);
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
            reasons.push("deadline consideration");
        }
        if (task.priority && task.priority > 3) {
            reasons.push("high priority");
        }
        return reasons.length > 0
            ? `Scheduled due to: ${reasons.join(", ")}`
            : "Best available slot";
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
                reasoning: assignment.reasoning,
            });
        }
        return blocks.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    }
    calculateOptimizationMetrics(blocks, allTasks) {
        if (blocks.length === 0) {
            return {
                energyOptimization: 0,
                focusOptimization: 0,
                deadlineRisk: 0,
            };
        }
        const energyOptimization = blocks.reduce((sum, block) => sum + block.energyMatch, 0) / blocks.length;
        const focusOptimization = blocks.reduce((sum, block) => sum + block.focusMatch, 0) / blocks.length;
        const deadlineTasks = allTasks.filter((t) => t.hardDeadline && t.priority && t.priority > 3);
        const scheduledDeadlineTasks = blocks.filter((b) => b.task.hardDeadline && b.task.priority && b.task.priority > 3).length;
        const deadlineRisk = deadlineTasks.length > 0
            ? 1 - scheduledDeadlineTasks / deadlineTasks.length
            : 0;
        return {
            energyOptimization,
            focusOptimization,
            deadlineRisk,
        };
    }
    transformToDto(plan) {
        return {
            date: plan.date.toISOString().split("T")[0],
            scheduleBlocks: plan.scheduleBlocks.map((block) => ({
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
                    hardDeadline: block.task.hardDeadline?.toISOString(),
                },
                energyMatch: block.energyMatch,
                focusMatch: block.focusMatch,
                reasoning: block.reasoning,
            })),
            unscheduledTasks: plan.unscheduledTasks.map((task) => ({
                id: task.id,
                title: task.title,
                description: task.description,
                energyLevel: task.energyLevel,
                focusType: task.focusType,
                estimatedMinutes: task.estimatedMinutes,
                priority: task.priority,
                hardDeadline: task.hardDeadline?.toISOString(),
            })),
            totalEstimatedMinutes: plan.totalEstimatedMinutes,
            energyOptimization: plan.energyOptimization,
            focusOptimization: plan.focusOptimization,
            deadlineRisk: plan.deadlineRisk,
        };
    }
    async getExistingCommitments(userId, date) {
        const startTime = performance.now();
        try {
            this.logger.debug(`Starting calendar integration for user ${userId} on ${date.toISOString()}`);
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            const calendarResponse = await this.getCalendarEventsWithRetry(userId, "primary", startOfDay, endOfDay);
            const responseTime = performance.now() - startTime;
            this.logger.log(`Calendar API response received in ${responseTime.toFixed(2)}ms for user ${userId}`);
            if (!calendarResponse?.items) {
                this.logger.debug(`No calendar events found for user ${userId} on ${date.toISOString()}`);
                return [];
            }
            const timeSlots = [];
            let parseSuccessCount = 0;
            let parseFailureCount = 0;
            for (const event of calendarResponse.items) {
                try {
                    const timeSlot = this.parseCalendarEventToTimeSlot(event);
                    if (timeSlot) {
                        timeSlots.push(timeSlot);
                        parseSuccessCount++;
                    }
                }
                catch (error) {
                    parseFailureCount++;
                    this.logger.warn(`Failed to parse calendar event ${event.id || 'unknown'}: ${error.message}`, {
                        userId,
                        eventId: event.id,
                        eventSummary: event.summary,
                        errorType: error.constructor.name,
                    });
                    continue;
                }
            }
            const totalTime = performance.now() - startTime;
            this.logger.log(`Calendar integration completed for user ${userId}: ${parseSuccessCount} events parsed, ${parseFailureCount} failed, total time ${totalTime.toFixed(2)}ms`, {
                userId,
                date: date.toISOString(),
                totalEvents: calendarResponse.items.length,
                successfullyParsed: parseSuccessCount,
                parseFailures: parseFailureCount,
                responseTimeMs: totalTime,
            });
            return timeSlots;
        }
        catch (error) {
            const totalTime = performance.now() - startTime;
            const errorDetails = this.categorizeCalendarError(error);
            this.logger.error(`Calendar integration failed for user ${userId}: ${errorDetails.message}`, {
                userId,
                date: date.toISOString(),
                errorType: errorDetails.type,
                errorCode: errorDetails.code,
                retryable: errorDetails.retryable,
                timeElapsed: totalTime,
                originalError: error.message,
            });
            return [];
        }
    }
    async getCalendarEventsWithRetry(userId, calendarId, timeMin, timeMax, maxRetries = 3) {
        let lastError;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                this.logger.debug(`Calendar API attempt ${attempt}/${maxRetries} for user ${userId}`);
                const response = await this.googleService.getCalendarEvents(userId, calendarId, timeMin, timeMax);
                if (attempt > 1) {
                    this.logger.log(`Calendar API succeeded on retry attempt ${attempt} for user ${userId}`);
                }
                return response;
            }
            catch (error) {
                lastError = error;
                const errorDetails = this.categorizeCalendarError(error);
                this.logger.warn(`Calendar API attempt ${attempt}/${maxRetries} failed for user ${userId}: ${errorDetails.message}`, {
                    userId,
                    attempt,
                    maxRetries,
                    errorType: errorDetails.type,
                    errorCode: errorDetails.code,
                    retryable: errorDetails.retryable,
                });
                if (!errorDetails.retryable) {
                    this.logger.error(`Non-retryable error encountered, aborting retry attempts for user ${userId}`, {
                        userId,
                        errorType: errorDetails.type,
                        errorCode: errorDetails.code,
                    });
                    throw error;
                }
                if (attempt < maxRetries) {
                    const delayMs = this.calculateRetryDelay(attempt);
                    this.logger.debug(`Waiting ${delayMs}ms before retry attempt ${attempt + 1} for user ${userId}`);
                    await this.sleep(delayMs);
                }
            }
        }
        this.logger.error(`All ${maxRetries} calendar API attempts failed for user ${userId}`, {
            userId,
            maxRetries,
            finalError: lastError.message,
        });
        throw lastError;
    }
    categorizeCalendarError(error) {
        if (error.response?.data?.error) {
            const googleError = error.response.data.error;
            const code = googleError.code || error.response.status;
            switch (code) {
                case 401:
                    return {
                        type: 'AUTH_EXPIRED',
                        code,
                        message: 'Authentication token expired or invalid',
                        retryable: false,
                    };
                case 403:
                    return {
                        type: 'PERMISSION_DENIED',
                        code,
                        message: 'Insufficient permissions to access calendar',
                        retryable: false,
                    };
                case 429:
                    return {
                        type: 'RATE_LIMITED',
                        code,
                        message: 'Google Calendar API rate limit exceeded',
                        retryable: true,
                    };
                case 500:
                case 502:
                case 503:
                case 504:
                    return {
                        type: 'SERVER_ERROR',
                        code,
                        message: 'Google Calendar API server error',
                        retryable: true,
                    };
                default:
                    return {
                        type: 'API_ERROR',
                        code,
                        message: googleError.message || 'Unknown Google Calendar API error',
                        retryable: false,
                    };
            }
        }
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            return {
                type: 'NETWORK_ERROR',
                code: error.code,
                message: 'Network connectivity issue',
                retryable: true,
            };
        }
        if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
            return {
                type: 'TIMEOUT',
                code: error.code || 'TIMEOUT',
                message: 'Request timeout',
                retryable: true,
            };
        }
        if (error.message?.includes('integration not configured')) {
            return {
                type: 'INTEGRATION_NOT_CONFIGURED',
                code: 'CONFIG_ERROR',
                message: 'Google Calendar integration not configured for user',
                retryable: false,
            };
        }
        return {
            type: 'UNKNOWN_ERROR',
            code: error.code || 'UNKNOWN',
            message: error.message || 'Unknown calendar integration error',
            retryable: false,
        };
    }
    calculateRetryDelay(attempt) {
        const baseDelay = Math.pow(2, attempt - 1) * 1000;
        const jitter = Math.random() * 500;
        return Math.min(baseDelay + jitter, 10000);
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    parseCalendarEventToTimeSlot(event) {
        if (!event.start || !event.end) {
            throw new Error("Event missing start or end time");
        }
        let startTime;
        let endTime;
        if (event.start.date && event.end.date) {
            startTime = new Date(event.start.date);
            startTime.setHours(0, 0, 0, 0);
            endTime = new Date(event.end.date);
            endTime.setHours(23, 59, 59, 999);
        }
        else if (event.start.dateTime && event.end.dateTime) {
            startTime = new Date(event.start.dateTime);
            endTime = new Date(event.end.dateTime);
        }
        else {
            throw new Error("Event has invalid date/time format");
        }
        if (startTime >= endTime) {
            throw new Error("Event end time must be after start time");
        }
        const energyLevel = this.inferEnergyLevel(event);
        const preferredFocusTypes = this.inferPreferredFocusTypes(event);
        return {
            startTime,
            endTime,
            energyLevel,
            preferredFocusTypes,
            isAvailable: false,
        };
    }
    inferEnergyLevel(event) {
        const summary = (event.summary || "").toLowerCase();
        const attendeeCount = event.attendees?.length || 0;
        if (summary.includes("focus") ||
            summary.includes("deep work") ||
            summary.includes("coding") ||
            summary.includes("development") ||
            attendeeCount === 0) {
            return client_1.EnergyLevel.HIGH;
        }
        if (attendeeCount > 8 ||
            summary.includes("all hands") ||
            summary.includes("town hall") ||
            summary.includes("large meeting") ||
            summary.includes("presentation")) {
            return client_1.EnergyLevel.LOW;
        }
        return client_1.EnergyLevel.MEDIUM;
    }
    inferPreferredFocusTypes(event) {
        const summary = (event.summary || "").toLowerCase();
        const description = (event.description || "").toLowerCase();
        const content = `${summary} ${description}`;
        const focusTypes = [];
        if (content.match(/\b(code|tech|review|development|engineering|system|architecture|debug|api)\b/)) {
            focusTypes.push(client_1.FocusType.TECHNICAL);
        }
        if (content.match(/\b(design|creative|brainstorm|ideation|workshop|innovation|strategy)\b/)) {
            focusTypes.push(client_1.FocusType.CREATIVE);
        }
        if (content.match(/\b(admin|expense|report|compliance|hr|legal|budget|planning)\b/)) {
            focusTypes.push(client_1.FocusType.ADMINISTRATIVE);
        }
        if (event.attendees?.length > 0 ||
            content.match(/\b(meeting|standup|sync|1:1|one-on-one|team)\b/)) {
            focusTypes.push(client_1.FocusType.SOCIAL);
        }
        if (focusTypes.length === 0 && event.attendees?.length > 0) {
            focusTypes.push(client_1.FocusType.SOCIAL);
        }
        if (focusTypes.length === 0) {
            focusTypes.push(client_1.FocusType.TECHNICAL);
        }
        return focusTypes;
    }
};
exports.DailyPlannerService = DailyPlannerService;
exports.DailyPlannerService = DailyPlannerService = DailyPlannerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        tasks_service_1.TasksService,
        google_service_1.GoogleService])
], DailyPlannerService);
//# sourceMappingURL=daily-planner.service.js.map