import { AuthResult, OAuthProfile, SessionTokens } from '../types/auth.types';

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
  createSession(
    user: any,
    metadata?: { userAgent?: string; ipAddress?: string }
  ): Promise<SessionTokens>;
  refreshSession(refreshToken: string): Promise<SessionTokens>;
  revokeSession(sessionId: string): Promise<void>;
  revokeAllUserSessions(userId: string): Promise<void>;

  // User management
  findOrCreateUser(oauthProfile: OAuthProfile): Promise<any>;
  linkProvider(userId: string, provider: OAuthProfile, tokens: any): Promise<void>;
  unlinkProvider(userId: string, provider: 'google' | 'microsoft'): Promise<void>;

  // Calendar permissions
  requestCalendarPermissions(
    userId: string,
    provider: 'google' | 'microsoft'
  ): Promise<{ authUrl: string; state: string }>;
}
