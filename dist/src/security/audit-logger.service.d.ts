export interface AuditLogEntry {
    id: string;
    timestamp: Date;
    correlationId: string;
    userId?: string;
    action: string;
    resource: string;
    resourceId?: string;
    changes?: Record<string, {
        before: any;
        after: any;
    }>;
    metadata?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    success: boolean;
    errorMessage?: string;
}
export declare enum AuditAction {
    LOGIN = "auth.login",
    LOGOUT = "auth.logout",
    LOGIN_FAILED = "auth.login_failed",
    TOKEN_REFRESH = "auth.token_refresh",
    PERMISSION_DENIED = "auth.permission_denied",
    TASK_CREATE = "task.create",
    TASK_UPDATE = "task.update",
    TASK_DELETE = "task.delete",
    TASK_STATUS_CHANGE = "task.status_change",
    TASK_DEPENDENCY_ADD = "task.dependency.add",
    TASK_DEPENDENCY_REMOVE = "task.dependency.remove",
    AI_TASK_EXTRACTION = "ai.task_extraction",
    AI_TASK_CLASSIFICATION = "ai.task_classification",
    AI_SUGGESTION_GENERATED = "ai.suggestion_generated",
    AI_SUGGESTION_ACCEPTED = "ai.suggestion_accepted",
    AI_SUGGESTION_REJECTED = "ai.suggestion_rejected",
    USER_SETTINGS_UPDATE = "user.settings_update",
    USER_PROFILE_UPDATE = "user.profile_update",
    PROJECT_CREATE = "project.create",
    PROJECT_UPDATE = "project.update",
    PROJECT_DELETE = "project.delete",
    RATE_LIMIT_EXCEEDED = "security.rate_limit_exceeded",
    SUSPICIOUS_ACTIVITY = "security.suspicious_activity",
    DATA_ENCRYPTION = "security.data_encryption",
    DATA_DECRYPTION = "security.data_decryption"
}
export declare class AuditLoggerService {
    private readonly logger;
    private readonly retentionDays;
    logSuccess(action: AuditAction, resource: string, context?: {
        userId?: string;
        resourceId?: string;
        changes?: Record<string, {
            before: any;
            after: any;
        }>;
        metadata?: Record<string, any>;
        ipAddress?: string;
        userAgent?: string;
        correlationId?: string;
    }): Promise<void>;
    logFailure(action: AuditAction, resource: string, error: string | Error, context?: {
        userId?: string;
        resourceId?: string;
        metadata?: Record<string, any>;
        ipAddress?: string;
        userAgent?: string;
        correlationId?: string;
    }): Promise<void>;
    logTaskChange(action: AuditAction, taskId: string, changes: Record<string, {
        before: any;
        after: any;
    }>, userId?: string, correlationId?: string): Promise<void>;
    logAIInteraction(action: AuditAction, input: string, output: any, userId?: string, correlationId?: string): Promise<void>;
    logAuthEvent(action: AuditAction, userId: string, success: boolean, ipAddress?: string, userAgent?: string, errorMessage?: string): Promise<void>;
    generateCorrelationId(): string;
    private createAuditEntry;
    private writeAuditLog;
    private storeAuditEntry;
    private sanitizeChanges;
    private sanitizeAIInput;
    private sanitizeAIOutput;
    private isSensitiveField;
}
