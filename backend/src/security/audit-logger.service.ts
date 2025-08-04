import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  correlationId: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  changes?: Record<string, { before: any; after: any }>;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
}

export enum AuditAction {
  // Authentication
  LOGIN = 'auth.login',
  LOGOUT = 'auth.logout',
  LOGIN_FAILED = 'auth.login_failed',
  TOKEN_REFRESH = 'auth.token_refresh',
  PERMISSION_DENIED = 'auth.permission_denied',

  // Task operations
  TASK_CREATE = 'task.create',
  TASK_UPDATE = 'task.update',
  TASK_DELETE = 'task.delete',
  TASK_STATUS_CHANGE = 'task.status_change',
  TASK_DEPENDENCY_ADD = 'task.dependency.add',
  TASK_DEPENDENCY_REMOVE = 'task.dependency.remove',

  // AI interactions
  AI_TASK_EXTRACTION = 'ai.task_extraction',
  AI_TASK_CLASSIFICATION = 'ai.task_classification',
  AI_SUGGESTION_GENERATED = 'ai.suggestion_generated',
  AI_SUGGESTION_ACCEPTED = 'ai.suggestion_accepted',
  AI_SUGGESTION_REJECTED = 'ai.suggestion_rejected',

  // User settings
  USER_SETTINGS_UPDATE = 'user.settings_update',
  USER_PROFILE_UPDATE = 'user.profile_update',

  // Project operations
  PROJECT_CREATE = 'project.create',
  PROJECT_UPDATE = 'project.update',
  PROJECT_DELETE = 'project.delete',

  // Security events
  RATE_LIMIT_EXCEEDED = 'security.rate_limit_exceeded',
  SUSPICIOUS_ACTIVITY = 'security.suspicious_activity',
  DATA_ENCRYPTION = 'security.data_encryption',
  DATA_DECRYPTION = 'security.data_decryption',
}

@Injectable()
export class AuditLoggerService {
  private readonly logger = new Logger(AuditLoggerService.name);
  private readonly retentionDays = parseInt(process.env.AUDIT_LOG_RETENTION_DAYS || '90');

  /**
   * Log a successful audit event
   */
  async logSuccess(
    action: AuditAction,
    resource: string,
    context: {
      userId?: string;
      resourceId?: string;
      changes?: Record<string, { before: any; after: any }>;
      metadata?: Record<string, any>;
      ipAddress?: string;
      userAgent?: string;
      correlationId?: string;
    } = {}
  ): Promise<void> {
    const entry = this.createAuditEntry({
      ...context,
      action,
      resource,
      success: true,
    });

    await this.writeAuditLog(entry);
  }

  /**
   * Log a failed audit event
   */
  async logFailure(
    action: AuditAction,
    resource: string,
    error: string | Error,
    context: {
      userId?: string;
      resourceId?: string;
      metadata?: Record<string, any>;
      ipAddress?: string;
      userAgent?: string;
      correlationId?: string;
    } = {}
  ): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : error;

    const entry = this.createAuditEntry({
      ...context,
      action,
      resource,
      success: false,
      errorMessage,
    });

