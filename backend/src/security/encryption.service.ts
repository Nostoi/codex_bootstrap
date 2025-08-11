import { Injectable, Logger } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';
import { getErrorMessage } from '../common/utils/error.utils';

const scryptAsync = promisify(scrypt);

export interface EncryptionResult {
  encrypted: string;
  iv: string;
  authTag: string;
}

@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16; // 128 bits
  private readonly tagLength = 16; // 128 bits

  private async deriveKey(password: string, salt: Buffer): Promise<Buffer> {
    return (await scryptAsync(password, salt, this.keyLength)) as Buffer;
  }

  private getEncryptionKey(): string {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
      throw new Error('ENCRYPTION_KEY environment variable is required');
    }
    if (key.length < 32) {
      throw new Error('ENCRYPTION_KEY must be at least 32 characters long');
    }
    return key;
  }

  /**
   * Encrypt sensitive text data using AES-256-GCM
   * @param text The plaintext to encrypt
   * @param additionalData Optional additional authenticated data
   * @returns Encryption result with encrypted data, IV, and auth tag
   */
  async encrypt(text: string, additionalData?: string): Promise<EncryptionResult> {
    try {
      const password = this.getEncryptionKey();
      const salt = randomBytes(16);
      const iv = randomBytes(this.ivLength);
      const key = await this.deriveKey(password, salt);

      const cipher = createCipheriv(this.algorithm, key, iv);

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
    } catch (error) {
      this.logger.error('Failed to encrypt data', getErrorMessage(error));
      // Re-throw the original error if it's from our validation
      if (error instanceof Error && error.message.includes('ENCRYPTION_KEY')) {
        throw error;
      }
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt sensitive text data using AES-256-GCM
   * @param encryptionResult The result from encrypt() method
   * @param additionalData Optional additional authenticated data (must match encryption)
   * @returns Decrypted plaintext
   */
  async decrypt(encryptionResult: EncryptionResult, additionalData?: string): Promise<string> {
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

      const decipher = createDecipheriv(this.algorithm, key, iv);
      decipher.setAuthTag(authTag);

      if (additionalData) {
        decipher.setAAD(Buffer.from(additionalData, 'utf8'));
      }

      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      this.logger.error('Failed to decrypt data', getErrorMessage(error));
      // Re-throw specific errors for better debugging
      if (error instanceof Error && error.message.includes('Invalid encrypted data format')) {
        throw error;
      }
      throw new Error('Decryption failed');
    }
  }

  /**
   * Encrypt JSON objects (serializes to string first)
   * @param data Object to encrypt
   * @param additionalData Optional additional authenticated data
   * @returns Encryption result
   */
  async encryptObject<T>(data: T, additionalData?: string): Promise<EncryptionResult> {
    const jsonString = JSON.stringify(data);
    return this.encrypt(jsonString, additionalData);
  }

  /**
   * Decrypt JSON objects (deserializes from string)
   * @param encryptionResult The result from encryptObject() method
   * @param additionalData Optional additional authenticated data (must match encryption)
   * @returns Decrypted object
   */
  async decryptObject<T>(encryptionResult: EncryptionResult, additionalData?: string): Promise<T> {
    const jsonString = await this.decrypt(encryptionResult, additionalData);
    return JSON.parse(jsonString);
  }

  /**
   * Generate a secure random encryption key for environment variables
   * @returns Random key suitable for ENCRYPTION_KEY
   */
  generateEncryptionKey(): string {
    return randomBytes(32).toString('hex');
  }
}
