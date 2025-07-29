import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ValidationPipe,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger";
import { TasksService } from "./tasks.service";
import {
  CreateTaskDto,
  UpdateTaskDto,
  CreateTaskDependencyDto,
  CreateDependencyRequestDto,
  CreateUserSettingsDto,
  UpdateUserSettingsDto,
  TaskDependencyResponseDto,
  UserSettingsResponseDto,
} from "./dto";
import { Task, TaskDependency, UserSettings } from "@prisma/client";

@ApiTags("tasks")
@Controller("tasks")
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @ApiOperation({ summary: "Get all tasks" })
  @ApiQuery({
    name: "ownerId",
    required: false,
    description: "Filter tasks by owner ID",
  })
  @ApiResponse({ status: 200, description: "Tasks retrieved successfully" })
  async getTasks(@Query("ownerId") ownerId?: string): Promise<Task[]> {
    return this.tasksService.findAll(ownerId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a task by ID" })
  @ApiParam({ name: "id", description: "Task ID" })
  @ApiResponse({ status: 200, description: "Task retrieved successfully" })
  @ApiResponse({ status: 404, description: "Task not found" })
  async getTask(@Param("id") id: string): Promise<Task> {
    return this.tasksService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: "Create a new task" })
  @ApiResponse({ status: 201, description: "Task created successfully" })
  @ApiResponse({ status: 400, description: "Invalid input" })
  async createTask(
    @Body(ValidationPipe) createTaskDto: CreateTaskDto,
    @Query("ownerId") ownerId: string, // In real app, this would come from JWT token
  ): Promise<Task> {
    return this.tasksService.create(createTaskDto, ownerId);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a task" })
  @ApiParam({ name: "id", description: "Task ID" })
  @ApiResponse({ status: 200, description: "Task updated successfully" })
  @ApiResponse({ status: 404, description: "Task not found" })
  @ApiResponse({ status: 400, description: "Invalid input" })
  async updateTask(
    @Param("id") id: string,
    @Body(ValidationPipe) updateTaskDto: UpdateTaskDto,
  ): Promise<Task> {
    return this.tasksService.update(id, updateTaskDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a task" })
  @ApiParam({ name: "id", description: "Task ID" })
  @ApiResponse({ status: 204, description: "Task deleted successfully" })
  @ApiResponse({ status: 404, description: "Task not found" })
  async deleteTask(@Param("id") id: string): Promise<void> {
    await this.tasksService.remove(id);
  }

  @Patch(":id/toggle")
  @ApiOperation({ summary: "Toggle task completion status" })
  @ApiParam({ name: "id", description: "Task ID" })
  @ApiResponse({ status: 200, description: "Task toggled successfully" })
  @ApiResponse({ status: 404, description: "Task not found" })
  async toggleTask(@Param("id") id: string): Promise<Task> {
    return this.tasksService.toggle(id);
  }

  // Task Dependencies
  @Get(":id/dependencies")
  @ApiOperation({ summary: "Get task dependencies" })
  @ApiParam({ name: "id", description: "Task ID" })
  @ApiResponse({
    status: 200,
    description: "Dependencies retrieved successfully",
    type: [TaskDependencyResponseDto],
  })
  @ApiResponse({ status: 404, description: "Task not found" })
  async getTaskDependencies(
    @Param("id") id: string,
  ): Promise<TaskDependency[]> {
    return this.tasksService.findTaskDependencies(id);
  }

  @Post(":id/dependencies")
  @ApiOperation({ summary: "Create a task dependency" })
  @ApiParam({ name: "id", description: "Task ID" })
  @ApiResponse({
    status: 201,
    description: "Dependency created successfully",
    type: TaskDependencyResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Invalid input or circular dependency",
  })
  @ApiResponse({ status: 404, description: "Task not found" })
  async createTaskDependency(
    @Param("id") id: string,
    @Body(ValidationPipe) createDependencyDto: CreateDependencyRequestDto,
  ): Promise<TaskDependency> {
    const fullDto: CreateTaskDependencyDto = {
      taskId: id,
      dependsOn: createDependencyDto.dependsOn,
    };
    return this.tasksService.createTaskDependency(fullDto);
  }

  @Delete(":id/dependencies/:dependencyId")
  @ApiOperation({ summary: "Remove a task dependency" })
  @ApiParam({ name: "id", description: "Task ID" })
  @ApiParam({ name: "dependencyId", description: "Dependency ID" })
  @ApiResponse({ status: 204, description: "Dependency removed successfully" })
  @ApiResponse({ status: 404, description: "Task or dependency not found" })
  @ApiResponse({
    status: 400,
    description: "Dependency does not belong to task",
  })
  async removeTaskDependency(
    @Param("id") id: string,
    @Param("dependencyId") dependencyId: string,
  ): Promise<void> {
    await this.tasksService.removeTaskDependency(id, dependencyId);
  }
}

@ApiTags("user-settings")
@Controller("users")
export class UserSettingsController {
  constructor(private readonly tasksService: TasksService) {}

  @Get(":id/settings")
  @ApiOperation({ summary: "Get user energy patterns and preferences" })
  @ApiParam({ name: "id", description: "User ID" })
  @ApiResponse({
    status: 200,
    description: "User settings retrieved successfully",
    type: UserSettingsResponseDto,
  })
  @ApiResponse({ status: 404, description: "User settings not found" })
  async getUserSettings(@Param("id") id: string): Promise<UserSettings | null> {
    return this.tasksService.findUserSettings(id);
  }

  @Post(":id/settings")
  @ApiOperation({ summary: "Create user scheduling preferences" })
  @ApiParam({ name: "id", description: "User ID" })
  @ApiResponse({
    status: 201,
    description: "User settings created successfully",
    type: UserSettingsResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Invalid input or settings already exist",
  })
  @ApiResponse({ status: 404, description: "User not found" })
  async createUserSettings(
    @Param("id") id: string,
    @Body(ValidationPipe) createSettingsDto: CreateUserSettingsDto,
  ): Promise<UserSettings> {
    return this.tasksService.createUserSettings(id, createSettingsDto);
  }

  @Patch(":id/settings")
  @ApiOperation({ summary: "Update user scheduling preferences" })
  @ApiParam({ name: "id", description: "User ID" })
  @ApiResponse({
    status: 200,
    description: "User settings updated successfully",
    type: UserSettingsResponseDto,
  })
  @ApiResponse({ status: 404, description: "User settings not found" })
  @ApiResponse({ status: 400, description: "Invalid input" })
  async updateUserSettings(
    @Param("id") id: string,
    @Body(ValidationPipe) updateSettingsDto: UpdateUserSettingsDto,
  ): Promise<UserSettings> {
    return this.tasksService.updateUserSettings(id, updateSettingsDto);
  }

  @Delete(":id/settings")
  @ApiOperation({ summary: "Delete user settings" })
  @ApiParam({ name: "id", description: "User ID" })
  @ApiResponse({
    status: 204,
    description: "User settings deleted successfully",
  })
  @ApiResponse({ status: 404, description: "User settings not found" })
  async deleteUserSettings(@Param("id") id: string): Promise<void> {
    await this.tasksService.removeUserSettings(id);
  }
}
