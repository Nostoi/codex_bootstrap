export interface EncryptionResult {
    encrypted: string;
    iv: string;
    authTag: string;
}
export declare class EncryptionService {
    private readonly logger;
    private readonly algorithm;
    private readonly keyLength;
    private readonly ivLength;
    private readonly tagLength;
    private deriveKey;
    private getEncryptionKey;
    encrypt(text: string, additionalData?: string): Promise<EncryptionResult>;
    decrypt(encryptionResult: EncryptionResult, additionalData?: string): Promise<string>;
    encryptObject<T>(data: T, additionalData?: string): Promise<EncryptionResult>;
    decryptObject<T>(encryptionResult: EncryptionResult, additionalData?: string): Promise<T>;
    generateEncryptionKey(): string;
}
