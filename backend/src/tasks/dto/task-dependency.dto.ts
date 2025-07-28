export class CreateTaskDependencyDto {
  taskId!: string;
  dependsOn!: string;
}

export class CreateDependencyRequestDto {
  dependsOn!: string;
}

export class TaskDependencyResponseDto {
  id!: string;
  taskId!: string;
  dependsOn!: string;
  createdAt!: Date;
}
