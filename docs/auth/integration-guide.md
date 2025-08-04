# OAuth2 Authentication Integration Guide

This guide provides step-by-step instructions for integrating the OAuth2 authentication system with the existing Helmsman application.

## 📋 Overview

The OAuth2 authentication system provides:

- Google and Microsoft OAuth2 authentication
- Secure JWT-based session management
- Calendar permission management
- User profile management
- Multi-provider support per user

## 🏗️ Integration Steps

### Step 1: Database Schema Updates

Apply the database migration to add authentication tables:

```bash
# Apply the migration
cd backend
npx prisma migrate dev --name add-oauth-authentication

# Generate Prisma client with new models
npx prisma generate
```

**Verify migration success:**

```sql
-- Check that new tables exist
\dt oauth_providers
\dt user_sessions
\dt blacklisted_tokens
```

### Step 2: Environment Configuration

Create environment files with required OAuth configuration:

```bash
# Copy environment template
cp .env.example .env.development

# Add OAuth configuration (see environment-config.md for details)
# Required variables:
# - JWT_SECRET
# - GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
# - MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET
# - ENCRYPTION_KEY
# - FRONTEND_URL
```

### Step 3: Install Required Dependencies

Add OAuth-related dependencies:

```bash
cd backend
npm install @azure/msal-node google-auth-library jsonwebtoken crypto-js

# TypeScript types
npm install -D @types/jsonwebtoken @types/crypto-js
```

### Step 4: Implement Core Services

Create the authentication service implementations based on the architectural design:

#### A. Token Manager Service

```typescript
// backend/src/auth/services/token-manager.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import * as crypto from 'crypto';
import { ITokenManager, JWTPayload } from '../types/auth.types';

@Injectable()
export class TokenManagerService implements ITokenManager {
  private readonly encryptionKey: Buffer;

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
    private configService: ConfigService
  ) {
    const key = this.configService.get<string>('ENCRYPTION_KEY');
    this.encryptionKey = Buffer.from(key, 'hex');
  }

  generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp' | 'jti'>): string {
    const jti = crypto.randomUUID();
    return this.jwtService.sign({ ...payload, jti });
  }

  generateRefreshToken(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  verifyAccessToken(token: string): JWTPayload {
    return this.jwtService.verify(token);
  }

  encryptToken(token: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-gcm', this.encryptionKey);

    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();
    return iv.toString('hex') + ':' + encrypted + ':' + authTag.toString('hex');
  }

  decryptToken(encryptedToken: string): string {
    const [ivHex, encrypted, authTagHex] = encryptedToken.split(':');

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipher('aes-256-gcm', this.encryptionKey);

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  async blacklistToken(tokenId: string, expiresAt: Date): Promise<void> {
    await this.prisma.blacklistedToken.create({
      data: { tokenId, expiresAt },
    });
  }

  async isTokenBlacklisted(tokenId: string): Promise<boolean> {
    const token = await this.prisma.blacklistedToken.findUnique({
      where: { tokenId },
    });
    return !!token && token.expiresAt > new Date();
  }

  async cleanupExpiredTokens(): Promise<void> {
    await this.prisma.blacklistedToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  }
}
```

#### B. OAuth Service Interface

```typescript
// backend/src/auth/services/oauth.service.ts
import { Injectable } from '@nestjs/common';
import { GoogleOAuthService } from './google-oauth.service';
import { MicrosoftOAuthService } from './microsoft-oauth.service';
import { IAuthService, OAuthProfile, AuthResult, SessionTokens } from '../types/auth.types';

@Injectable()
export class OAuthService implements IAuthService {
  constructor(
    private googleService: GoogleOAuthService,
    private microsoftService: MicrosoftOAuthService
  ) {}

  async initiateOAuth(
    provider: 'google' | 'microsoft',
    options?: { redirectUri?: string; scopes?: string[]; userId?: string }
  ): Promise<{ authUrl: string; state: string }> {
    switch (provider) {
      case 'google':
        return this.googleService.initiateOAuth(options);
      case 'microsoft':
        return this.microsoftService.initiateOAuth(options);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  async handleCallback(
    provider: 'google' | 'microsoft',
    code: string,
    state: string
  ): Promise<AuthResult> {
    switch (provider) {
      case 'google':
        return this.googleService.handleCallback(code, state);
      case 'microsoft':
        return this.microsoftService.handleCallback(code, state);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  // Additional methods implemented by base service...
}
```

