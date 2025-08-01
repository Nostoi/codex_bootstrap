"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var RateLimitingMiddleware_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitingMiddleware = void 0;
const common_1 = require("@nestjs/common");
const rateLimit = require("express-rate-limit");
const ioredis_1 = require("ioredis");
const audit_logger_service_1 = require("./audit-logger.service");
let RateLimitingMiddleware = RateLimitingMiddleware_1 = class RateLimitingMiddleware {
    constructor(auditLogger) {
        this.auditLogger = auditLogger;
        this.logger = new common_1.Logger(RateLimitingMiddleware_1.name);
        this.rateLimiters = new Map();
        this.initializeRedis();
        this.setupRateLimiters();
    }
    initializeRedis() {
        const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
        try {
            this.redis = new ioredis_1.Redis(redisUrl, {
                maxRetriesPerRequest: 3,
                retryDelayOnFailover: 100,
                enableReadyCheck: false,
                lazyConnect: true,
            });
            this.redis.on("connect", () => {
                this.logger.log("Connected to Redis for rate limiting");
            });
            this.redis.on("error", (error) => {
                this.logger.error("Redis connection error", error.stack);
            });
        }
        catch (error) {
            this.logger.error("Failed to initialize Redis", error.stack);
        }
    }
    setupRateLimiters() {
        this.rateLimiters.set("ai", this.createRateLimit({
            windowMs: 60 * 1000,
            max: 10,
            message: "Too many AI requests, please try again later",
        }));
        this.rateLimiters.set("tasks", this.createRateLimit({
            windowMs: 60 * 1000,
            max: 60,
            message: "Too many task requests, please try again later",
        }));
        this.rateLimiters.set("auth", this.createRateLimit({
            windowMs: 60 * 1000,
            max: 5,
            message: "Too many authentication attempts, please try again later",
            keyGenerator: (req) => `auth:${this.getClientIp(req)}`,
        }));
        this.rateLimiters.set("projects", this.createRateLimit({
            windowMs: 60 * 1000,
            max: 30,
            message: "Too many project requests, please try again later",
        }));
        this.rateLimiters.set("users", this.createRateLimit({
            windowMs: 60 * 1000,
            max: 30,
            message: "Too many user requests, please try again later",
        }));
        this.rateLimiters.set("default", this.createRateLimit({
            windowMs: 60 * 1000,
            max: 100,
            message: "Too many requests, please try again later",
        }));
    }
    createRateLimit(config) {
        return rateLimit({
            windowMs: config.windowMs,
            max: config.max,
            message: { error: config.message },
            keyGenerator: config.keyGenerator || ((req) => this.getKeyForRequest(req)),
            skip: (req) => this.shouldSkipRateLimit(req),
            handler: (req, res) => this.onRateLimitExceeded(req, res),
            headers: true,
            standardHeaders: true,
            legacyHeaders: false,
        });
    }
    getKeyForRequest(req) {
        const userId = req.user?.id;
        const ip = this.getClientIp(req);
        const path = this.getEndpointCategory(req.path);
        return userId ? `user:${userId}:${path}` : `ip:${ip}:${path}`;
    }
    getEndpointCategory(path) {
        if (path.startsWith("/api/ai/") || path === "/api/ai")
            return "ai";
        if (path.startsWith("/api/tasks/") || path === "/api/tasks")
            return "tasks";
        if (path.startsWith("/api/auth/") || path === "/api/auth")
            return "auth";
        if (path.startsWith("/api/projects/") || path === "/api/projects")
            return "projects";
        if (path.startsWith("/api/users/") || path === "/api/users")
            return "users";
        return "default";
    }
    getClientIp(req) {
        return (req.ip ||
            req.connection?.remoteAddress ||
            req.socket?.remoteAddress ||
            "unknown");
    }
    shouldSkipRateLimit(req) {
        const skipPaths = ["/health", "/metrics", "/status"];
        return skipPaths.some((path) => req.path.startsWith(path));
    }
    async onRateLimitExceeded(req, res) {
        const ip = this.getClientIp(req);
        const userId = req.user?.id;
        const path = req.path;
        const category = this.getEndpointCategory(path);
        this.logger.warn(`Rate limit exceeded for ${userId || ip} on ${path}`);
        await this.auditLogger.logFailure(audit_logger_service_1.AuditAction.RATE_LIMIT_EXCEEDED, "rate_limiter", `Rate limit exceeded for ${category} endpoints`, {
            userId,
            ipAddress: ip,
            userAgent: req.get("User-Agent"),
            metadata: {
                path,
                category,
                method: req.method,
            },
            correlationId: req.correlationId,
        });
        res.set({
            "X-Rate-Limit-Category": category,
            "X-Rate-Limit-Reset": new Date(Date.now() + 60000).toISOString(),
        });
    }
    use(req, res, next) {
        if (!req.correlationId) {
            req.correlationId = this.auditLogger.generateCorrelationId();
            res.set("X-Correlation-ID", req.correlationId);
        }
        const category = this.getEndpointCategory(req.path);
        const rateLimiter = this.rateLimiters.get(category) || this.rateLimiters.get("default");
        rateLimiter(req, res, (error) => {
            if (error) {
                this.logger.error("Rate limiting middleware error", error.stack);
            }
            next(error);
        });
    }
    async getRateLimitStatus(userId, ip) {
        const results = [];
        if (!this.redis) {
            this.logger.warn("Redis not available for rate limit status check");
            return results;
        }
        for (const [category] of this.rateLimiters) {
            try {
                const key = userId
                    ? `user:${userId}:${category}`
                    : `ip:${ip}:${category}`;
                const count = await this.redis.get(key);
                const ttl = await this.redis.ttl(key);
                const maxRequests = this.getMaxRequestsForCategory(category);
                const remaining = Math.max(0, maxRequests - parseInt(count || "0"));
                const resetTime = new Date(Date.now() + ttl * 1000);
                results.push({
                    category,
                    remaining,
                    resetTime,
                });
            }
            catch (error) {
                this.logger.error(`Failed to get rate limit status for ${category}`, error.stack);
            }
        }
        return results;
    }
    getMaxRequestsForCategory(category) {
        const limits = {
            ai: 10,
            tasks: 60,
            auth: 5,
            projects: 30,
            users: 30,
            default: 100,
        };
        return limits[category] || limits.default;
    }
    async resetRateLimit(userId, ip, category) {
        if (!this.redis) {
            this.logger.warn("Redis not available for rate limit reset");
            return;
        }
        try {
            if (category) {
                const key = userId
                    ? `user:${userId}:${category}`
                    : `ip:${ip}:${category}`;
                await this.redis.del(key);
                this.logger.log(`Reset rate limit for ${key}`);
            }
            else {
                const pattern = userId ? `user:${userId}:*` : `ip:${ip}:*`;
                const keys = await this.redis.keys(pattern);
                if (keys.length > 0) {
                    await this.redis.del(...keys);
                    this.logger.log(`Reset all rate limits for ${userId || ip}`);
                }
            }
        }
        catch (error) {
            this.logger.error("Failed to reset rate limit", error.stack);
            throw new Error("Failed to reset rate limit");
        }
    }
};
exports.RateLimitingMiddleware = RateLimitingMiddleware;
exports.RateLimitingMiddleware = RateLimitingMiddleware = RateLimitingMiddleware_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [audit_logger_service_1.AuditLoggerService])
], RateLimitingMiddleware);
//# sourceMappingURL=rate-limiting.middleware.js.map