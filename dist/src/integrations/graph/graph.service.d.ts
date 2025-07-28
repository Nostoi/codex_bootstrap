import { PrismaService } from '../../prisma/prisma.service';
export declare class GraphService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    private createGraphClient;
    getUserProfile(userId: string): Promise<any>;
    getOneDriveFiles(userId: string, folderId?: string): Promise<any>;
    createOneDriveFile(userId: string, filename: string, content: string): Promise<any>;
    getTeams(userId: string): Promise<any>;
    saveIntegrationConfig(userId: string, accessToken: string, refreshToken?: string, expiresAt?: Date, scopes?: string[]): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        provider: string;
        accessToken: string | null;
        refreshToken: string | null;
        expiresAt: Date | null;
        scopes: string[];
    }>;
}
