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
var SecurityHeadersMiddleware_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityHeadersMiddleware = void 0;
const common_1 = require("@nestjs/common");
const helmet_1 = require("helmet");
let SecurityHeadersMiddleware = SecurityHeadersMiddleware_1 = class SecurityHeadersMiddleware {
    constructor() {
        this.logger = new common_1.Logger(SecurityHeadersMiddleware_1.name);
        this.setupHelmet();
    }
    setupHelmet() {
        const isDevelopment = process.env.NODE_ENV === 'development';
        const allowedOrigins = this.getAllowedOrigins();
        this.helmetMiddleware = (0, helmet_1.default)({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: [
                        "'self'",
                        "'unsafe-inline'",
                        "fonts.googleapis.com",
                    ],
                    fontSrc: [
                        "'self'",
                        "fonts.gstatic.com",
                        "data:",
                    ],
                    scriptSrc: [
                        "'self'",
                        ...(isDevelopment ? ["'unsafe-eval'"] : []),
                    ],
                    imgSrc: [
                        "'self'",
                        "data:",
                        "https:",
                    ],
                    connectSrc: [
                        "'self'",
                        ...allowedOrigins,
                        "wss:",
                        "https://api.openai.com",
                    ],
                    frameSrc: ["'none'"],
                    objectSrc: ["'none'"],
                    baseUri: ["'self'"],
                    formAction: ["'self'"],
                },
                reportOnly: isDevelopment,
            },
            crossOriginEmbedderPolicy: false,
            crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
            crossOriginResourcePolicy: { policy: 'cross-origin' },
            dnsPrefetchControl: { allow: false },
            frameguard: { action: 'deny' },
            hidePoweredBy: true,
            hsts: {
                maxAge: 31536000,
                includeSubDomains: true,
                preload: true,
            },
            ieNoOpen: true,
            noSniff: true,
            originAgentCluster: true,
            permittedCrossDomainPolicies: false,
            referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
            xssFilter: true,
        });
    }
    getAllowedOrigins() {
        const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3333';
        const additionalOrigins = process.env.ADDITIONAL_CORS_ORIGINS?.split(',') || [];
        return [corsOrigin, ...additionalOrigins].filter(Boolean);
    }
    use(req, res, next) {
        this.addCustomHeaders(req, res);
        this.helmetMiddleware(req, res, (error) => {
            if (error) {
                this.logger.error('Security headers middleware error', error.stack);
            }
            next(error);
        });
    }
    addCustomHeaders(req, res) {
        res.removeHeader('X-Powered-By');
        res.removeHeader('Server');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Download-Options', 'noopen');
        res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
        res.setHeader('Permissions-Policy', [
            'camera=()',
            'microphone=()',
            'geolocation=()',
            'payment=()',
            'usb=()',
            'magnetometer=()',
            'accelerometer=()',
            'gyroscope=()',
        ].join(', '));
        if (process.env.NODE_ENV === 'production') {
            res.setHeader('Expect-CT', 'max-age=86400, enforce');
        }
        res.setHeader('X-API-Version', process.env.API_VERSION || '1.0.0');
        if (process.env.NODE_ENV === 'development') {
            res.setHeader('X-Development-Warning', 'This is a development environment');
        }
    }
    generateNonce() {
        return Buffer.from(Date.now().toString()).toString('base64');
    }
    addNonceToResponse(res, nonce) {
        res.locals.nonce = nonce;
        res.setHeader('X-CSP-Nonce', nonce);
    }
    isOriginAllowed(origin) {
        const allowedOrigins = this.getAllowedOrigins();
        return allowedOrigins.includes(origin);
    }
    requireHTTPS(req, res, next) {
        if (process.env.NODE_ENV === 'production' && !req.secure && req.get('x-forwarded-proto') !== 'https') {
            this.logger.warn(`HTTP request rejected in production: ${req.url}`);
            res.status(426).json({
                error: 'HTTPS Required',
                message: 'This endpoint requires a secure connection',
            });
            return;
        }
        next();
    }
};
exports.SecurityHeadersMiddleware = SecurityHeadersMiddleware;
exports.SecurityHeadersMiddleware = SecurityHeadersMiddleware = SecurityHeadersMiddleware_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], SecurityHeadersMiddleware);
//# sourceMappingURL=security-headers.middleware.js.map