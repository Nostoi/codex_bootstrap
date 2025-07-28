import { TaskStatus } from '@prisma/client';
import { CreateTaskDto } from './create-task.dto';
export declare class UpdateTaskDto extends CreateTaskDto {
    completed?: boolean;
    status?: TaskStatus;
}
