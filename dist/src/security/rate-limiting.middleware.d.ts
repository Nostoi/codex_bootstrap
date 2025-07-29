import { NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { AuditLoggerService } from "./audit-logger.service";
interface ExtendedRequest extends Request {
    correlationId?: string;
    user?: {
        id: string;
    };
}
export declare class RateLimitingMiddleware implements NestMiddleware {
    private readonly auditLogger;
    private readonly logger;
    private redis;
    private rateLimiters;
    constructor(auditLogger: AuditLoggerService);
    private initializeRedis;
    private setupRateLimiters;
    private createRateLimit;
    private getKeyForRequest;
    private getEndpointCategory;
    private getClientIp;
    private shouldSkipRateLimit;
    private onRateLimitExceeded;
    use(req: ExtendedRequest, res: Response, next: NextFunction): void;
    getRateLimitStatus(userId?: string, ip?: string): Promise<{
        category: string;
        remaining: number;
        resetTime: Date;
    }[]>;
    private getMaxRequestsForCategory;
    resetRateLimit(userId?: string, ip?: string, category?: string): Promise<void>;
}
export {};
