/**
 * Quick validation test for User Session Management
 * This tests the core JWT token and session functionality we implemented
 */

import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TokenManagerService } from './services/token-manager.service';
import { SessionManagerService } from './services/session-manager.service';
import { PrismaService } from '../prisma/prisma.service';

describe('User Session Management Validation', () => {
  let tokenManagerService: TokenManagerService;
  let sessionManagerService: SessionManagerService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    blacklistedToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    userSession: {
      create: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn().mockResolvedValue('mock-jwt-token'),
    verifyAsync: jest.fn().mockResolvedValue({ 
      sub: 'user-123', 
      jti: 'token-123',
      iat: Date.now() / 1000,
      exp: (Date.now() / 1000) + 3600 
    }),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      switch (key) {
        case 'JWT_SECRET': return 'test-secret';
        case 'JWT_ACCESS_EXPIRES_IN': return '15m';
        case 'JWT_REFRESH_EXPIRES_IN': return '7d';
        case 'ENCRYPTION_KEY': return 'test-encryption-key-32-characters!';
        default: return null;
      }
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenManagerService,
        SessionManagerService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    tokenManagerService = module.get<TokenManagerService>(TokenManagerService);
    sessionManagerService = module.get<SessionManagerService>(SessionManagerService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('TokenManagerService', () => {
    it('should be defined', () => {
      expect(tokenManagerService).toBeDefined();
    });

    it('should generate access token', async () => {
      const payload = { sub: 'user-123', email: 'test@example.com' };
      const token = await tokenManagerService.generateAccessToken(payload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: 'user-123',
          email: 'test@example.com',
          jti: expect.any(String),
        }),
        expect.objectContaining({
          expiresIn: '15m',
        })
      );
    });

    it('should verify refresh token', async () => {
      mockPrismaService.blacklistedToken.findUnique.mockResolvedValue(null);
      
      const payload = await tokenManagerService.verifyRefreshToken('mock-token');
      
      expect(payload).toBeDefined();
      expect(payload.sub).toBe('user-123');
      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith('mock-token');
      expect(mockPrismaService.blacklistedToken.findUnique).toHaveBeenCalled();
    });

    it('should blacklist token', async () => {
      mockPrismaService.blacklistedToken.create.mockResolvedValue({});
      
      await tokenManagerService.blacklistToken('token-123', new Date());
      
      expect(mockPrismaService.blacklistedToken.create).toHaveBeenCalledWith({
        data: {
          jti: 'token-123',
          expiresAt: expect.any(Date),
        },
      });
    });
  });

  describe('SessionManagerService', () => {
    it('should be defined', () => {
      expect(sessionManagerService).toBeDefined();
    });

    it('should create session', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const mockTokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        accessTokenId: 'access-id',
        refreshTokenId: 'refresh-id'
      };

      mockPrismaService.userSession.create.mockResolvedValue({
        id: 'session-123',
        userId: 'user-123',
        refreshTokenId: 'refresh-id',
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(),
        isActive: true,
        metadata: {}
      });

      // Mock token generation
      jest.spyOn(tokenManagerService, 'generateTokenPair').mockResolvedValue(mockTokens);

      const session = await sessionManagerService.createSession(mockUser, {});
      
      expect(session).toBeDefined();
      expect(session.tokens).toEqual(mockTokens);
      expect(session.session.userId).toBe('user-123');
      expect(mockPrismaService.userSession.create).toHaveBeenCalled();
    });

    it('should enforce session limit', async () => {
      mockPrismaService.userSession.count.mockResolvedValue(3);
      mockPrismaService.userSession.findMany.mockResolvedValue([
        { id: 'old-session', refreshTokenId: 'old-token', createdAt: new Date('2023-01-01') }
      ]);
      mockPrismaService.$transaction.mockImplementation((callback) => callback(mockPrismaService));

      await sessionManagerService.enforceSessionLimit('user-123');

      expect(mockPrismaService.userSession.count).toHaveBeenCalledWith({
        where: { userId: 'user-123', isActive: true }
      });
    });
  });

  describe('Integration Test', () => {
    it('should handle complete session lifecycle', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      
      // Mock successful session creation
      mockPrismaService.userSession.create.mockResolvedValue({
        id: 'session-123',
        userId: 'user-123',
        refreshTokenId: 'refresh-id',
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(),
        isActive: true,
        metadata: {}
      });

      // Mock token generation
      jest.spyOn(tokenManagerService, 'generateTokenPair').mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        accessTokenId: 'access-id',
        refreshTokenId: 'refresh-id'
      });

      // Create session
      const sessionResult = await sessionManagerService.createSession(mockUser, {});
      
      expect(sessionResult).toBeDefined();
      expect(sessionResult.tokens.accessToken).toBe('access-token');
      expect(sessionResult.tokens.refreshToken).toBe('refresh-token');
      expect(sessionResult.session.userId).toBe('user-123');
      
      // This validates our core session management flow
      console.log('✅ User Session Management validation successful');
    });
  });
});
