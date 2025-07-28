import { PrismaService } from '../prisma/prisma.service';
import { WebSocket } from 'ws';
export declare class CollaborationService {
    private prisma;
    private readonly logger;
    private documents;
    private clientConnections;
    constructor(prisma: PrismaService);
    handleClientConnect(documentId: string, client: WebSocket): Promise<void>;
    handleClientDisconnect(client: WebSocket): void;
    syncDocument(documentId: string, update: Uint8Array): Promise<void>;
    getDocumentState(documentId: string): Promise<Uint8Array | null>;
    joinDocument(documentId: string, userId: string): Promise<void>;
    leaveDocument(documentId: string, userId: string): Promise<void>;
    getActiveCollaborators(documentId: string): Promise<({
        user: {
            id: string;
            email: string;
            name: string;
            avatar: string;
        };
    } & {
        id: string;
        userId: string;
        documentId: string;
        joinedAt: Date;
        leftAt: Date | null;
        isActive: boolean;
    })[]>;
}
