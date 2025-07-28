"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var EncryptionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EncryptionService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const util_1 = require("util");
const scryptAsync = (0, util_1.promisify)(crypto_1.scrypt);
let EncryptionService = EncryptionService_1 = class EncryptionService {
    constructor() {
        this.logger = new common_1.Logger(EncryptionService_1.name);
        this.algorithm = 'aes-256-gcm';
        this.keyLength = 32;
        this.ivLength = 16;
        this.tagLength = 16;
    }
    async deriveKey(password, salt) {
        return (await scryptAsync(password, salt, this.keyLength));
    }
    getEncryptionKey() {
        const key = process.env.ENCRYPTION_KEY;
        if (!key) {
            throw new Error('ENCRYPTION_KEY environment variable is required');
        }
        if (key.length < 32) {
            throw new Error('ENCRYPTION_KEY must be at least 32 characters long');
        }
        return key;
    }
    async encrypt(text, additionalData) {
        try {
            const password = this.getEncryptionKey();
            const salt = (0, crypto_1.randomBytes)(16);
            const iv = (0, crypto_1.randomBytes)(this.ivLength);
            const key = await this.deriveKey(password, salt);
            const cipher = (0, crypto_1.createCipheriv)(this.algorithm, key, iv);
            if (additionalData) {
                cipher.setAAD(Buffer.from(additionalData, 'utf8'));
            }
            let encrypted = cipher.update(text, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            const authTag = cipher.getAuthTag();
            return {
                encrypted: `${salt.toString('hex')}:${encrypted}`,
                iv: iv.toString('hex'),
                authTag: authTag.toString('hex'),
            };
        }
        catch (error) {
            this.logger.error('Failed to encrypt data', error.stack);
            if (error instanceof Error && error.message.includes('ENCRYPTION_KEY')) {
                throw error;
            }
            throw new Error('Encryption failed');
        }
    }
    async decrypt(encryptionResult, additionalData) {
        try {
            const password = this.getEncryptionKey();
            const [saltHex, encryptedData] = encryptionResult.encrypted.split(':');
            if (!saltHex || encryptedData === undefined) {
                throw new Error('Invalid encrypted data format');
            }
            const salt = Buffer.from(saltHex, 'hex');
            const iv = Buffer.from(encryptionResult.iv, 'hex');
            const authTag = Buffer.from(encryptionResult.authTag, 'hex');
            const key = await this.deriveKey(password, salt);
            const decipher = (0, crypto_1.createDecipheriv)(this.algorithm, key, iv);
            decipher.setAuthTag(authTag);
            if (additionalData) {
                decipher.setAAD(Buffer.from(additionalData, 'utf8'));
            }
            let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        }
        catch (error) {
            this.logger.error('Failed to decrypt data', error.stack);
            if (error instanceof Error && error.message.includes('Invalid encrypted data format')) {
                throw error;
            }
            throw new Error('Decryption failed');
        }
    }
    async encryptObject(data, additionalData) {
        const jsonString = JSON.stringify(data);
        return this.encrypt(jsonString, additionalData);
    }
    async decryptObject(encryptionResult, additionalData) {
        const jsonString = await this.decrypt(encryptionResult, additionalData);
        return JSON.parse(jsonString);
    }
    generateEncryptionKey() {
        return (0, crypto_1.randomBytes)(32).toString('hex');
    }
};
exports.EncryptionService = EncryptionService;
exports.EncryptionService = EncryptionService = EncryptionService_1 = __decorate([
    (0, common_1.Injectable)()
], EncryptionService);
//# sourceMappingURL=encryption.service.js.map