### Step 5: Update Existing Services

#### A. Modify Users Service

Update the users service to work with the new authentication system:

```typescript
// backend/src/users/users.service.ts
// Add methods for OAuth integration:

async findOrCreateFromOAuth(profile: OAuthProfile): Promise<User> {
  let user = await this.prisma.user.findUnique({
    where: { email: profile.email },
    include: { oauthProviders: true }
  });

  if (!user) {
    user = await this.prisma.user.create({
      data: {
        email: profile.email,
        name: profile.name,
        avatar: profile.avatar,
        oauthProviders: {
          create: {
            provider: profile.provider,
            providerId: profile.id,
            email: profile.email,
            scopes: []
          }
        }
      },
      include: { oauthProviders: true }
    });
  }

  return user;
}
```

#### B. Update Auth Module

```typescript
// backend/src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokenManagerService } from './services/token-manager.service';
import { OAuthService } from './services/oauth.service';
import { GoogleOAuthService } from './services/google-oauth.service';
import { MicrosoftOAuthService } from './services/microsoft-oauth.service';
import { SessionMiddleware } from './middleware/session.middleware';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '15m'),
          issuer: configService.get<string>('JWT_ISSUER'),
          audience: configService.get<string>('JWT_AUDIENCE'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TokenManagerService,
    OAuthService,
    GoogleOAuthService,
    MicrosoftOAuthService,
    SessionMiddleware,
  ],
  exports: [AuthService, TokenManagerService, SessionMiddleware],
})
export class AuthModule {}
```

### Step 6: Update API Routes

#### A. Create New Auth Controller

```typescript
// backend/src/auth/auth.controller.ts
import { Controller, Get, Post, Query, Req, Res, Body, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { OAuthService } from './services/oauth.service';
import { AuthGuard } from './guards/auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private oauthService: OAuthService) {}

  @Get(':provider/login')
  async initiateLogin(
    @Param('provider') provider: 'google' | 'microsoft',
    @Query() query: { redirect_uri?: string; scopes?: string },
    @Res() res: Response
  ) {
    const scopes = query.scopes?.split(',');
    const { authUrl } = await this.oauthService.initiateOAuth(provider, {
      redirectUri: query.redirect_uri,
      scopes,
    });

    return res.redirect(authUrl);
  }

  @Get(':provider/callback')
  async handleCallback(
    @Param('provider') provider: 'google' | 'microsoft',
    @Query() query: { code: string; state: string; error?: string },
    @Res() res: Response
  ) {
    try {
      if (query.error) {
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=${query.error}`);
      }

      const result = await this.oauthService.handleCallback(provider, query.code, query.state);

      const redirectUrl = `${process.env.FRONTEND_URL}?token=${result.tokens.accessToken}&refresh=${result.tokens.refreshToken}`;
      return res.redirect(redirectUrl);
    } catch (error) {
      console.error('OAuth callback error:', error);
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
    }
  }

  @Post('refresh')
  async refreshToken(@Body() body: { refreshToken: string }) {
    return this.oauthService.refreshSession(body.refreshToken);
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  async logout(@Req() req: Request) {
    await this.oauthService.revokeSession(req.user.sessionId);
    return { success: true };
  }

  @Get('profile')
  @UseGuards(AuthGuard)
  async getProfile(@Req() req: Request) {
    // Return user profile with OAuth providers
    return req.user;
  }
}
```

#### B. Create Auth Guard

```typescript
// backend/src/auth/guards/auth.guard.ts
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { TokenManagerService } from '../services/token-manager.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private tokenManager: TokenManagerService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No access token provided');
    }

    try {
      const payload = this.tokenManager.verifyAccessToken(token);

      // Check if token is blacklisted
      const isBlacklisted = await this.tokenManager.isTokenBlacklisted(payload.jti);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }

      request.user = payload;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid access token');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
