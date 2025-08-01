/**
 * OAuth2 Authentication Typexport interface SessionTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  scopes: string[];
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
} Interfaces
 * Type definitions for the OAuth2 authentication system
 */

import { User, OAuthProvider } from '@prisma/client';

// Extended User type with OAuth providers
export interface UserWithProvider extends User {
  oauthProviders: Array<{
    id: string;
    provider: string;
    providerId: string;
    email: string;
    scopes: string[];
    accessToken?: string;
    refreshToken?: string;
    tokenExpiry?: Date;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
  }>;
}export interface OAuthProfile {
  providerId: string;
  provider: 'google' | 'microsoft';
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  picture?: string;
  accessToken: string;
  refreshToken?: string;
  scope: string[];
}

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  scopes: string[];
}

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface JWTPayload {
  sub: string; // User ID
  email: string;
  name?: string;
  jti: string; // JWT ID for blacklisting
  iat: number; // Issued at
  exp: number; // Expires at
  scopes: string[];
}

export interface AuthResult {
  user: {
    id: string;
    email: string;
    name?: string;
    avatar?: string;
  };
  tokens: SessionTokens;
  isNewUser: boolean;
}

export interface OAuthState {
  provider: 'google' | 'microsoft';
  redirectUri?: string;
  userId?: string;
  timestamp: number;
}

export interface CalendarPermissions {
  hasCalendarAccess: boolean;
  scopes: string[];
  provider: 'google' | 'microsoft';
  lastSyncAt?: Date;
}

// API Request/Response interfaces

export interface LoginInitiateRequest {
  provider: 'google' | 'microsoft';
  redirect_uri?: string;
  scopes?: string[];
}

export interface LoginInitiateResponse {
  authUrl: string;
  state: string;
}

export interface CallbackRequest {
  code: string;
  state: string;
  error?: string;
  error_description?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string; // ISO date string
}

export interface UserProfileResponse {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  providers: Array<{
    provider: 'google' | 'microsoft';
    email: string;
    hasCalendarAccess: boolean;
    scopes: string[];
  }>;
  createdAt: string;
  lastLoginAt: string;
}

export interface AuthError {
  code: string;
  message: string;
  details?: any;
}

// Standard OAuth error codes
export const AUTH_ERROR_CODES = {
  INVALID_PROVIDER: 'auth/invalid-provider',
  OAUTH_FAILED: 'auth/oauth-failed',
  TOKEN_EXPIRED: 'auth/token-expired',
  TOKEN_INVALID: 'auth/token-invalid',
  SESSION_INVALID: 'auth/session-invalid',
  INSUFFICIENT_PERMISSIONS: 'auth/insufficient-permissions',
  STATE_MISMATCH: 'auth/state-mismatch',
  USER_NOT_FOUND: 'auth/user-not-found',
  PROVIDER_ERROR: 'auth/provider-error',
  RATE_LIMITED: 'auth/rate-limited',
  INTERNAL_ERROR: 'auth/internal-error'
} as const;

// OAuth scopes for different providers
export const GOOGLE_SCOPES = {
  PROFILE: 'https://www.googleapis.com/auth/userinfo.profile',
  EMAIL: 'https://www.googleapis.com/auth/userinfo.email',
  CALENDAR_READONLY: 'https://www.googleapis.com/auth/calendar.readonly',
  CALENDAR: 'https://www.googleapis.com/auth/calendar',
  GMAIL_READONLY: 'https://www.googleapis.com/auth/gmail.readonly'
} as const;

export const MICROSOFT_SCOPES = {
  PROFILE: 'https://graph.microsoft.com/User.Read',
  EMAIL: 'https://graph.microsoft.com/Mail.Read',
  CALENDAR_READ: 'https://graph.microsoft.com/Calendars.Read',
  CALENDAR_WRITE: 'https://graph.microsoft.com/Calendars.ReadWrite',
  OFFLINE_ACCESS: 'offline_access'
} as const;

// Middleware interfaces
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name?: string;
    scopes: string[];
  };
  session?: {
    id: string;
    sessionId: string;
    expiresAt: Date;
  };
}

export interface RequiredScopes {
  google?: string[];
  microsoft?: string[];
  any?: boolean; // Allow if user has any valid provider
}

// Service interfaces
export interface IAuthService {
  // OAuth flow management
  initiateOAuth(
    provider: 'google' | 'microsoft', 
    options?: { redirectUri?: string; scopes?: string[]; userId?: string }
  ): Promise<{ authUrl: string; state: string }>;
  
  handleCallback(
    provider: 'google' | 'microsoft',
    code: string,
    state: string
  ): Promise<AuthResult>;
  
  // Session management
  createSession(user: any, metadata?: { userAgent?: string; ipAddress?: string }): Promise<SessionTokens>;
  refreshSession(refreshToken: string): Promise<SessionTokens>;
  revokeSession(sessionId: string): Promise<void>;
  revokeAllUserSessions(userId: string): Promise<void>;
  
  // User management
  findOrCreateUser(oauthProfile: OAuthProfile): Promise<any>;
  linkProvider(userId: string, provider: OAuthProfile, tokens: OAuthTokens): Promise<void>;
  unlinkProvider(userId: string, provider: 'google' | 'microsoft'): Promise<void>;
  
  // Calendar permissions
  requestCalendarPermissions(
    userId: string,
    provider: 'google' | 'microsoft'
  ): Promise<{ authUrl: string; state: string }>;
  
  getCalendarPermissions(userId: string): Promise<CalendarPermissions[]>;
}

export interface ITokenManager {
  // JWT operations
  generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp' | 'jti'>): string;
  generateRefreshToken(): string;
  verifyAccessToken(token: string): JWTPayload;
  verifyRefreshToken(token: string): Promise<{ userId: string; sessionId: string }>;
  
  // OAuth token management
  encryptToken(token: string): string;
  decryptToken(encryptedToken: string): string;
  
  // Token blacklisting
  blacklistToken(tokenId: string, expiresAt: Date): Promise<void>;
  isTokenBlacklisted(tokenId: string): Promise<boolean>;
  cleanupExpiredTokens(): Promise<void>;
}

export interface ISessionMiddleware {
  // Authentication middleware
  authenticate(required?: boolean): (req: any, res: any, next: any) => void;
  requireAuth(): (req: any, res: any, next: any) => void;
  
  // Permission checking
  requireScopes(scopes: RequiredScopes): (req: any, res: any, next: any) => void;
  requireCalendarAccess(provider?: 'google' | 'microsoft'): (req: any, res: any, next: any) => void;
  
  // Session management
  refreshTokenMiddleware(): (req: any, res: any, next: any) => void;
}

// Configuration interfaces
export interface OAuthConfig {
  google: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    scopes: string[];
  };
  microsoft: {
    clientId: string;
    clientSecret: string;
    tenantId: string;
    redirectUri: string;
    scopes: string[];
  };
}

export interface JWTConfig {
  secret: string;
  expiresIn: string;
  refreshExpiresIn: string;
  issuer: string;
  audience: string;
}

export interface SecurityConfig {
  encryptionKey: string;
  maxSessionsPerUser: number;
  sessionTimeout: number;
  tokenCleanupInterval: number;
  rateLimiting: {
    windowMs: number;
    maxRequests: number;
  };
}
