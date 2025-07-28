import { HttpException, HttpStatus } from '@nestjs/common';
export declare class OpenAIException extends HttpException {
    constructor(message: string, status?: HttpStatus, code?: string, details?: any);
}
export declare class OpenAIRateLimitException extends OpenAIException {
    constructor(retryAfter?: number, details?: any);
}
export declare class OpenAIQuotaExceededException extends OpenAIException {
    constructor(details?: any);
}
export declare class OpenAIInvalidRequestException extends OpenAIException {
    constructor(message: string, details?: any);
}
export declare class OpenAIUnauthorizedException extends OpenAIException {
    constructor(details?: any);
}
export declare class OpenAIServerException extends OpenAIException {
    constructor(message: string, details?: any);
}
export declare class OpenAITimeoutException extends OpenAIException {
    constructor(details?: any);
}
