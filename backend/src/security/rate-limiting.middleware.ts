import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import Redis from 'ioredis';
import { User } from '@prisma/client';
import { AuditLoggerService, AuditAction } from './audit-logger.service';
import { getErrorMessage } from '../common/utils/error.utils';

interface RateLimitConfig {
  windowMs: number;
  max: number;
  message: string;
  keyGenerator?: (req: Request) => string;
}

interface ExtendedRequest extends Request {
  correlationId?: string;
  user?: {
    id: string;
    email: string;
    [key: string]: any;
  };
}

@Injectable()
export class RateLimitingMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RateLimitingMiddleware.name);
  private redis: Redis;
  private rateLimiters: Map<string, any> = new Map();

  constructor(private readonly auditLogger: AuditLoggerService) {
    this.initializeRedis();
    this.setupRateLimiters();
  }

  private initializeRedis(): void {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    try {
      this.redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
        enableReadyCheck: false,
        lazyConnect: true,
      } as any);
      this.redis.on('connect', () => {
        this.logger.log('Connected to Redis for rate limiting');
      });

      this.redis.on('error', error => {
        this.logger.error('Redis connection error', error.stack);
      });
    } catch (error) {
      this.logger.error('Failed to initialize Redis', getErrorMessage(error));
    }
  }

  private setupRateLimiters(): void {
    // AI endpoints - expensive operations
    this.rateLimiters.set(
      'ai',
      this.createRateLimit({
        windowMs: 60 * 1000, // 1 minute
        max: 10, // 10 requests per minute
        message: 'Too many AI requests, please try again later',
      })
    );

    // Task operations - standard CRUD
    this.rateLimiters.set(
      'tasks',
      this.createRateLimit({
        windowMs: 60 * 1000, // 1 minute
        max: 60, // 60 requests per minute
        message: 'Too many task requests, please try again later',
      })
    );

    // Authentication endpoints - prevent brute force
    this.rateLimiters.set(
      'auth',
      this.createRateLimit({
        windowMs: 60 * 1000, // 1 minute
        max: 5, // 5 requests per minute
        message: 'Too many authentication attempts, please try again later',
        keyGenerator: (req: Request) => `auth:${this.getClientIp(req)}`,
      })
    );

    // Project operations - moderate usage
    this.rateLimiters.set(
      'projects',
      this.createRateLimit({
        windowMs: 60 * 1000, // 1 minute
        max: 30, // 30 requests per minute
        message: 'Too many project requests, please try again later',
      })
    );

    // User operations - moderate usage
    this.rateLimiters.set(
      'users',
      this.createRateLimit({
        windowMs: 60 * 1000, // 1 minute
        max: 30, // 30 requests per minute
        message: 'Too many user requests, please try again later',
      })
    );

    // Default fallback - general API
    this.rateLimiters.set(
      'default',
      this.createRateLimit({
        windowMs: 60 * 1000, // 1 minute
        max: 100, // 100 requests per minute
        message: 'Too many requests, please try again later',
      })
    );
  }

  private createRateLimit(config: RateLimitConfig) {
    return (rateLimit as any)({
      windowMs: config.windowMs,
      max: config.max,
      message: { error: config.message },
      keyGenerator:
        config.keyGenerator || ((req: Request) => this.getKeyForRequest(req as ExtendedRequest)),
      skip: (req: Request) => this.shouldSkipRateLimit(req as ExtendedRequest),
      handler: (req: Request, res: Response) =>
        this.onRateLimitExceeded(req as ExtendedRequest, res),
      headers: true, // Send rate limit info in response headers
      standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
      legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    });
  }

  private getKeyForRequest(req: ExtendedRequest): string {
    // Use user ID if authenticated, otherwise use IP address
    const userId = req.user?.id;
    const ip = this.getClientIp(req);
    const path = this.getEndpointCategory(req.path);

    return userId ? `user:${userId}:${path}` : `ip:${ip}:${path}`;
  }

  private getEndpointCategory(path: string): string {
    if (path.startsWith('/api/ai/') || path === '/api/ai') return 'ai';
    if (path.startsWith('/api/tasks/') || path === '/api/tasks') return 'tasks';
    if (path.startsWith('/api/auth/') || path === '/api/auth') return 'auth';
    if (path.startsWith('/api/projects/') || path === '/api/projects') return 'projects';
    if (path.startsWith('/api/users/') || path === '/api/users') return 'users';
    return 'default';
  }

  private getClientIp(req: Request): string {
    return req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown';
  }

  private shouldSkipRateLimit(req: Request): boolean {
    // Skip rate limiting for health checks and internal requests
    const skipPaths = ['/health', '/metrics', '/status'];
    return skipPaths.some(path => req.path.startsWith(path));
  }

  private async onRateLimitExceeded(req: ExtendedRequest, res: Response): Promise<void> {
    const ip = this.getClientIp(req);
    const userId = req.user?.id;
    const path = req.path;
    const category = this.getEndpointCategory(path);

    this.logger.warn(`Rate limit exceeded for ${userId || ip} on ${path}`);

    // Log security event
    await this.auditLogger.logFailure(
      AuditAction.RATE_LIMIT_EXCEEDED,
      'rate_limiter',
      `Rate limit exceeded for ${category} endpoints`,
      {
        userId,
        ipAddress: ip,
        userAgent: req.get('User-Agent'),
        metadata: {
          path,
          category,
          method: req.method,
        },
        correlationId: req.correlationId,
      }
    );

    // Add custom headers for client debugging
    res.set({
      'X-Rate-Limit-Category': category,
      'X-Rate-Limit-Reset': new Date(Date.now() + 60000).toISOString(),
    });
  }

  use(req: ExtendedRequest, res: Response, next: NextFunction) {
    // Add correlation ID if not present
    if (!req.correlationId) {
      req.correlationId = this.auditLogger.generateCorrelationId();
      res.set('X-Correlation-ID', req.correlationId);
    }

    const category = this.getEndpointCategory(req.path);
    const rateLimiter = this.rateLimiters.get(category) || this.rateLimiters.get('default');

    // Apply rate limiting
    rateLimiter(req, res, (error?: any) => {
      if (error) {
        this.logger.error('Rate limiting middleware error', error.stack);
      }
      next(error);
    });
  }

  /**
   * Get current rate limit status for a user/IP
   */
  async getRateLimitStatus(
    userId?: string,
    ip?: string
  ): Promise<
    {
      category: string;
      remaining: number;
      resetTime: Date;
    }[]
  > {
    const results: any[] = [];

    // Return empty array if Redis is not available
    if (!this.redis) {
      this.logger.warn('Redis not available for rate limit status check');
      return results;
    }

    for (const [category] of this.rateLimiters) {
      try {
        const key = userId ? `user:${userId}:${category}` : `ip:${ip}:${category}`;
        const count = await this.redis.get(key);
        const ttl = await this.redis.ttl(key);

        const maxRequests = this.getMaxRequestsForCategory(category);
        const remaining = Math.max(0, maxRequests - parseInt(count || '0'));
        const resetTime = new Date(Date.now() + ttl * 1000);

        results.push({
          category,
          remaining,
          resetTime,
        });
      } catch (error) {
        this.logger.error(
          `Failed to get rate limit status for ${category}`,
          getErrorMessage(error)
        );
      }
    }

    return results;
  }

  private getMaxRequestsForCategory(category: string): number {
    const limits = {
      ai: 10,
      tasks: 60,
      auth: 5,
      projects: 30,
      users: 30,
      default: 100,
    };

    return limits[category as keyof typeof limits] || limits.default;
  }

  /**
   * Reset rate limit for a specific user/IP and category
   * Should be used carefully, typically for administrative purposes
   */
  async resetRateLimit(userId?: string, ip?: string, category?: string): Promise<void> {
    // Return early if Redis is not available
    if (!this.redis) {
      this.logger.warn('Redis not available for rate limit reset');
      return;
    }

    try {
      if (category) {
        const key = userId ? `user:${userId}:${category}` : `ip:${ip}:${category}`;
        await this.redis.del(key);
        this.logger.log(`Reset rate limit for ${key}`);
      } else {
        // Reset all categories for the user/IP
        const pattern = userId ? `user:${userId}:*` : `ip:${ip}:*`;
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
          this.logger.log(`Reset all rate limits for ${userId || ip}`);
        }
      }
    } catch (error) {
      this.logger.error('Failed to reset rate limit', getErrorMessage(error));
      throw new Error('Failed to reset rate limit');
    }
  }
}
