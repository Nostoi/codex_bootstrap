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
exports.AiController = void 0;
const common_1 = require("@nestjs/common");
const ai_service_1 = require("./ai.service");
const openai_dto_1 = require("./dto/openai.dto");
let AiController = class AiController {
    constructor(aiService) {
        this.aiService = aiService;
    }
    async generateTasks(dto) {
        return this.aiService.generateTasks(dto);
    }
    async extractTasks(dto) {
        return this.aiService.extractTasks(dto);
    }
    async getSuggestions(dto) {
        return this.aiService.getSuggestions(dto);
    }
    async summarize(dto) {
        return this.aiService.summarize(dto);
    }
    async classifyTask(description) {
        return this.aiService.classifyTask(description);
    }
    async healthCheck() {
        return this.aiService.healthCheck();
    }
    async chatCompletion(dto) {
        return this.aiService.chatCompletion({
            messages: dto.messages,
            model: dto.model,
            temperature: dto.temperature,
            maxTokens: dto.maxTokens,
            stream: dto.stream,
            jsonMode: dto.jsonMode,
        });
    }
};
exports.AiController = AiController;
__decorate([
    (0, common_1.Post)("tasks/generate"),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [openai_dto_1.TaskGenerationDto]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "generateTasks", null);
__decorate([
    (0, common_1.Post)("extract-tasks"),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [openai_dto_1.TaskExtractionDto]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "extractTasks", null);
__decorate([
    (0, common_1.Post)("suggestions"),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [openai_dto_1.SuggestionRequestDto]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "getSuggestions", null);
__decorate([
    (0, common_1.Post)("summarize"),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [openai_dto_1.SummarizationDto]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "summarize", null);
__decorate([
    (0, common_1.Post)("tasks/classify"),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Body)("description")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "classifyTask", null);
__decorate([
    (0, common_1.Get)("health"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AiController.prototype, "healthCheck", null);
__decorate([
    (0, common_1.Post)("chat"),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [openai_dto_1.OpenAIChatCompletionDto]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "chatCompletion", null);
exports.AiController = AiController = __decorate([
    (0, common_1.Controller)("ai"),
    __metadata("design:paramtypes", [ai_service_1.AiService])
], AiController);
//# sourceMappingURL=ai.controller.js.map