import { HttpException, HttpStatus } from '@nestjs/common';

export class OpenAIException extends HttpException {
  constructor(
    message: string,
    status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    code?: string,
    details?: any
  ) {
    super(
      {
        message,
        error: 'OpenAI Service Error',
        statusCode: status,
        code,
        details,
        timestamp: new Date().toISOString(),
      },
      status
    );
  }
}

export class OpenAIRateLimitException extends OpenAIException {
  constructor(retryAfter?: number, details?: any) {
    super('OpenAI API rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS, 'RATE_LIMIT_EXCEEDED', {
      retryAfter,
      ...details,
    });
  }
}

export class OpenAIQuotaExceededException extends OpenAIException {
  constructor(details?: any) {
    super('OpenAI API quota exceeded', HttpStatus.PAYMENT_REQUIRED, 'QUOTA_EXCEEDED', details);
  }
}

export class OpenAIInvalidRequestException extends OpenAIException {
  constructor(message: string, details?: any) {
    super(message, HttpStatus.BAD_REQUEST, 'INVALID_REQUEST', details);
  }
}

export class OpenAIUnauthorizedException extends OpenAIException {
  constructor(details?: any) {
    super(
      'OpenAI API authentication failed',
      HttpStatus.UNAUTHORIZED,
      'AUTHENTICATION_FAILED',
      details
    );
  }
}

export class OpenAIServerException extends OpenAIException {
  constructor(message: string, details?: any) {
    super(message, HttpStatus.BAD_GATEWAY, 'OPENAI_SERVER_ERROR', details);
  }
}

export class OpenAITimeoutException extends OpenAIException {
  constructor(details?: any) {
    super('OpenAI API request timeout', HttpStatus.REQUEST_TIMEOUT, 'REQUEST_TIMEOUT', details);
  }
}
