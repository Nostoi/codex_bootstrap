import { PrismaService } from '../prisma/prisma.service';
import { Task, TaskDependency, UserSettings } from '@prisma/client';
import { CreateTaskDto, UpdateTaskDto, CreateTaskDependencyDto, CreateUserSettingsDto, UpdateUserSettingsDto } from './dto';
export declare class TasksService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(ownerId?: string): Promise<Task[]>;
    findOne(id: string): Promise<Task>;
    create(createTaskDto: CreateTaskDto, ownerId: string): Promise<Task>;
    update(id: string, updateTaskDto: UpdateTaskDto): Promise<Task>;
    remove(id: string): Promise<void>;
    toggle(id: string): Promise<Task>;
    findTaskDependencies(taskId: string): Promise<TaskDependency[]>;
    createTaskDependency(createDependencyDto: CreateTaskDependencyDto): Promise<TaskDependency>;
    removeTaskDependency(taskId: string, dependencyId: string): Promise<void>;
    private checkCircularDependency;
    findUserSettings(userId: string): Promise<UserSettings | null>;
    createUserSettings(userId: string, createSettingsDto: CreateUserSettingsDto): Promise<UserSettings>;
    updateUserSettings(userId: string, updateSettingsDto: UpdateUserSettingsDto): Promise<UserSettings>;
    removeUserSettings(userId: string): Promise<void>;
}
