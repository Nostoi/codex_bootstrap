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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SummarizationDto = exports.SuggestionRequestDto = exports.TaskGenerationDto = exports.OpenAIChatCompletionDto = exports.OpenAIChatMessageDto = exports.OpenAICompletionDto = void 0;
const class_validator_1 = require("class-validator");
class OpenAICompletionDto {
    constructor() {
        this.model = "gpt-4o-mini";
        this.temperature = 0.7;
        this.maxTokens = 1000;
        this.stream = false;
    }
}
exports.OpenAICompletionDto = OpenAICompletionDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OpenAICompletionDto.prototype, "prompt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OpenAICompletionDto.prototype, "model", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(2),
    __metadata("design:type", Number)
], OpenAICompletionDto.prototype, "temperature", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(4096),
    __metadata("design:type", Number)
], OpenAICompletionDto.prototype, "maxTokens", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], OpenAICompletionDto.prototype, "stop", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], OpenAICompletionDto.prototype, "stream", void 0);
class OpenAIChatMessageDto {
}
exports.OpenAIChatMessageDto = OpenAIChatMessageDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OpenAIChatMessageDto.prototype, "role", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OpenAIChatMessageDto.prototype, "content", void 0);
class OpenAIChatCompletionDto {
    constructor() {
        this.model = "gpt-4o-mini";
        this.temperature = 0.7;
        this.maxTokens = 1000;
        this.stream = false;
        this.jsonMode = false;
    }
}
exports.OpenAIChatCompletionDto = OpenAIChatCompletionDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], OpenAIChatCompletionDto.prototype, "messages", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OpenAIChatCompletionDto.prototype, "model", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(2),
    __metadata("design:type", Number)
], OpenAIChatCompletionDto.prototype, "temperature", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(4096),
    __metadata("design:type", Number)
], OpenAIChatCompletionDto.prototype, "maxTokens", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], OpenAIChatCompletionDto.prototype, "stream", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], OpenAIChatCompletionDto.prototype, "jsonMode", void 0);
class TaskGenerationDto {
    constructor() {
        this.maxTasks = 10;
    }
}
exports.TaskGenerationDto = TaskGenerationDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TaskGenerationDto.prototype, "projectDescription", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TaskGenerationDto.prototype, "context", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(20),
    __metadata("design:type", Number)
], TaskGenerationDto.prototype, "maxTasks", void 0);
class SuggestionRequestDto {
}
exports.SuggestionRequestDto = SuggestionRequestDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SuggestionRequestDto.prototype, "context", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SuggestionRequestDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SuggestionRequestDto.prototype, "codebase", void 0);
class SummarizationDto {
    constructor() {
        this.maxLength = 200;
        this.format = "paragraph";
    }
}
exports.SummarizationDto = SummarizationDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SummarizationDto.prototype, "text", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(50),
    (0, class_validator_1.Max)(500),
    __metadata("design:type", Number)
], SummarizationDto.prototype, "maxLength", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SummarizationDto.prototype, "format", void 0);
//# sourceMappingURL=openai.dto.js.map