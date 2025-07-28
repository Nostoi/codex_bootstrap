import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { EncryptionService } from './encryption.service';
import { AuditLoggerService } from './audit-logger.service';
import { RateLimitingMiddleware } from './rate-limiting.middleware';
import { SecurityHeadersMiddleware } from './security-headers.middleware';

@Module({
  providers: [
    EncryptionService,
    AuditLoggerService,
    RateLimitingMiddleware,
    SecurityHeadersMiddleware,
  ],
  exports: [
    EncryptionService,
    AuditLoggerService,
    RateLimitingMiddleware,
    SecurityHeadersMiddleware,
  ],
})
export class SecurityModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply security headers to all routes
    consumer
      .apply(SecurityHeadersMiddleware)
      .forRoutes('*');

    // Apply rate limiting to API routes
    consumer
      .apply(RateLimitingMiddleware)
      .forRoutes('/api/*');
  }
}
