import { DocumentsService } from "./documents.service";
import { CollaborationService } from "./collaboration.service";
import { CreateDocumentDto, UpdateDocumentDto } from "./dto/document.dto";
export declare class DocumentsController {
    private readonly documentsService;
    private readonly collaborationService;
    constructor(documentsService: DocumentsService, collaborationService: CollaborationService);
    create(createDocumentDto: CreateDocumentDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        content: string | null;
        yjsState: Buffer | null;
        ownerId: string;
    }>;
    findAll(ownerId?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        content: string | null;
        yjsState: Buffer | null;
        ownerId: string;
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        content: string | null;
        yjsState: Buffer | null;
        ownerId: string;
    }>;
    getActiveCollaborators(id: string): Promise<({
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
    getCollaborationHistory(id: string): Promise<({
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
    update(id: string, updateDocumentDto: UpdateDocumentDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        content: string | null;
        yjsState: Buffer | null;
        ownerId: string;
    }>;
    remove(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        content: string | null;
        yjsState: Buffer | null;
        ownerId: string;
    }>;
}
