import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Task, TaskDependency, UserSettings, Prisma } from '@prisma/client';
import {
  CreateTaskDto,
  UpdateTaskDto,
  CreateTaskDependencyDto,
  CreateUserSettingsDto,
  UpdateUserSettingsDto,
} from './dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService: NotificationsService
  ) {}

  async findAll(ownerId?: string): Promise<Task[]> {
    const where: Prisma.TaskWhereInput = {};
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
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(id: string): Promise<Task> {
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
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return task;
  }

  async create(createTaskDto: CreateTaskDto, ownerId: string): Promise<Task> {
    const data: Prisma.TaskCreateInput = {
      title: createTaskDto.title,
      description: createTaskDto.description,
      dueDate: createTaskDto.dueDate ? new Date(createTaskDto.dueDate) : null,
      energyLevel: createTaskDto.energyLevel,
      focusType: createTaskDto.focusType,
      estimatedMinutes: createTaskDto.estimatedMinutes,
      priority: createTaskDto.priority ?? 3,
      softDeadline: createTaskDto.softDeadline ? new Date(createTaskDto.softDeadline) : null,
      hardDeadline: createTaskDto.hardDeadline ? new Date(createTaskDto.hardDeadline) : null,
      source: createTaskDto.source,
      aiSuggestion: createTaskDto.aiSuggestion,
      owner: { connect: { id: ownerId } },
    };

    if (createTaskDto.projectId) {
      data.project = { connect: { id: createTaskDto.projectId } };
    }

    const task = await this.prisma.task.create({
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

    // Send real-time notification for task creation
    await this.notificationsService.notifyTaskCreated(ownerId, {
      id: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      updatedBy: ownerId,
    });

    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, updatedBy?: string): Promise<Task> {
    const existingTask = await this.prisma.task.findUnique({ where: { id } });
    if (!existingTask) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    const data: Prisma.TaskUpdateInput = {};

    if (updateTaskDto.title !== undefined) data.title = updateTaskDto.title;
    if (updateTaskDto.description !== undefined) data.description = updateTaskDto.description;
    if (updateTaskDto.completed !== undefined) data.completed = updateTaskDto.completed;
    if (updateTaskDto.status !== undefined) data.status = updateTaskDto.status;
    if (updateTaskDto.dueDate !== undefined) {
      data.dueDate = updateTaskDto.dueDate ? new Date(updateTaskDto.dueDate) : null;
    }
    if (updateTaskDto.energyLevel !== undefined) data.energyLevel = updateTaskDto.energyLevel;
    if (updateTaskDto.focusType !== undefined) data.focusType = updateTaskDto.focusType;
    if (updateTaskDto.estimatedMinutes !== undefined)
      data.estimatedMinutes = updateTaskDto.estimatedMinutes;
    if (updateTaskDto.priority !== undefined) data.priority = updateTaskDto.priority;
    if (updateTaskDto.softDeadline !== undefined) {
      data.softDeadline = updateTaskDto.softDeadline ? new Date(updateTaskDto.softDeadline) : null;
    }
    if (updateTaskDto.hardDeadline !== undefined) {
      data.hardDeadline = updateTaskDto.hardDeadline ? new Date(updateTaskDto.hardDeadline) : null;
    }
    if (updateTaskDto.source !== undefined) data.source = updateTaskDto.source;
    if (updateTaskDto.aiSuggestion !== undefined) data.aiSuggestion = updateTaskDto.aiSuggestion;
    if (updateTaskDto.projectId !== undefined) {
      data.project = updateTaskDto.projectId
        ? { connect: { id: updateTaskDto.projectId } }
        : { disconnect: true };
    }

    const updatedTask = await this.prisma.task.update({
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

    // Send real-time notification for task update
    await this.notificationsService.notifyTaskUpdate(updatedTask.ownerId, {
      id: updatedTask.id,
      title: updatedTask.title,
      status: updatedTask.status,
      priority: updatedTask.priority,
      dueDate: updatedTask.dueDate,
      updatedBy: updatedBy || updatedTask.ownerId,
    });

    return updatedTask;
  }

  async remove(id: string): Promise<void> {
    const existingTask = await this.prisma.task.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
    });
    if (!existingTask) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    await this.prisma.task.delete({ where: { id } });

    // Send real-time notification for task deletion
    await this.notificationsService.notifyTaskDeleted(
      existingTask.ownerId,
      existingTask.id,
      existingTask.title
    );
  }

  async toggle(id: string): Promise<Task> {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
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

  // Task Dependencies
  async findTaskDependencies(taskId: string): Promise<TaskDependency[]> {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
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

  async createTaskDependency(
    createDependencyDto: CreateTaskDependencyDto
  ): Promise<TaskDependency> {
    const { taskId, dependsOn } = createDependencyDto;

    // Verify both tasks exist
    const [task, prerequisiteTask] = await Promise.all([
      this.prisma.task.findUnique({ where: { id: taskId } }),
      this.prisma.task.findUnique({ where: { id: dependsOn } }),
    ]);

    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }
    if (!prerequisiteTask) {
      throw new NotFoundException(`Prerequisite task with ID ${dependsOn} not found`);
    }

    // Check for circular dependencies
    const existingDependencies = await this.prisma.taskDependency.findMany({
      where: { taskId: dependsOn },
    });

    const wouldCreateCircle = await this.checkCircularDependency(
      dependsOn,
      taskId,
      existingDependencies
    );
    if (wouldCreateCircle) {
      throw new BadRequestException(
        'Creating this dependency would result in a circular dependency'
      );
    }

    // Check if dependency already exists
    const existingDependency = await this.prisma.taskDependency.findUnique({
      where: {
        taskId_dependsOn: { taskId, dependsOn },
      },
    });

    if (existingDependency) {
      throw new BadRequestException('Dependency already exists');
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

  async removeTaskDependency(taskId: string, dependencyId: string): Promise<void> {
    const dependency = await this.prisma.taskDependency.findUnique({
      where: { id: dependencyId },
    });

    if (!dependency) {
      throw new NotFoundException(`Dependency with ID ${dependencyId} not found`);
    }

    if (dependency.taskId !== taskId) {
      throw new BadRequestException('Dependency does not belong to the specified task');
    }

    await this.prisma.taskDependency.delete({
      where: { id: dependencyId },
    });
  }

  private async checkCircularDependency(
    startTaskId: string,
    targetTaskId: string,
    dependencies: TaskDependency[]
  ): Promise<boolean> {
    const visited = new Set<string>();

    const checkCircle = (currentTaskId: string): boolean => {
      if (currentTaskId === targetTaskId) return true;
      if (visited.has(currentTaskId)) return false;

      visited.add(currentTaskId);

      const taskDependencies = dependencies.filter(dep => dep.taskId === currentTaskId);
      return taskDependencies.some(dep => checkCircle(dep.dependsOn));
    };

    return checkCircle(startTaskId);
  }

  // User Settings
  async findUserSettings(userId: string): Promise<UserSettings | null> {
    return this.prisma.userSettings.findUnique({
      where: { userId },
    });
  }

  async createUserSettings(
    userId: string,
    createSettingsDto: CreateUserSettingsDto
  ): Promise<UserSettings> {
    // Check if user exists
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Check if settings already exist
    const existingSettings = await this.prisma.userSettings.findUnique({
      where: { userId },
    });

    if (existingSettings) {
      throw new BadRequestException('User settings already exist. Use update instead.');
    }

    return this.prisma.userSettings.create({
      data: {
        userId,
        ...createSettingsDto,
      },
    });
  }

  async updateUserSettings(
    userId: string,
    updateSettingsDto: UpdateUserSettingsDto
  ): Promise<UserSettings> {
    const existingSettings = await this.prisma.userSettings.findUnique({
      where: { userId },
    });

    if (!existingSettings) {
      throw new NotFoundException(`User settings for user ${userId} not found`);
    }

    return this.prisma.userSettings.update({
      where: { userId },
      data: updateSettingsDto,
    });
  }

  async removeUserSettings(userId: string): Promise<void> {
    const existingSettings = await this.prisma.userSettings.findUnique({
      where: { userId },
    });

    if (!existingSettings) {
      throw new NotFoundException(`User settings for user ${userId} not found`);
    }

    await this.prisma.userSettings.delete({
      where: { userId },
    });
  }
}