```

### Step 7: Frontend Integration Updates

#### A. Create Auth Context

```typescript
// frontend/src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (provider: 'google' | 'microsoft') => void;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for token in URL params (from OAuth callback)
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const refreshToken = urlParams.get('refresh');

    if (token && refreshToken) {
      localStorage.setItem('accessToken', token);
      localStorage.setItem('refreshToken', refreshToken);

      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);

      // Fetch user profile
      fetchUserProfile();
    } else {
      // Check existing tokens
      const existingToken = localStorage.getItem('accessToken');
      if (existingToken) {
        fetchUserProfile();
      } else {
        setIsLoading(false);
      }
    }
  }, []);

  const login = (provider: 'google' | 'microsoft') => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/${provider}/login`;
  };

  const logout = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // Token invalid, clear storage
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshToken: fetchUserProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

#### B. Create Login Component

```typescript
// frontend/src/components/auth/LoginPage.tsx
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';

export function LoginPage() {
  const { login, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to Helmsman
          </h2>
        </div>
        <div className="space-y-4">
          <Button
            onClick={() => login('google')}
            className="w-full flex justify-center items-center"
          >
            <GoogleIcon className="w-5 h-5 mr-3" />
            Continue with Google
          </Button>

          <Button
            onClick={() => login('microsoft')}
            className="w-full flex justify-center items-center"
            variant="outline"
          >
            <MicrosoftIcon className="w-5 h-5 mr-3" />
            Continue with Microsoft
          </Button>
        </div>
      </div>
    </div>
  );
}
```

#### C. Update App Layout

```typescript
// frontend/src/app/layout.tsx
import { AuthProvider } from '../contexts/AuthContext';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

### Step 8: Integration with Existing Calendar Services

Update the existing Google and Microsoft Graph services to use the new authentication system:

```typescript
// backend/src/integrations/google/google.service.ts
// Update to use OAuth tokens from database

async getCalendarEvents(userId: string, startDate: Date, endDate: Date) {
  // Get user's Google OAuth tokens
  const oauthProvider = await this.prisma.oAuthProvider.findUnique({
    where: {
      provider_userId: {
        provider: 'google',
        userId: userId
      }
    }
  });

  if (!oauthProvider || !oauthProvider.accessToken) {
    throw new Error('Google calendar access not configured');
  }

  // Decrypt and use the access token
  const accessToken = this.tokenManager.decryptToken(oauthProvider.accessToken);

  // Use token for Google Calendar API calls
  // ... existing calendar logic
}
```

### Step 9: Testing Integration

#### A. Unit Tests

```typescript
// backend/src/auth/auth.service.spec.ts
describe('AuthService', () => {
  // Test OAuth flows
  // Test token management
  // Test session handling
  // Test error scenarios
});
```

#### B. Integration Tests

```typescript
// backend/test/auth.e2e-spec.ts
describe('Authentication (e2e)', () => {
  // Test complete OAuth flows
  // Test API endpoint protection
  // Test token refresh
  // Test logout functionality
});
```

#### C. Frontend Tests

```typescript
// frontend/src/components/auth/__tests__/LoginPage.test.tsx
describe('LoginPage', () => {
  // Test OAuth provider buttons
  // Test loading states
  // Test error handling
});
```

### Step 10: Deployment Updates

#### A. Environment Variables

Ensure all required environment variables are configured in deployment environments.

#### B. Database Migration

Run database migrations in production:

```bash
npx prisma migrate deploy
```

#### C. OAuth App Configuration

Configure OAuth applications in Google Cloud Console and Azure Portal with production redirect URIs.

## 🔍 Integration Verification

### Checklist

- [ ] Database schema updated successfully
- [ ] Environment variables configured
- [ ] OAuth applications created and configured
- [ ] Backend services implemented and tested
- [ ] API endpoints working correctly
- [ ] Frontend authentication flow working
- [ ] Calendar integration updated to use new auth
- [ ] Unit and integration tests passing
- [ ] Production deployment configured

### Testing OAuth Flow

1. Start application in development mode
2. Navigate to login page
3. Click "Continue with Google" or "Continue with Microsoft"
4. Complete OAuth flow
5. Verify user is authenticated
6. Test API access with JWT token
7. Test token refresh
8. Test logout functionality

## 🚀 Next Steps

With the OAuth2 authentication architecture fully designed and documented, the next implementation steps are:

1. **Implement Google OAuth2 Integration** (Subtask 2)
2. **Implement Microsoft OAuth2 Integration** (Subtask 3)
3. **Implement User Session Management** (Subtask 4)
4. **Implement Frontend Authentication Integration** (Subtask 5)

This architectural foundation provides the complete blueprint for implementing a production-ready OAuth2 authentication system with proper security, session management, and integration with existing calendar services.
