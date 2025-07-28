export declare class CreateTaskDependencyDto {
    taskId: string;
    dependsOn: string;
}
export declare class CreateDependencyRequestDto {
    dependsOn: string;
}
export declare class TaskDependencyResponseDto {
    id: string;
    taskId: string;
    dependsOn: string;
    createdAt: Date;
}
