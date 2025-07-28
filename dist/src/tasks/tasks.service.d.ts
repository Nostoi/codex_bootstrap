export interface Task {
    id: number;
    title: string;
    completed: boolean;
    dueDate: string;
}
export declare class TasksService {
    private tasks;
    private nextId;
    findAll(): Task[];
    toggle(id: number): Task | undefined;
}
