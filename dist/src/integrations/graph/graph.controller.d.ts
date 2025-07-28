import { GraphService } from './graph.service';
export declare class GraphController {
    private readonly graphService;
    constructor(graphService: GraphService);
    getUserProfile(userId: string): Promise<any>;
    getOneDriveFiles(userId: string): Promise<any>;
    getTeams(userId: string): Promise<any>;
    configureIntegration(userId: string, config: {
        accessToken: string;
        refreshToken?: string;
        expiresAt?: string;
        scopes?: string[];
    }): Promise<{
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
    createOneDriveFile(userId: string, fileData: {
        filename: string;
        content: string;
    }): Promise<any>;
}
