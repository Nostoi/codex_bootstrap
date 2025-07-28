import { Controller, Get, Param, Patch } from "@nestjs/common";
import { TasksService, Task } from "./tasks.service";

@Controller("tasks")
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  getTasks(): Task[] {
    return this.tasksService.findAll();
  }

  @Patch(":id/toggle")
  toggleTask(@Param("id") id: string): Task | undefined {
    return this.tasksService.toggle(Number(id));
  }
}
