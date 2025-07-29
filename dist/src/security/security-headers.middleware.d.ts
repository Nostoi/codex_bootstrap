import { NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
export declare class SecurityHeadersMiddleware implements NestMiddleware {
    private readonly logger;
    private helmetMiddleware;
    constructor();
    private setupHelmet;
    private getAllowedOrigins;
    use(req: Request, res: Response, next: NextFunction): void;
    private addCustomHeaders;
    generateNonce(): string;
    addNonceToResponse(res: Response, nonce: string): void;
    isOriginAllowed(origin: string): boolean;
    requireHTTPS(req: Request, res: Response, next: NextFunction): void;
}
