"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAITimeoutException = exports.OpenAIServerException = exports.OpenAIUnauthorizedException = exports.OpenAIInvalidRequestException = exports.OpenAIQuotaExceededException = exports.OpenAIRateLimitException = exports.OpenAIException = void 0;
const common_1 = require("@nestjs/common");
class OpenAIException extends common_1.HttpException {
    constructor(message, status = common_1.HttpStatus.INTERNAL_SERVER_ERROR, code, details) {
        super({
            message,
            error: 'OpenAI Service Error',
            statusCode: status,
            code,
            details,
            timestamp: new Date().toISOString(),
        }, status);
    }
}
exports.OpenAIException = OpenAIException;
class OpenAIRateLimitException extends OpenAIException {
    constructor(retryAfter, details) {
        super('OpenAI API rate limit exceeded', common_1.HttpStatus.TOO_MANY_REQUESTS, 'RATE_LIMIT_EXCEEDED', { retryAfter, ...details });
    }
}
exports.OpenAIRateLimitException = OpenAIRateLimitException;
class OpenAIQuotaExceededException extends OpenAIException {
    constructor(details) {
        super('OpenAI API quota exceeded', common_1.HttpStatus.PAYMENT_REQUIRED, 'QUOTA_EXCEEDED', details);
    }
}
exports.OpenAIQuotaExceededException = OpenAIQuotaExceededException;
class OpenAIInvalidRequestException extends OpenAIException {
    constructor(message, details) {
        super(message, common_1.HttpStatus.BAD_REQUEST, 'INVALID_REQUEST', details);
    }
}
exports.OpenAIInvalidRequestException = OpenAIInvalidRequestException;
class OpenAIUnauthorizedException extends OpenAIException {
    constructor(details) {
        super('OpenAI API authentication failed', common_1.HttpStatus.UNAUTHORIZED, 'AUTHENTICATION_FAILED', details);
    }
}
exports.OpenAIUnauthorizedException = OpenAIUnauthorizedException;
class OpenAIServerException extends OpenAIException {
    constructor(message, details) {
        super(message, common_1.HttpStatus.BAD_GATEWAY, 'OPENAI_SERVER_ERROR', details);
    }
}
exports.OpenAIServerException = OpenAIServerException;
class OpenAITimeoutException extends OpenAIException {
    constructor(details) {
        super('OpenAI API request timeout', common_1.HttpStatus.REQUEST_TIMEOUT, 'REQUEST_TIMEOUT', details);
    }
}
exports.OpenAITimeoutException = OpenAITimeoutException;
//# sourceMappingURL=openai.exceptions.js.map