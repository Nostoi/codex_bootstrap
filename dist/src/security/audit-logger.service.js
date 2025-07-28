"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var AuditLoggerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLoggerService = exports.AuditAction = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
var AuditAction;
(function (AuditAction) {
    AuditAction["LOGIN"] = "auth.login";
    AuditAction["LOGOUT"] = "auth.logout";
    AuditAction["LOGIN_FAILED"] = "auth.login_failed";
    AuditAction["TOKEN_REFRESH"] = "auth.token_refresh";
    AuditAction["PERMISSION_DENIED"] = "auth.permission_denied";
    AuditAction["TASK_CREATE"] = "task.create";
    AuditAction["TASK_UPDATE"] = "task.update";
    AuditAction["TASK_DELETE"] = "task.delete";
    AuditAction["TASK_STATUS_CHANGE"] = "task.status_change";
    AuditAction["TASK_DEPENDENCY_ADD"] = "task.dependency.add";
    AuditAction["TASK_DEPENDENCY_REMOVE"] = "task.dependency.remove";
    AuditAction["AI_TASK_EXTRACTION"] = "ai.task_extraction";
    AuditAction["AI_TASK_CLASSIFICATION"] = "ai.task_classification";
    AuditAction["AI_SUGGESTION_GENERATED"] = "ai.suggestion_generated";
    AuditAction["AI_SUGGESTION_ACCEPTED"] = "ai.suggestion_accepted";
    AuditAction["AI_SUGGESTION_REJECTED"] = "ai.suggestion_rejected";
    AuditAction["USER_SETTINGS_UPDATE"] = "user.settings_update";
    AuditAction["USER_PROFILE_UPDATE"] = "user.profile_update";
    AuditAction["PROJECT_CREATE"] = "project.create";
    AuditAction["PROJECT_UPDATE"] = "project.update";
    AuditAction["PROJECT_DELETE"] = "project.delete";
    AuditAction["RATE_LIMIT_EXCEEDED"] = "security.rate_limit_exceeded";
    AuditAction["SUSPICIOUS_ACTIVITY"] = "security.suspicious_activity";
    AuditAction["DATA_ENCRYPTION"] = "security.data_encryption";
    AuditAction["DATA_DECRYPTION"] = "security.data_decryption";
})(AuditAction || (exports.AuditAction = AuditAction = {}));
let AuditLoggerService = AuditLoggerService_1 = class AuditLoggerService {
    constructor() {
        this.logger = new common_1.Logger(AuditLoggerService_1.name);
        this.retentionDays = parseInt(process.env.AUDIT_LOG_RETENTION_DAYS || '90');
    }
    async logSuccess(action, resource, context = {}) {
        const entry = this.createAuditEntry({
            ...context,
            action,
            resource,
            success: true,
        });
        await this.writeAuditLog(entry);
    }
    async logFailure(action, resource, error, context = {}) {
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
    async logTaskChange(action, taskId, changes, userId, correlationId) {
        await this.logSuccess(action, 'task', {
            userId,
            resourceId: taskId,
            changes: this.sanitizeChanges(changes),
            correlationId,
        });
    }
    async logAIInteraction(action, input, output, userId, correlationId) {
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
    async logAuthEvent(action, userId, success, ipAddress, userAgent, errorMessage) {
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
        }
        else {
            await this.logFailure(action, 'auth', errorMessage || '', context);
        }
    }
    generateCorrelationId() {
        return (0, crypto_1.randomUUID)();
    }
    createAuditEntry(data) {
        return {
            id: (0, crypto_1.randomUUID)(),
            timestamp: new Date(),
            correlationId: data.correlationId || this.generateCorrelationId(),
            userId: data.userId,
            action: data.action,
            resource: data.resource,
            resourceId: data.resourceId,
            changes: data.changes,
            metadata: data.metadata,
            ipAddress: data.ipAddress,
            userAgent: data.userAgent,
            success: data.success,
            errorMessage: data.errorMessage,
        };
    }
    async writeAuditLog(entry) {
        try {
            const logMessage = {
                audit: true,
                ...entry,
                changes: entry.changes ? Object.keys(entry.changes) : undefined,
            };
            if (entry.success) {
                this.logger.log(logMessage, `Audit: ${entry.action}`);
            }
            else {
                this.logger.error(logMessage, `Audit Failed: ${entry.action}`);
            }
            await this.storeAuditEntry(entry);
        }
        catch (error) {
            this.logger.error('Failed to write audit log', error.stack);
        }
    }
    async storeAuditEntry(entry) {
        const auditDir = process.env.AUDIT_LOG_DIR || './logs/audit';
        const date = entry.timestamp.toISOString().split('T')[0];
        const filename = `audit-${date}.jsonl`;
        this.logger.debug(`Would store audit entry to ${auditDir}/${filename}`, { entry });
    }
    sanitizeChanges(changes) {
        const sanitized = {};
        for (const [field, change] of Object.entries(changes)) {
            if (this.isSensitiveField(field)) {
                sanitized[field] = {
                    before: change.before ? '[REDACTED]' : null,
                    after: change.after ? '[REDACTED]' : null,
                };
            }
            else {
                sanitized[field] = change;
            }
        }
        return sanitized;
    }
    sanitizeAIInput(input) {
        const maxLength = 500;
        let sanitized = input.length > maxLength ? input.substring(0, maxLength) + '...' : input;
        sanitized = sanitized.replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, '[CREDIT_CARD]');
        sanitized = sanitized.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]');
        sanitized = sanitized.replace(/\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b/g, '[SSN]');
        return sanitized;
    }
    sanitizeAIOutput(output) {
        if (typeof output === 'string') {
            return this.sanitizeAIInput(output);
        }
        if (Array.isArray(output)) {
            return output.map(item => this.sanitizeAIOutput(item));
        }
        if (typeof output === 'object' && output !== null) {
            const sanitized = {};
            for (const [key, value] of Object.entries(output)) {
                if (this.isSensitiveField(key)) {
                    sanitized[key] = '[REDACTED]';
                }
                else {
                    sanitized[key] = this.sanitizeAIOutput(value);
                }
            }
            return sanitized;
        }
        return output;
    }
    isSensitiveField(fieldName) {
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
        return sensitiveFields.some(sensitive => fieldName.toLowerCase().includes(sensitive.toLowerCase()));
    }
};
exports.AuditLoggerService = AuditLoggerService;
exports.AuditLoggerService = AuditLoggerService = AuditLoggerService_1 = __decorate([
    (0, common_1.Injectable)()
], AuditLoggerService);
//# sourceMappingURL=audit-logger.service.js.map