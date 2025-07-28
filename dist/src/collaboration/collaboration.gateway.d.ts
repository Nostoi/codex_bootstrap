import { OnGatewayConnection, OnGatewayDisconnect } from "@nestjs/websockets";
import { Server, WebSocket } from "ws";
import { CollaborationService } from "./collaboration.service";
export declare class CollaborationGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private collaborationService;
    server: Server;
    private readonly logger;
    private documents;
    constructor(collaborationService: CollaborationService);
    handleConnection(client: WebSocket, request: any): void;
    handleDisconnect(client: WebSocket): void;
    handleDocumentSync(data: {
        documentId: string;
        update: Uint8Array;
    }, client: WebSocket): Promise<void>;
    handleJoinDocument(data: {
        documentId: string;
        userId: string;
    }, client: WebSocket): Promise<void>;
    handleLeaveDocument(data: {
        documentId: string;
        userId: string;
    }): Promise<void>;
}