    await this.writeAuditLog(entry);
  }

  /**
   * Log a task modification with before/after changes
   */
  async logTaskChange(
    action: AuditAction,
    taskId: string,
    changes: Record<string, { before: any; after: any }>,
    userId?: string,
    correlationId?: string
  ): Promise<void> {
    await this.logSuccess(action, 'task', {
      userId,
      resourceId: taskId,
      changes: this.sanitizeChanges(changes),
      correlationId,
    });
  }

  /**
   * Log AI interaction with input/output sanitization
   */
  async logAIInteraction(
    action: AuditAction,
    input: string,
    output: any,
    userId?: string,
    correlationId?: string
  ): Promise<void> {
    const sanitizedInput = this.sanitizeAIInput(input);
    const sanitizedOutput = this.sanitizeAIOutput(output);

    await this.logSuccess(action, 'ai_service', {
      userId,
      metadata: {
        input: sanitizedInput,
        output: sanitizedOutput,
        inputLength: input.length,
        outputTokens: typeof output === 'string' ? output.split(' ').length : 0,
      },
      correlationId,
    });
  }

  /**
   * Log authentication events
   */
  async logAuthEvent(
    action: AuditAction,
    userId: string,
    success: boolean,
    ipAddress?: string,
    userAgent?: string,
    errorMessage?: string
  ): Promise<void> {
    const context = {
      userId,
      ipAddress,
      userAgent,
      metadata: {
        timestamp: new Date().toISOString(),
      },
    };

    if (success) {
      await this.logSuccess(action, 'auth', context);
    } else {
      await this.logFailure(action, 'auth', errorMessage || '', context);
    }
  }

  /**
   * Generate a correlation ID for tracing related operations
   */
  generateCorrelationId(): string {
    return randomUUID();
  }

  private createAuditEntry(data: Partial<AuditLogEntry>): AuditLogEntry {
    return {
      id: randomUUID(),
      timestamp: new Date(),
      correlationId: data.correlationId || this.generateCorrelationId(),
      userId: data.userId,
      action: data.action!,
      resource: data.resource!,
      resourceId: data.resourceId,
      changes: data.changes,
      metadata: data.metadata,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      success: data.success!,
      errorMessage: data.errorMessage,
    };
  }

  private async writeAuditLog(entry: AuditLogEntry): Promise<void> {
    try {
      // In production, this should write to a secure audit log storage
      // For now, using structured logging that can be captured by log aggregation
      const logMessage = {
        audit: true,
        ...entry,
        // Remove sensitive data from the main log message
        changes: entry.changes ? Object.keys(entry.changes) : undefined,
      };

      if (entry.success) {
        this.logger.log(logMessage, `Audit: ${entry.action}`);
      } else {
        this.logger.error(logMessage, `Audit Failed: ${entry.action}`);
      }

      // Store detailed audit entry (in production: database, secure file, or audit service)
      await this.storeAuditEntry(entry);
    } catch (error) {
      this.logger.error('Failed to write audit log', error.stack);
      // Don't throw - audit logging failures shouldn't break the application
    }
  }

  private async storeAuditEntry(entry: AuditLogEntry): Promise<void> {
    // TODO: Implement proper audit storage
    // Options:
    // 1. Database table (audit_logs) with retention policy
    // 2. Secure file storage with rotation
    // 3. External audit service (AWS CloudTrail, Azure Monitor, etc.)
    // 4. SIEM integration

    // For development, store in a structured format
    const auditDir = process.env.AUDIT_LOG_DIR || './logs/audit';
    const date = entry.timestamp.toISOString().split('T')[0];
    const filename = `audit-${date}.jsonl`;

    // This would write to file in production
    this.logger.debug(`Would store audit entry to ${auditDir}/${filename}`, {
      entry,
    });
  }

  private sanitizeChanges(
    changes: Record<string, { before: any; after: any }>
  ): Record<string, { before: any; after: any }> {
    const sanitized: Record<string, { before: any; after: any }> = {};

    for (const [field, change] of Object.entries(changes)) {
      // Don't log sensitive fields in full
      if (this.isSensitiveField(field)) {
        sanitized[field] = {
          before: change.before ? '[REDACTED]' : null,
          after: change.after ? '[REDACTED]' : null,
        };
      } else {
        sanitized[field] = change;
      }
    }

    return sanitized;
  }

  private sanitizeAIInput(input: string): string {
    // Remove or mask sensitive patterns in AI input
    const maxLength = 500; // Truncate very long inputs
    let sanitized = input.length > maxLength ? input.substring(0, maxLength) + '...' : input;

    // Mask potential sensitive patterns
    sanitized = sanitized.replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, '[CREDIT_CARD]');
    sanitized = sanitized.replace(
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      '[EMAIL]'
    );
    sanitized = sanitized.replace(/\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b/g, '[SSN]');

    return sanitized;
  }

  private sanitizeAIOutput(output: any): any {
    if (typeof output === 'string') {
      return this.sanitizeAIInput(output);
    }

    if (Array.isArray(output)) {
      return output.map(item => this.sanitizeAIOutput(item));
    }

    if (typeof output === 'object' && output !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(output)) {
        if (this.isSensitiveField(key)) {
          sanitized[key] = '[REDACTED]';
        } else {
          sanitized[key] = this.sanitizeAIOutput(value);
        }
      }
      return sanitized;
    }

    return output;
  }

  private isSensitiveField(fieldName: string): boolean {
    const sensitiveFields = [
      'password',
      'secret',
      'token',
      'key',
      'apiKey',
      'authToken',
      'refreshToken',
      'personalData',
      'ssn',
      'creditCard',
      'bankAccount',
    ];

    return sensitiveFields.some(sensitive =>
      fieldName.toLowerCase().includes(sensitive.toLowerCase())
    );
  }
}
