import { Injectable, NestMiddleware, Logger } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import helmet from "helmet";

@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SecurityHeadersMiddleware.name);
  private helmetMiddleware: any;

  constructor() {
    this.setupHelmet();
  }

  private setupHelmet(): void {
    const isDevelopment = process.env.NODE_ENV === "development";
    const allowedOrigins = this.getAllowedOrigins();

    this.helmetMiddleware = helmet({
      // Content Security Policy
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: [
            "'self'",
            "'unsafe-inline'", // Allow inline styles for development
            "fonts.googleapis.com",
          ],
          fontSrc: [
            "'self'",
            "fonts.gstatic.com",
            "data:", // Allow data URLs for fonts
          ],
          scriptSrc: [
            "'self'",
            ...(isDevelopment ? ["'unsafe-eval'"] : []), // Allow eval in development for HMR
          ],
          imgSrc: [
            "'self'",
            "data:",
            "https:", // Allow HTTPS images
          ],
          connectSrc: [
            "'self'",
            ...allowedOrigins,
            "wss:", // Allow WebSocket connections
            "https://api.openai.com", // OpenAI API
          ],
          frameSrc: ["'none'"], // Prevent framing
          objectSrc: ["'none'"], // Prevent object embedding
          baseUri: ["'self'"], // Restrict base URIs
          formAction: ["'self'"], // Restrict form actions
        },
        reportOnly: isDevelopment, // Only report violations in development
      },

      // Cross-Origin-Embedder-Policy
      crossOriginEmbedderPolicy: false, // Disable to allow external resources

      // Cross-Origin-Opener-Policy
      crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },

      // Cross-Origin-Resource-Policy
      crossOriginResourcePolicy: { policy: "cross-origin" },

      // DNS Prefetch Control
      dnsPrefetchControl: { allow: false },

      // Frameguard (X-Frame-Options)
      frameguard: { action: "deny" },

      // Hide X-Powered-By header
      hidePoweredBy: true,

      // HTTP Strict Transport Security (HSTS)
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },

      // IE No Open
      ieNoOpen: true,

      // No Sniff
      noSniff: true,

      // Origin Agent Cluster
      originAgentCluster: true,

      // Permitted Cross-Domain Policies
      permittedCrossDomainPolicies: false,

      // Referrer Policy
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },

      // X-XSS-Protection
      xssFilter: true,
    });
  }

  private getAllowedOrigins(): string[] {
    const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:3333";
    const additionalOrigins =
      process.env.ADDITIONAL_CORS_ORIGINS?.split(",") || [];

    return [corsOrigin, ...additionalOrigins].filter(Boolean);
  }

  use(req: Request, res: Response, next: NextFunction) {
    // Add custom security headers
    this.addCustomHeaders(req, res);

    // Apply Helmet middleware
    this.helmetMiddleware(req, res, (error?: any) => {
      if (error) {
        this.logger.error("Security headers middleware error", error.stack);
      }
      next(error);
    });
  }

  private addCustomHeaders(req: Request, res: Response): void {
    // Remove sensitive server information
    res.removeHeader("X-Powered-By");
    res.removeHeader("Server");

    // Add custom security headers
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Download-Options", "noopen");
    res.setHeader("X-Permitted-Cross-Domain-Policies", "none");

    // Feature Policy / Permissions Policy
    res.setHeader(
      "Permissions-Policy",
      [
        "camera=()",
        "microphone=()",
        "geolocation=()",
        "payment=()",
        "usb=()",
        "magnetometer=()",
        "accelerometer=()",
        "gyroscope=()",
      ].join(", "),
    );

    // Expect-CT (Certificate Transparency)
    if (process.env.NODE_ENV === "production") {
      res.setHeader("Expect-CT", "max-age=86400, enforce");
    }

    // Custom API versioning header
    res.setHeader("X-API-Version", process.env.API_VERSION || "1.0.0");

    // Security notice header for development
    if (process.env.NODE_ENV === "development") {
      res.setHeader(
        "X-Development-Warning",
        "This is a development environment",
      );
    }
  }

  /**
   * Generate nonce for inline scripts/styles
   * Should be used when CSP needs to allow specific inline content
   */
  generateNonce(): string {
    return Buffer.from(Date.now().toString()).toString("base64");
  }

  /**
   * Add CSP nonce to response for dynamic content
   */
  addNonceToResponse(res: Response, nonce: string): void {
    res.locals.nonce = nonce;
    res.setHeader("X-CSP-Nonce", nonce);
  }

  /**
   * Check if request is from allowed origin
   */
  isOriginAllowed(origin: string): boolean {
    const allowedOrigins = this.getAllowedOrigins();
    return allowedOrigins.includes(origin);
  }

  /**
   * Validate HTTPS requirement in production
   */
  requireHTTPS(req: Request, res: Response, next: NextFunction): void {
    if (
      process.env.NODE_ENV === "production" &&
      !req.secure &&
      req.get("x-forwarded-proto") !== "https"
    ) {
      this.logger.warn(`HTTP request rejected in production: ${req.url}`);
      res.status(426).json({
        error: "HTTPS Required",
        message: "This endpoint requires a secure connection",
      });
      return;
    }
    next();
  }
}
