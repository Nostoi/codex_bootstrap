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
exports.DocumentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let DocumentsService = class DocumentsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(ownerId) {
        return this.prisma.document.findMany({
            where: ownerId ? { ownerId } : undefined,
            orderBy: { updatedAt: "desc" },
            include: {
                owner: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true,
                    },
                },
                sessions: {
                    where: { isActive: true },
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                avatar: true,
                            },
                        },
                    },
                },
            },
        });
    }
    async findOne(id) {
        return this.prisma.document.findUnique({
            where: { id },
            include: {
                owner: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true,
                    },
                },
                sessions: {
                    where: { isActive: true },
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                avatar: true,
                            },
                        },
                    },
                },
            },
        });
    }
    async create(createDocumentDto) {
        return this.prisma.document.create({
            data: createDocumentDto,
            include: {
                owner: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true,
                    },
                },
            },
        });
    }
    async update(id, updateDocumentDto) {
        return this.prisma.document.update({
            where: { id },
            data: updateDocumentDto,
        });
    }
    async remove(id) {
        return this.prisma.document.delete({
            where: { id },
        });
    }
    async getCollaborationHistory(documentId) {
        return this.prisma.collaborationSession.findMany({
            where: { documentId },
            orderBy: { joinedAt: "desc" },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true,
                    },
                },
            },
        });
    }
};
exports.DocumentsService = DocumentsService;
exports.DocumentsService = DocumentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DocumentsService);
//# sourceMappingURL=documents.service.js.map