import { TasksService } from "./tasks.service";
import { CreateTaskDto, UpdateTaskDto, CreateDependencyRequestDto, CreateUserSettingsDto, UpdateUserSettingsDto } from "./dto";
import { Task, TaskDependency, UserSettings } from "@prisma/client";
export declare class TasksController {
    private readonly tasksService;
    constructor(tasksService: TasksService);
    getTasks(ownerId?: string): Promise<Task[]>;
    getTask(id: string): Promise<Task>;
    createTask(createTaskDto: CreateTaskDto, ownerId: string): Promise<Task>;
    updateTask(id: string, updateTaskDto: UpdateTaskDto): Promise<Task>;
    deleteTask(id: string): Promise<void>;
    toggleTask(id: string): Promise<Task>;
    getTaskDependencies(id: string): Promise<TaskDependency[]>;
    createTaskDependency(id: string, createDependencyDto: CreateDependencyRequestDto): Promise<TaskDependency>;
    removeTaskDependency(id: string, dependencyId: string): Promise<void>;
}
export declare class UserSettingsController {
    private readonly tasksService;
    constructor(tasksService: TasksService);
    getUserSettings(id: string): Promise<UserSettings | null>;
    createUserSettings(id: string, createSettingsDto: CreateUserSettingsDto): Promise<UserSettings>;
    updateUserSettings(id: string, updateSettingsDto: UpdateUserSettingsDto): Promise<UserSettings>;
    deleteUserSettings(id: string): Promise<void>;
}
