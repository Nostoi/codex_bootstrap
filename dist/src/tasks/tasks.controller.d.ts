import { TasksService, Task } from './tasks.service';
export declare class TasksController {
    private readonly tasksService;
    constructor(tasksService: TasksService);
    getTasks(): Task[];
    toggleTask(id: string): Task | undefined;
}
