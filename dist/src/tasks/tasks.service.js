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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TasksService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let TasksService = class TasksService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(ownerId) {
        const where = {};
        if (ownerId) {
            where.ownerId = ownerId;
        }
        return this.prisma.task.findMany({
            where,
            include: {
                project: {
                    select: { id: true, name: true },
                },
                owner: {
                    select: { id: true, name: true, email: true },
                },
                dependencies: {
                    include: {
                        depends: {
                            select: { id: true, title: true, completed: true },
                        },
                    },
                },
                dependents: {
                    include: {
                        task: {
                            select: { id: true, title: true, completed: true },
                        },
                    },
                },
                tags: true,
            },
            orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
        });
    }
    async findOne(id) {
        const task = await this.prisma.task.findUnique({
            where: { id },
            include: {
                project: {
                    select: { id: true, name: true },
                },
                owner: {
                    select: { id: true, name: true, email: true },
                },
                dependencies: {
                    include: {
                        depends: {
                            select: { id: true, title: true, completed: true },
                        },
                    },
                },
                dependents: {
                    include: {
                        task: {
                            select: { id: true, title: true, completed: true },
                        },
                    },
                },
                tags: true,
            },
        });
        if (!task) {
            throw new common_1.NotFoundException(`Task with ID ${id} not found`);
        }
        return task;
    }
    async create(createTaskDto, ownerId) {
        const data = {
            title: createTaskDto.title,
            description: createTaskDto.description,
            dueDate: createTaskDto.dueDate ? new Date(createTaskDto.dueDate) : null,
            energyLevel: createTaskDto.energyLevel,
            focusType: createTaskDto.focusType,
            estimatedMinutes: createTaskDto.estimatedMinutes,
            priority: createTaskDto.priority ?? 3,
            softDeadline: createTaskDto.softDeadline
                ? new Date(createTaskDto.softDeadline)
                : null,
            hardDeadline: createTaskDto.hardDeadline
                ? new Date(createTaskDto.hardDeadline)
                : null,
            source: createTaskDto.source,
            aiSuggestion: createTaskDto.aiSuggestion,
            owner: { connect: { id: ownerId } },
        };
        if (createTaskDto.projectId) {
            data.project = { connect: { id: createTaskDto.projectId } };
        }
        return this.prisma.task.create({
            data,
            include: {
                project: {
                    select: { id: true, name: true },
                },
                owner: {
                    select: { id: true, name: true, email: true },
                },
            },
        });
    }
    async update(id, updateTaskDto) {
        const existingTask = await this.prisma.task.findUnique({ where: { id } });
        if (!existingTask) {
            throw new common_1.NotFoundException(`Task with ID ${id} not found`);
        }
        const data = {};
        if (updateTaskDto.title !== undefined)
            data.title = updateTaskDto.title;
        if (updateTaskDto.description !== undefined)
            data.description = updateTaskDto.description;
        if (updateTaskDto.completed !== undefined)
            data.completed = updateTaskDto.completed;
        if (updateTaskDto.status !== undefined)
            data.status = updateTaskDto.status;
        if (updateTaskDto.dueDate !== undefined) {
            data.dueDate = updateTaskDto.dueDate
                ? new Date(updateTaskDto.dueDate)
                : null;
        }
        if (updateTaskDto.energyLevel !== undefined)
            data.energyLevel = updateTaskDto.energyLevel;
        if (updateTaskDto.focusType !== undefined)
            data.focusType = updateTaskDto.focusType;
        if (updateTaskDto.estimatedMinutes !== undefined)
            data.estimatedMinutes = updateTaskDto.estimatedMinutes;
        if (updateTaskDto.priority !== undefined)
            data.priority = updateTaskDto.priority;
        if (updateTaskDto.softDeadline !== undefined) {
            data.softDeadline = updateTaskDto.softDeadline
                ? new Date(updateTaskDto.softDeadline)
                : null;
        }
        if (updateTaskDto.hardDeadline !== undefined) {
            data.hardDeadline = updateTaskDto.hardDeadline
                ? new Date(updateTaskDto.hardDeadline)
                : null;
        }
        if (updateTaskDto.source !== undefined)
            data.source = updateTaskDto.source;
        if (updateTaskDto.aiSuggestion !== undefined)
            data.aiSuggestion = updateTaskDto.aiSuggestion;
        if (updateTaskDto.projectId !== undefined) {
            data.project = updateTaskDto.projectId
                ? { connect: { id: updateTaskDto.projectId } }
                : { disconnect: true };
        }
        return this.prisma.task.update({
            where: { id },
            data,
            include: {
                project: {
                    select: { id: true, name: true },
                },
                owner: {
                    select: { id: true, name: true, email: true },
                },
            },
        });
    }
    async remove(id) {
        const existingTask = await this.prisma.task.findUnique({ where: { id } });
        if (!existingTask) {
            throw new common_1.NotFoundException(`Task with ID ${id} not found`);
        }
        await this.prisma.task.delete({ where: { id } });
    }
    async toggle(id) {
        const task = await this.prisma.task.findUnique({ where: { id } });
        if (!task) {
            throw new common_1.NotFoundException(`Task with ID ${id} not found`);
        }
        return this.prisma.task.update({
            where: { id },
            data: { completed: !task.completed },
            include: {
                project: {
                    select: { id: true, name: true },
                },
                owner: {
                    select: { id: true, name: true, email: true },
                },
            },
        });
    }
    async findTaskDependencies(taskId) {
        const task = await this.prisma.task.findUnique({ where: { id: taskId } });
        if (!task) {
            throw new common_1.NotFoundException(`Task with ID ${taskId} not found`);
        }
        return this.prisma.taskDependency.findMany({
            where: { taskId },
            include: {
                depends: {
                    select: { id: true, title: true, completed: true, status: true },
                },
            },
        });
    }
    async createTaskDependency(createDependencyDto) {
        const { taskId, dependsOn } = createDependencyDto;
        const [task, prerequisiteTask] = await Promise.all([
            this.prisma.task.findUnique({ where: { id: taskId } }),
            this.prisma.task.findUnique({ where: { id: dependsOn } }),
        ]);
        if (!task) {
            throw new common_1.NotFoundException(`Task with ID ${taskId} not found`);
        }
        if (!prerequisiteTask) {
            throw new common_1.NotFoundException(`Prerequisite task with ID ${dependsOn} not found`);
        }
        const existingDependencies = await this.prisma.taskDependency.findMany({
            where: { taskId: dependsOn },
        });
        const wouldCreateCircle = await this.checkCircularDependency(dependsOn, taskId, existingDependencies);
        if (wouldCreateCircle) {
            throw new common_1.BadRequestException("Creating this dependency would result in a circular dependency");
        }
        const existingDependency = await this.prisma.taskDependency.findUnique({
            where: {
                taskId_dependsOn: { taskId, dependsOn },
            },
        });
        if (existingDependency) {
            throw new common_1.BadRequestException("Dependency already exists");
        }
        return this.prisma.taskDependency.create({
            data: { taskId, dependsOn },
            include: {
                depends: {
                    select: { id: true, title: true, completed: true, status: true },
                },
            },
        });
    }
    async removeTaskDependency(taskId, dependencyId) {
        const dependency = await this.prisma.taskDependency.findUnique({
            where: { id: dependencyId },
        });
        if (!dependency) {
            throw new common_1.NotFoundException(`Dependency with ID ${dependencyId} not found`);
        }
        if (dependency.taskId !== taskId) {
            throw new common_1.BadRequestException("Dependency does not belong to the specified task");
        }
        await this.prisma.taskDependency.delete({
            where: { id: dependencyId },
        });
    }
    async checkCircularDependency(startTaskId, targetTaskId, dependencies) {
        const visited = new Set();
        const checkCircle = (currentTaskId) => {
            if (currentTaskId === targetTaskId)
                return true;
            if (visited.has(currentTaskId))
                return false;
            visited.add(currentTaskId);
            const taskDependencies = dependencies.filter((dep) => dep.taskId === currentTaskId);
            return taskDependencies.some((dep) => checkCircle(dep.dependsOn));
        };
        return checkCircle(startTaskId);
    }
    async findUserSettings(userId) {
        return this.prisma.userSettings.findUnique({
            where: { userId },
        });
    }
    async createUserSettings(userId, createSettingsDto) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new common_1.NotFoundException(`User with ID ${userId} not found`);
        }
        const existingSettings = await this.prisma.userSettings.findUnique({
            where: { userId },
        });
        if (existingSettings) {
            throw new common_1.BadRequestException("User settings already exist. Use update instead.");
        }
        return this.prisma.userSettings.create({
            data: {
                userId,
                ...createSettingsDto,
            },
        });
    }
    async updateUserSettings(userId, updateSettingsDto) {
        const existingSettings = await this.prisma.userSettings.findUnique({
            where: { userId },
        });
        if (!existingSettings) {
            throw new common_1.NotFoundException(`User settings for user ${userId} not found`);
        }
        return this.prisma.userSettings.update({
            where: { userId },
            data: updateSettingsDto,
        });
    }
    async removeUserSettings(userId) {
        const existingSettings = await this.prisma.userSettings.findUnique({
            where: { userId },
        });
        if (!existingSettings) {
            throw new common_1.NotFoundException(`User settings for user ${userId} not found`);
        }
        await this.prisma.userSettings.delete({
            where: { userId },
        });
    }
};
exports.TasksService = TasksService;
exports.TasksService = TasksService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TasksService);
//# sourceMappingURL=tasks.service.js.map