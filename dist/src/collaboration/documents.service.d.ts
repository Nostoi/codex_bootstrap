import { PrismaService } from '../prisma/prisma.service';
import { CreateDocumentDto, UpdateDocumentDto } from './dto/document.dto';
import { Document } from '@prisma/client';
export declare class DocumentsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(ownerId?: string): Promise<Document[]>;
    findOne(id: string): Promise<Document | null>;
    create(createDocumentDto: CreateDocumentDto): Promise<Document>;
    update(id: string, updateDocumentDto: UpdateDocumentDto): Promise<Document>;
    remove(id: string): Promise<Document>;
    getCollaborationHistory(documentId: string): Promise<({
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
