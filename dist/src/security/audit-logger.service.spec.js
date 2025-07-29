"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const audit_logger_service_1 = require("./audit-logger.service");
const common_1 = require("@nestjs/common");
describe("AuditLoggerService", () => {
    let service;
    let mockLogger;
    beforeEach(async () => {
        mockLogger = {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
            verbose: jest.fn(),
            fatal: jest.fn(),
            setContext: jest.fn(),
            localInstance: jest.fn(),
        };
        const module = await testing_1.Test.createTestingModule({
            providers: [
                audit_logger_service_1.AuditLoggerService,
                {
                    provide: common_1.Logger,
                    useValue: mockLogger,
                },
            ],
        }).compile();
        service = module.get(audit_logger_service_1.AuditLoggerService);
        Object.defineProperty(service, "logger", {
            value: mockLogger,
            writable: true,
            configurable: true,
        });
    });
    describe("logSuccess", () => {
        it("should log successful audit events", async () => {
            const action = audit_logger_service_1.AuditAction.TASK_CREATE;
            const resource = "task";
            const context = {
                userId: "user123",
                resourceId: "task456",
                ipAddress: "192.168.1.1",
                userAgent: "test-agent",
            };
            await service.logSuccess(action, resource, context);
            expect(mockLogger.log).toHaveBeenCalledWith(expect.objectContaining({
                audit: true,
                action,
                resource,
                success: true,
                userId: context.userId,
                resourceId: context.resourceId,
                ipAddress: context.ipAddress,
                userAgent: context.userAgent,
            }), `Audit: ${action}`);
        });
        it("should generate correlation ID if not provided", async () => {
            await service.logSuccess(audit_logger_service_1.AuditAction.TASK_CREATE, "task");
            const logCall = mockLogger.log.mock.calls[0];
            const logData = logCall[0];
            expect(logData.correlationId).toBeDefined();
            expect(typeof logData.correlationId).toBe("string");
        });
        it("should use provided correlation ID", async () => {
            const correlationId = "test-correlation-id";
            await service.logSuccess(audit_logger_service_1.AuditAction.TASK_CREATE, "task", {
                correlationId,
            });
            const logCall = mockLogger.log.mock.calls[0];
            const logData = logCall[0];
            expect(logData.correlationId).toBe(correlationId);
        });
    });
    describe("logFailure", () => {
        it("should log failed audit events with error message", async () => {
            const action = audit_logger_service_1.AuditAction.LOGIN_FAILED;
            const resource = "auth";
            const error = "Invalid credentials";
            const context = {
                userId: "user123",
                ipAddress: "192.168.1.1",
            };
            await service.logFailure(action, resource, error, context);
            expect(mockLogger.error).toHaveBeenCalledWith(expect.objectContaining({
                audit: true,
                action,
                resource,
                success: false,
                errorMessage: error,
                userId: context.userId,
                ipAddress: context.ipAddress,
            }), `Audit Failed: ${action}`);
        });
        it("should handle Error objects", async () => {
            const error = new Error("Test error message");
            await service.logFailure(audit_logger_service_1.AuditAction.LOGIN_FAILED, "auth", error);
            const logCall = mockLogger.error.mock.calls[0];
            const logData = logCall[0];
            expect(logData.errorMessage).toBe("Test error message");
        });
    });
    describe("logTaskChange", () => {
        it("should log task changes with sanitized data", async () => {
            const taskId = "task123";
            const changes = {
                title: { before: "Old Title", after: "New Title" },
                password: { before: "secret123", after: "newsecret456" },
                status: { before: "TODO", after: "DONE" },
            };
            const userId = "user123";
            await service.logTaskChange(audit_logger_service_1.AuditAction.TASK_UPDATE, taskId, changes, userId);
            const logCall = mockLogger.log.mock.calls[0];
            const logData = logCall[0];
            expect(logData.action).toBe(audit_logger_service_1.AuditAction.TASK_UPDATE);
            expect(logData.resourceId).toBe(taskId);
            expect(logData.userId).toBe(userId);
            expect(logData.changes).toEqual(["title", "password", "status"]);
        });
        it("should sanitize sensitive fields in changes", async () => {
            const service_with_access = service;
            const changes = {
                apiKey: { before: "key123", after: "key456" },
                title: { before: "Old", after: "New" },
            };
            const sanitized = service_with_access.sanitizeChanges(changes);
            expect(sanitized.apiKey.before).toBe("[REDACTED]");
            expect(sanitized.apiKey.after).toBe("[REDACTED]");
            expect(sanitized.title.before).toBe("Old");
            expect(sanitized.title.after).toBe("New");
        });
    });
    describe("logAIInteraction", () => {
        it("should log AI interactions with sanitized input/output", async () => {
            const action = audit_logger_service_1.AuditAction.AI_TASK_EXTRACTION;
            const input = "Extract tasks from: Call John at john@example.com about project";
            const output = {
                tasks: [{ title: "Call John", email: "john@example.com" }],
            };
            const userId = "user123";
            await service.logAIInteraction(action, input, output, userId);
            const logCall = mockLogger.log.mock.calls[0];
            const logData = logCall[0];
            expect(logData.action).toBe(action);
            expect(logData.userId).toBe(userId);
            expect(logData.metadata.input).toContain("Call John");
            expect(logData.metadata.input).toContain("[EMAIL]");
            expect(logData.metadata.inputLength).toBe(input.length);
        });
        it("should truncate very long AI inputs", async () => {
            const longInput = "a".repeat(1000);
            await service.logAIInteraction(audit_logger_service_1.AuditAction.AI_TASK_EXTRACTION, longInput, "output");
            const logCall = mockLogger.log.mock.calls[0];
            const logData = logCall[0];
            expect(logData.metadata.input.length).toBeLessThanOrEqual(503);
            expect(logData.metadata.input.endsWith("...")).toBe(true);
        });
    });
    describe("logAuthEvent", () => {
        it("should log successful authentication", async () => {
            const userId = "user123";
            const ipAddress = "192.168.1.1";
            const userAgent = "Mozilla/5.0";
            await service.logAuthEvent(audit_logger_service_1.AuditAction.LOGIN, userId, true, ipAddress, userAgent);
            expect(mockLogger.log).toHaveBeenCalledWith(expect.objectContaining({
                action: audit_logger_service_1.AuditAction.LOGIN,
                userId,
                ipAddress,
                userAgent,
                success: true,
            }), `Audit: ${audit_logger_service_1.AuditAction.LOGIN}`);
        });
        it("should log failed authentication", async () => {
            const userId = "user123";
            const errorMessage = "Invalid password";
            await service.logAuthEvent(audit_logger_service_1.AuditAction.LOGIN_FAILED, userId, false, "192.168.1.1", "test-agent", errorMessage);
            expect(mockLogger.error).toHaveBeenCalledWith(expect.objectContaining({
                action: audit_logger_service_1.AuditAction.LOGIN_FAILED,
                userId,
                success: false,
                errorMessage,
            }), `Audit Failed: ${audit_logger_service_1.AuditAction.LOGIN_FAILED}`);
        });
    });
    describe("generateCorrelationId", () => {
        it("should generate unique correlation IDs", () => {
            const id1 = service.generateCorrelationId();
            const id2 = service.generateCorrelationId();
            expect(id1).toBeDefined();
            expect(id2).toBeDefined();
            expect(id1).not.toBe(id2);
            expect(typeof id1).toBe("string");
            expect(typeof id2).toBe("string");
        });
    });
    describe("sensitive data sanitization", () => {
        it("should mask credit card numbers", () => {
            const service_with_access = service;
            const input = "Payment with card 4111-1111-1111-1111 failed";
            const sanitized = service_with_access.sanitizeAIInput(input);
            expect(sanitized).toContain("[CREDIT_CARD]");
            expect(sanitized).not.toContain("4111-1111-1111-1111");
        });
        it("should mask email addresses", () => {
            const service_with_access = service;
            const input = "Contact user@example.com for details";
            const sanitized = service_with_access.sanitizeAIInput(input);
            expect(sanitized).toContain("[EMAIL]");
            expect(sanitized).not.toContain("user@example.com");
        });
        it("should mask SSN numbers", () => {
            const service_with_access = service;
            const input = "SSN: 123-45-6789 on file";
            const sanitized = service_with_access.sanitizeAIInput(input);
            expect(sanitized).toContain("[SSN]");
            expect(sanitized).not.toContain("123-45-6789");
        });
        it("should identify sensitive fields correctly", () => {
            const service_with_access = service;
            expect(service_with_access.isSensitiveField("password")).toBe(true);
            expect(service_with_access.isSensitiveField("apiKey")).toBe(true);
            expect(service_with_access.isSensitiveField("authToken")).toBe(true);
            expect(service_with_access.isSensitiveField("title")).toBe(false);
            expect(service_with_access.isSensitiveField("description")).toBe(false);
        });
    });
    describe("error handling", () => {
        it("should not throw when logging fails", async () => {
            mockLogger.log.mockImplementation(() => {
                throw new Error("Logging failed");
            });
            await expect(service.logSuccess(audit_logger_service_1.AuditAction.TASK_CREATE, "task")).resolves.not.toThrow();
            expect(mockLogger.error).toHaveBeenCalledWith("Failed to write audit log", expect.any(String));
        });
    });
});
//# sourceMappingURL=audit-logger.service.spec.js.map