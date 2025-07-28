"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const encryption_service_1 = require("./encryption.service");
describe('EncryptionService', () => {
    let service;
    const originalEnv = process.env;
    beforeEach(async () => {
        process.env = {
            ...originalEnv,
            ENCRYPTION_KEY: 'test_encryption_key_32_characters_long_abcdef123456',
        };
        const module = await testing_1.Test.createTestingModule({
            providers: [encryption_service_1.EncryptionService],
        }).compile();
        service = module.get(encryption_service_1.EncryptionService);
    });
    afterEach(() => {
        process.env = originalEnv;
    });
    describe('encrypt and decrypt', () => {
        it('should encrypt and decrypt text successfully', async () => {
            const plaintext = 'sensitive data that needs encryption';
            const encrypted = await service.encrypt(plaintext);
            expect(encrypted.encrypted).toBeDefined();
            expect(encrypted.iv).toBeDefined();
            expect(encrypted.authTag).toBeDefined();
            const decrypted = await service.decrypt(encrypted);
            expect(decrypted).toBe(plaintext);
        });
        it('should encrypt and decrypt with additional authenticated data', async () => {
            const plaintext = 'secret message';
            const aad = 'additional authenticated data';
            const encrypted = await service.encrypt(plaintext, aad);
            const decrypted = await service.decrypt(encrypted, aad);
            expect(decrypted).toBe(plaintext);
        });
        it('should fail decryption with wrong additional authenticated data', async () => {
            const plaintext = 'secret message';
            const aad = 'correct aad';
            const wrongAad = 'wrong aad';
            const encrypted = await service.encrypt(plaintext, aad);
            await expect(service.decrypt(encrypted, wrongAad)).rejects.toThrow('Decryption failed');
        });
        it('should handle empty strings', async () => {
            const plaintext = '';
            const encrypted = await service.encrypt(plaintext);
            const decrypted = await service.decrypt(encrypted);
            expect(decrypted).toBe(plaintext);
        });
        it('should handle Unicode characters', async () => {
            const plaintext = '🔐 Unicode test with émojis and spëcial chars: 测试';
            const encrypted = await service.encrypt(plaintext);
            const decrypted = await service.decrypt(encrypted);
            expect(decrypted).toBe(plaintext);
        });
    });
    describe('encryptObject and decryptObject', () => {
        it('should encrypt and decrypt objects successfully', async () => {
            const data = {
                id: 123,
                name: 'John Doe',
                settings: {
                    theme: 'dark',
                    notifications: true,
                },
                tags: ['important', 'urgent'],
            };
            const encrypted = await service.encryptObject(data);
            const decrypted = await service.decryptObject(encrypted);
            expect(decrypted).toEqual(data);
        });
        it('should handle complex nested objects', async () => {
            const data = {
                user: {
                    profile: {
                        personal: {
                            ssn: '123-45-6789',
                            creditCard: '4111-1111-1111-1111',
                        },
                    },
                },
                metadata: null,
                timestamp: new Date().toISOString(),
            };
            const encrypted = await service.encryptObject(data);
            const decrypted = await service.decryptObject(encrypted);
            expect(decrypted).toEqual(data);
        });
    });
    describe('error handling', () => {
        it('should throw error when ENCRYPTION_KEY is missing', async () => {
            delete process.env.ENCRYPTION_KEY;
            await expect(service.encrypt('test')).rejects.toThrow('ENCRYPTION_KEY environment variable is required');
        });
        it('should throw error when ENCRYPTION_KEY is too short', async () => {
            process.env.ENCRYPTION_KEY = 'short_key';
            await expect(service.encrypt('test')).rejects.toThrow('ENCRYPTION_KEY must be at least 32 characters long');
        });
        it('should handle malformed encrypted data', async () => {
            const malformedData = {
                encrypted: 'invalid_format',
                iv: 'invalid_iv',
                authTag: 'invalid_tag',
            };
            await expect(service.decrypt(malformedData)).rejects.toThrow('Invalid encrypted data format');
        });
        it('should handle corrupted encrypted data', async () => {
            const plaintext = 'test data';
            const encrypted = await service.encrypt(plaintext);
            encrypted.encrypted = encrypted.encrypted.slice(0, -4) + 'xxxx';
            await expect(service.decrypt(encrypted)).rejects.toThrow('Decryption failed');
        });
    });
    describe('generateEncryptionKey', () => {
        it('should generate a valid encryption key', () => {
            const key = service.generateEncryptionKey();
            expect(key).toHaveLength(64);
            expect(/^[a-f0-9]{64}$/.test(key)).toBe(true);
        });
        it('should generate unique keys', () => {
            const key1 = service.generateEncryptionKey();
            const key2 = service.generateEncryptionKey();
            expect(key1).not.toBe(key2);
        });
    });
    describe('deterministic behavior', () => {
        it('should produce different encrypted results for same input', async () => {
            const plaintext = 'same input';
            const encrypted1 = await service.encrypt(plaintext);
            const encrypted2 = await service.encrypt(plaintext);
            expect(encrypted1.encrypted).not.toBe(encrypted2.encrypted);
            expect(encrypted1.iv).not.toBe(encrypted2.iv);
            const decrypted1 = await service.decrypt(encrypted1);
            const decrypted2 = await service.decrypt(encrypted2);
            expect(decrypted1).toBe(plaintext);
            expect(decrypted2).toBe(plaintext);
        });
    });
});
//# sourceMappingURL=encryption.service.spec.js.map