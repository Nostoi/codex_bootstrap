"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserSettingsController = exports.TasksController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const tasks_service_1 = require("./tasks.service");
const dto_1 = require("./dto");
let TasksController = class TasksController {
    constructor(tasksService) {
        this.tasksService = tasksService;
    }
    async getTasks(ownerId) {
        return this.tasksService.findAll(ownerId);
    }
    async getTask(id) {
        return this.tasksService.findOne(id);
    }
    async createTask(createTaskDto, ownerId) {
        return this.tasksService.create(createTaskDto, ownerId);
    }
    async updateTask(id, updateTaskDto) {
        return this.tasksService.update(id, updateTaskDto);
    }
    async deleteTask(id) {
        await this.tasksService.remove(id);
    }
    async toggleTask(id) {
        return this.tasksService.toggle(id);
    }
    async getTaskDependencies(id) {
        return this.tasksService.findTaskDependencies(id);
    }
    async createTaskDependency(id, createDependencyDto) {
        const fullDto = {
            taskId: id,
            dependsOn: createDependencyDto.dependsOn
        };
        return this.tasksService.createTaskDependency(fullDto);
    }
    async removeTaskDependency(id, dependencyId) {
        await this.tasksService.removeTaskDependency(id, dependencyId);
    }
};
exports.TasksController = TasksController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all tasks' }),
    (0, swagger_1.ApiQuery)({ name: 'ownerId', required: false, description: 'Filter tasks by owner ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Tasks retrieved successfully' }),
    __param(0, (0, common_1.Query)('ownerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "getTasks", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a task by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Task ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Task retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Task not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "getTask", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new task' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Task created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid input' }),
    __param(0, (0, common_1.Body)(common_1.ValidationPipe)),
    __param(1, (0, common_1.Query)('ownerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateTaskDto, String]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "createTask", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a task' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Task ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Task updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Task not found' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid input' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateTaskDto]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "updateTask", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a task' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Task ID' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Task deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Task not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "deleteTask", null);
__decorate([
    (0, common_1.Patch)(':id/toggle'),
    (0, swagger_1.ApiOperation)({ summary: 'Toggle task completion status' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Task ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Task toggled successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Task not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "toggleTask", null);
__decorate([
    (0, common_1.Get)(':id/dependencies'),
    (0, swagger_1.ApiOperation)({ summary: 'Get task dependencies' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Task ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Dependencies retrieved successfully',
        type: [dto_1.TaskDependencyResponseDto]
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Task not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "getTaskDependencies", null);
__decorate([
    (0, common_1.Post)(':id/dependencies'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a task dependency' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Task ID' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Dependency created successfully',
        type: dto_1.TaskDependencyResponseDto
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid input or circular dependency' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Task not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.CreateDependencyRequestDto]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "createTaskDependency", null);
__decorate([
    (0, common_1.Delete)(':id/dependencies/:dependencyId'),
    (0, swagger_1.ApiOperation)({ summary: 'Remove a task dependency' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Task ID' }),
    (0, swagger_1.ApiParam)({ name: 'dependencyId', description: 'Dependency ID' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Dependency removed successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Task or dependency not found' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Dependency does not belong to task' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('dependencyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "removeTaskDependency", null);
exports.TasksController = TasksController = __decorate([
    (0, swagger_1.ApiTags)('tasks'),
    (0, common_1.Controller)('tasks'),
    __metadata("design:paramtypes", [tasks_service_1.TasksService])
], TasksController);
let UserSettingsController = class UserSettingsController {
    constructor(tasksService) {
        this.tasksService = tasksService;
    }
    async getUserSettings(id) {
        return this.tasksService.findUserSettings(id);
    }
    async createUserSettings(id, createSettingsDto) {
        return this.tasksService.createUserSettings(id, createSettingsDto);
    }
    async updateUserSettings(id, updateSettingsDto) {
        return this.tasksService.updateUserSettings(id, updateSettingsDto);
    }
    async deleteUserSettings(id) {
        await this.tasksService.removeUserSettings(id);
    }
};
exports.UserSettingsController = UserSettingsController;
__decorate([
    (0, common_1.Get)(':id/settings'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user energy patterns and preferences' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'User ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'User settings retrieved successfully',
        type: dto_1.UserSettingsResponseDto
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User settings not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserSettingsController.prototype, "getUserSettings", null);
__decorate([
    (0, common_1.Post)(':id/settings'),
    (0, swagger_1.ApiOperation)({ summary: 'Create user scheduling preferences' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'User ID' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'User settings created successfully',
        type: dto_1.UserSettingsResponseDto
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid input or settings already exist' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.CreateUserSettingsDto]),
    __metadata("design:returntype", Promise)
], UserSettingsController.prototype, "createUserSettings", null);
__decorate([
    (0, common_1.Patch)(':id/settings'),
    (0, swagger_1.ApiOperation)({ summary: 'Update user scheduling preferences' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'User ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'User settings updated successfully',
        type: dto_1.UserSettingsResponseDto
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User settings not found' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid input' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateUserSettingsDto]),
    __metadata("design:returntype", Promise)
], UserSettingsController.prototype, "updateUserSettings", null);
__decorate([
    (0, common_1.Delete)(':id/settings'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete user settings' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'User ID' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'User settings deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User settings not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserSettingsController.prototype, "deleteUserSettings", null);
exports.UserSettingsController = UserSettingsController = __decorate([
    (0, swagger_1.ApiTags)('user-settings'),
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [tasks_service_1.TasksService])
], UserSettingsController);
//# sourceMappingURL=tasks.controller.js.map