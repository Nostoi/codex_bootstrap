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
var CollaborationGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CollaborationGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const ws_1 = require("ws");
const common_1 = require("@nestjs/common");
const collaboration_service_1 = require("./collaboration.service");
const utils_1 = require("y-websocket/bin/utils");
let CollaborationGateway = CollaborationGateway_1 = class CollaborationGateway {
    constructor(collaborationService) {
        this.collaborationService = collaborationService;
        this.logger = new common_1.Logger(CollaborationGateway_1.name);
        this.documents = new Map();
    }
    handleConnection(client, request) {
        this.logger.log("Client connected to collaboration server");
        const url = new URL(request.url, `http://${request.headers.host}`);
        const documentId = url.searchParams.get("docId");
        if (documentId) {
            (0, utils_1.setupWSConnection)(client, request, { gc: true });
            this.collaborationService.handleClientConnect(documentId, client);
        }
    }
    handleDisconnect(client) {
        this.logger.log("Client disconnected from collaboration server");
        this.collaborationService.handleClientDisconnect(client);
    }
    async handleDocumentSync(data, client) {
        try {
            await this.collaborationService.syncDocument(data.documentId, data.update);
            this.server.clients.forEach((otherClient) => {
                if (otherClient !== client &&
                    otherClient.readyState === ws_1.WebSocket.OPEN) {
                    otherClient.send(JSON.stringify({
                        type: "document-update",
                        documentId: data.documentId,
                        update: Array.from(data.update),
                    }));
                }
            });
        }
        catch (error) {
            this.logger.error("Error syncing document:", error);
        }
    }
    async handleJoinDocument(data, client) {
        try {
            await this.collaborationService.joinDocument(data.documentId, data.userId);
            const documentState = await this.collaborationService.getDocumentState(data.documentId);
            if (documentState) {
                client.send(JSON.stringify({
                    type: "document-state",
                    documentId: data.documentId,
                    state: Array.from(documentState),
                }));
            }
        }
        catch (error) {
            this.logger.error("Error joining document:", error);
        }
    }
    async handleLeaveDocument(data) {
        try {
            await this.collaborationService.leaveDocument(data.documentId, data.userId);
        }
        catch (error) {
            this.logger.error("Error leaving document:", error);
        }
    }
};
exports.CollaborationGateway = CollaborationGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", ws_1.Server)
], CollaborationGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)("sync-document"),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, ws_1.WebSocket]),
    __metadata("design:returntype", Promise)
], CollaborationGateway.prototype, "handleDocumentSync", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("join-document"),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, ws_1.WebSocket]),
    __metadata("design:returntype", Promise)
], CollaborationGateway.prototype, "handleJoinDocument", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("leave-document"),
    __param(0, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CollaborationGateway.prototype, "handleLeaveDocument", null);
exports.CollaborationGateway = CollaborationGateway = CollaborationGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        path: "/collaboration",
    }),
    __metadata("design:paramtypes", [collaboration_service_1.CollaborationService])
], CollaborationGateway);
//# sourceMappingURL=collaboration.gateway.js.map