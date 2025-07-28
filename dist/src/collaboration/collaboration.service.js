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
var CollaborationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CollaborationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const Y = require("yjs");
let CollaborationService = CollaborationService_1 = class CollaborationService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(CollaborationService_1.name);
        this.documents = new Map();
        this.clientConnections = new Map();
    }
    async handleClientConnect(documentId, client) {
        this.logger.log(`Client connected to document: ${documentId}`);
        if (!this.clientConnections.has(client)) {
            this.clientConnections.set(client, []);
        }
        this.clientConnections.get(client)?.push(documentId);
    }
    handleClientDisconnect(client) {
        const documentIds = this.clientConnections.get(client) || [];
        documentIds.forEach((docId) => {
            this.logger.log(`Client disconnected from document: ${docId}`);
        });
        this.clientConnections.delete(client);
    }
    async syncDocument(documentId, update) {
        try {
            let ydoc = this.documents.get(documentId);
            if (!ydoc) {
                ydoc = new Y.Doc();
                this.documents.set(documentId, ydoc);
                const document = await this.prisma.document.findUnique({
                    where: { id: documentId },
                });
                if (document?.yjsState) {
                    Y.applyUpdate(ydoc, document.yjsState);
                }
            }
            Y.applyUpdate(ydoc, update);
            const state = Y.encodeStateAsUpdate(ydoc);
            await this.prisma.document.update({
                where: { id: documentId },
                data: { yjsState: Buffer.from(state) },
            });
        }
        catch (error) {
            this.logger.error(`Error syncing document ${documentId}:`, error);
            throw error;
        }
    }
    async getDocumentState(documentId) {
        try {
            const ydoc = this.documents.get(documentId);
            if (ydoc) {
                return Y.encodeStateAsUpdate(ydoc);
            }
            const document = await this.prisma.document.findUnique({
                where: { id: documentId },
            });
            if (document?.yjsState) {
                const newYdoc = new Y.Doc();
                Y.applyUpdate(newYdoc, document.yjsState);
                this.documents.set(documentId, newYdoc);
                return document.yjsState;
            }
            return null;
        }
        catch (error) {
            this.logger.error(`Error getting document state ${documentId}:`, error);
            return null;
        }
    }
    async joinDocument(documentId, userId) {
        try {
            await this.prisma.collaborationSession.upsert({
                where: {
                    userId_documentId: {
                        userId,
                        documentId,
                    },
                },
                update: {
                    isActive: true,
                    leftAt: null,
                },
                create: {
                    userId,
                    documentId,
                    isActive: true,
                },
            });
            this.logger.log(`User ${userId} joined document ${documentId}`);
        }
        catch (error) {
            this.logger.error(`Error joining document:`, error);
            throw error;
        }
    }
    async leaveDocument(documentId, userId) {
        try {
            await this.prisma.collaborationSession.updateMany({
                where: {
                    userId,
                    documentId,
                    isActive: true,
                },
                data: {
                    isActive: false,
                    leftAt: new Date(),
                },
            });
            this.logger.log(`User ${userId} left document ${documentId}`);
        }
        catch (error) {
            this.logger.error(`Error leaving document:`, error);
            throw error;
        }
    }
    async getActiveCollaborators(documentId) {
        return this.prisma.collaborationSession.findMany({
            where: {
                documentId,
                isActive: true,
            },
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
exports.CollaborationService = CollaborationService;
exports.CollaborationService = CollaborationService = CollaborationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CollaborationService);
//# sourceMappingURL=collaboration.service.js.map