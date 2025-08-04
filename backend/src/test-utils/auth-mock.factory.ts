import { AuthService } from '../auth_disabled/auth.service';
import { SessionManagerService } from '../auth_disabled/services/session-manager.service';
import { TokenManagerService } from '../auth_disabled/services/token-manager.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

/**
 * Creates a type-safe mock AuthService for testing
 */
export function createMockAuthService(): jest.Mocked<AuthService> {
  return {
    validateUser: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    initiateGoogleAuth: jest.fn(),
    handleGoogleCallback: jest.fn(),
    initiateMicrosoftAuth: jest.fn(),
    handleMicrosoftCallback: jest.fn(),
    getCurrentUser: jest.fn(),
    validateToken: jest.fn(),
    refreshToken: jest.fn(),
  } as unknown as jest.Mocked<AuthService>;
}

/**
 * Creates a type-safe mock SessionManagerService for testing
 */
export function createMockSessionManagerService(): jest.Mocked<SessionManagerService> {
  return {
    createSession: jest.fn(),
    refreshSession: jest.fn(),
    revokeSession: jest.fn(),
    revokeAllUserSessions: jest.fn(),
    validateSession: jest.fn(),
    cleanupExpiredSessions: jest.fn(),
    getUserActiveSessions: jest.fn(),
    getUserSessions: jest.fn(),
    terminateSession: jest.fn(),
    terminateAllSessions: jest.fn(),
    getActiveSessions: jest.fn(),
  } as unknown as jest.Mocked<SessionManagerService>;
}

/**
 * Creates a type-safe mock TokenManagerService for testing
 */
export function createMockTokenManagerService(): jest.Mocked<TokenManagerService> {
  return {
    generateAccessToken: jest.fn(),
    generateRefreshToken: jest.fn(),
    validateToken: jest.fn(),
    revokeToken: jest.fn(),
    isTokenBlacklisted: jest.fn(),
    encryptToken: jest.fn(),
    decryptToken: jest.fn(),
    verifyAccessToken: jest.fn(),
    verifyRefreshToken: jest.fn(),
    blacklistToken: jest.fn(),
    cleanupExpiredTokens: jest.fn(),
  } as unknown as jest.Mocked<TokenManagerService>;
}

/**
 * Creates a mock JwtService for testing
 */
export function createMockJwtService(): jest.Mocked<JwtService> {
  return {
    sign: jest.fn(),
    signAsync: jest.fn(),
    verify: jest.fn(),
    verifyAsync: jest.fn(),
    decode: jest.fn(),
  } as unknown as jest.Mocked<JwtService>;
}

/**
 * Creates a mock ConfigService for testing with sensible defaults
 */
export function createMockConfigService(overrides: Record<string, any> = {}) {
  const defaultConfig = {
    // Session configuration
    MAX_SESSIONS_PER_USER: 5,
    SESSION_TIMEOUT_HOURS: 24,

    // JWT configuration
    JWT_SECRET: 'test-secret-key-for-testing',
    JWT_EXPIRES_IN: '15m',
    JWT_REFRESH_EXPIRES_IN: '30d',
    JWT_ENCRYPTION_KEY: 'test-encryption-key-32-chars-long',

    // OAuth configuration
    GOOGLE_CLIENT_ID: 'test-google-client-id',
    GOOGLE_CLIENT_SECRET: 'test-google-client-secret',
    MICROSOFT_CLIENT_ID: 'test-microsoft-client-id',
    MICROSOFT_CLIENT_SECRET: 'test-microsoft-client-secret',

    // Environment
    NODE_ENV: 'test',
    FRONTEND_URL: 'http://localhost:3000',

    // Database
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test_db',
  };

  return {
    get: jest.fn((key: string) => overrides[key] ?? defaultConfig[key]),
    getOrThrow: jest.fn((key: string) => {
      const value = overrides[key] ?? defaultConfig[key];
      if (value === undefined) {
        throw new Error(`Configuration key "${key}" not found`);
      }
      return value;
    }),
  };
}

/**
 * Creates mock OAuth provider data for testing
 */
export function createMockOAuthProvider(overrides: Partial<any> = {}) {
  return {
    id: 'test-provider-id',
    provider: 'microsoft',
    providerId: 'ms-test-123',
    email: 'test@example.com',
    scopes: ['https://graph.microsoft.com/User.Read'],
    accessToken: 'encrypted-test-access-token',
    refreshToken: 'encrypted-test-refresh-token',
    tokenExpiry: new Date(Date.now() + 3600000), // 1 hour from now
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: 'test-user-id', // Add missing userId field
    ...overrides,
  };
}

/**
 * Creates mock user data with provider for testing
 */
export function createMockUserWithProvider(overrides: Partial<any> = {}) {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    avatar: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    oauthProviders: [createMockOAuthProvider()],
    ...overrides,
  };
}

/**
 * Creates mock session data for testing
 */
export function createMockSession(overrides: Partial<any> = {}) {
  return {
    id: 'test-session-id',
    sessionId: 'test-session-uuid',
    userId: 'test-user-id',
    accessToken: 'encrypted-access-token',
    refreshToken: 'encrypted-refresh-token',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    userAgent: 'test-user-agent',
    ipAddress: '127.0.0.1',
    ...overrides,
  };
}

/**
 * Creates mock JWT payload for testing
 */
export function createMockJwtPayload(overrides: Partial<any> = {}) {
  return {
    sub: 'test-user-id',
    email: 'test@example.com',
    sessionId: 'test-session-id',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 900, // 15 minutes from now
    ...overrides,
  };
}
