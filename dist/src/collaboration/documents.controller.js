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
exports.DocumentsController = void 0;
const common_1 = require("@nestjs/common");
const documents_service_1 = require("./documents.service");
const collaboration_service_1 = require("./collaboration.service");
const document_dto_1 = require("./dto/document.dto");
const swagger_1 = require("@nestjs/swagger");
let DocumentsController = class DocumentsController {
    constructor(documentsService, collaborationService) {
        this.documentsService = documentsService;
        this.collaborationService = collaborationService;
    }
    create(createDocumentDto) {
        return this.documentsService.create(createDocumentDto);
    }
    findAll(ownerId) {
        return this.documentsService.findAll(ownerId);
    }
    findOne(id) {
        return this.documentsService.findOne(id);
    }
    getActiveCollaborators(id) {
        return this.collaborationService.getActiveCollaborators(id);
    }
    getCollaborationHistory(id) {
        return this.documentsService.getCollaborationHistory(id);
    }
    update(id, updateDocumentDto) {
        return this.documentsService.update(id, updateDocumentDto);
    }
    remove(id) {
        return this.documentsService.remove(id);
    }
};
exports.DocumentsController = DocumentsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: "Create a new document" }),
    (0, swagger_1.ApiResponse)({ status: 201, description: "Document created successfully" }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [document_dto_1.CreateDocumentDto]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: "Get all documents" }),
    (0, swagger_1.ApiQuery)({
        name: "ownerId",
        required: false,
        description: "Filter by owner ID",
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "List of documents" }),
    __param(0, (0, common_1.Query)("ownerId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(":id"),
    (0, swagger_1.ApiOperation)({ summary: "Get document by ID" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Document found" }),
    (0, swagger_1.ApiResponse)({ status: 404, description: "Document not found" }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(":id/collaborators"),
    (0, swagger_1.ApiOperation)({ summary: "Get active collaborators for a document" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "List of active collaborators" }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "getActiveCollaborators", null);
__decorate([
    (0, common_1.Get)(":id/history"),
    (0, swagger_1.ApiOperation)({ summary: "Get collaboration history for a document" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Collaboration history" }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "getCollaborationHistory", null);
__decorate([
    (0, common_1.Patch)(":id"),
    (0, swagger_1.ApiOperation)({ summary: "Update document" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Document updated successfully" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, document_dto_1.UpdateDocumentDto]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(":id"),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: "Delete document" }),
    (0, swagger_1.ApiResponse)({ status: 204, description: "Document deleted successfully" }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "remove", null);
exports.DocumentsController = DocumentsController = __decorate([
    (0, swagger_1.ApiTags)("documents"),
    (0, common_1.Controller)("documents"),
    __metadata("design:paramtypes", [documents_service_1.DocumentsService,
        collaboration_service_1.CollaborationService])
], DocumentsController);
//# sourceMappingURL=documents.controller.js.map