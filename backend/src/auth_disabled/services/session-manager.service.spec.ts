import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TokenManagerService } from '../services/token-manager.service';
import { SessionManagerService } from '../services/session-manager.service';
import { PrismaService } from '../../prisma/prisma.service';
import { UserWithProvider } from '../types/auth.types';
import { 
  createMockPrismaService,
  createMockJwtService,
  createMockConfigService,
  createMockTokenManagerService,
  createMockUserWithProvider,
  createMockSession,
  createMockJwtPayload
} from '../../test-utils';

describe('SessionManagerService', () => {
  let service: SessionManagerService;
  let tokenManager: jest.Mocked<TokenManagerService>;
  let prismaService: ReturnType<typeof createMockPrismaService>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: ReturnType<typeof createMockConfigService>;

  const mockUser: UserWithProvider = createMockUserWithProvider();

  const mockPrismaService = createMockPrismaService();
  const mockConfigService = createMockConfigService();
  const mockJwtService = createMockJwtService();
  const mockTokenManagerService = createMockTokenManagerService();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionManagerService,
        TokenManagerService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<SessionManagerService>(SessionManagerService);
    tokenManager = module.get<TokenManagerService>(TokenManagerService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createSession', () => {
    it('should create a new session successfully', async () => {
      const mockSession = {
        id: 'session-id',
        sessionId: 'session-uuid',
        userId: mockUser.id,
        accessToken: 'encrypted-access-token',
        refreshToken: 'encrypted-refresh-token',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        userAgent: 'test-agent',
        ipAddress: '127.0.0.1',
      };

      mockPrismaService.userSession.count.mockResolvedValue(2);
      mockPrismaService.userSession.create.mockResolvedValue(mockSession);
      
      // Mock token generation
      jest.spyOn(tokenManager, 'generateAccessToken').mockReturnValue('mock-access-token');
      jest.spyOn(tokenManager, 'generateRefreshToken').mockReturnValue('mock-refresh-token');
      jest.spyOn(tokenManager, 'encryptToken').mockReturnValue('encrypted-token');

      const result = await service.createSession(mockUser, {
        userAgent: 'test-agent',
        ipAddress: '127.0.0.1',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('expiresAt');
      expect(mockPrismaService.userSession.create).toHaveBeenCalled();
    });

    it('should enforce session limit by removing old sessions', async () => {
      const oldSessions = [
        { sessionId: 'old-session-1' },
        { sessionId: 'old-session-2' },
      ];

      mockPrismaService.userSession.count.mockResolvedValue(5); // At limit
      mockPrismaService.userSession.findMany.mockResolvedValue(oldSessions);
      mockPrismaService.userSession.create.mockResolvedValue({
        id: 'new-session',
        sessionId: 'new-session-uuid',
      });
      mockPrismaService.userSession.update.mockResolvedValue({});

      // Mock session revocation
      jest.spyOn(service, 'revokeSession').mockResolvedValue();
      jest.spyOn(tokenManager, 'generateAccessToken').mockReturnValue('mock-access-token');
      jest.spyOn(tokenManager, 'generateRefreshToken').mockReturnValue('mock-refresh-token');
      jest.spyOn(tokenManager, 'encryptToken').mockReturnValue('encrypted-token');

      await service.createSession(mockUser);

      expect(service.revokeSession).toHaveBeenCalledWith('old-session-1');
      expect(mockPrismaService.userSession.create).toHaveBeenCalled();
    });
  });

  describe('refreshSession', () => {
    it('should refresh session with token rotation', async () => {
      const mockSession = {
        id: 'session-id',
        sessionId: 'session-uuid',
        userId: mockUser.id,
        accessToken: 'old-encrypted-access-token',
        refreshToken: 'old-encrypted-refresh-token',
        user: mockUser,
        expiresAt: new Date(Date.now() + 1000000),
        isActive: true,
      };

      mockPrismaService.userSession.findFirst.mockResolvedValue(mockSession);
      mockPrismaService.userSession.update.mockResolvedValue({});

      jest.spyOn(tokenManager, 'verifyRefreshToken').mockResolvedValue({
        userId: mockUser.id,
        sessionId: 'session-uuid',
      });
      jest.spyOn(tokenManager, 'generateAccessToken').mockReturnValue('new-access-token');
      jest.spyOn(tokenManager, 'generateRefreshToken').mockReturnValue('new-refresh-token');
      jest.spyOn(tokenManager, 'encryptToken').mockReturnValue('encrypted-token');
      jest.spyOn(tokenManager, 'decryptToken').mockReturnValue('decrypted-token');
      jest.spyOn(tokenManager, 'verifyAccessToken').mockReturnValue({
        sub: mockUser.id,
        email: mockUser.email,
        jti: 'old-token-id',
        iat: Date.now(),
        exp: Date.now() + 1000,
        scopes: ['scope1'],
        name: mockUser.name,
      });
      jest.spyOn(tokenManager, 'blacklistToken').mockResolvedValue();

      const result = await service.refreshSession('old-refresh-token');

      expect(result).toHaveProperty('accessToken', 'new-access-token');
      expect(result).toHaveProperty('refreshToken', 'new-refresh-token');
      expect(mockPrismaService.userSession.update).toHaveBeenCalled();
      expect(tokenManager.blacklistToken).toHaveBeenCalled();
    });

    it('should throw error for invalid refresh token', async () => {
      jest.spyOn(tokenManager, 'verifyRefreshToken').mockRejectedValue(
        new Error('Invalid refresh token')
      );

      await expect(service.refreshSession('invalid-token'))
        .rejects.toThrow('Session refresh failed');
    });
  });

  describe('revokeSession', () => {
    it('should revoke session and blacklist token', async () => {
      const mockSession = {
        sessionId: 'session-uuid',
        accessToken: 'encrypted-access-token',
      };

      mockPrismaService.userSession.findUnique.mockResolvedValue(mockSession);
      mockPrismaService.userSession.update.mockResolvedValue({});

      jest.spyOn(tokenManager, 'decryptToken').mockReturnValue('decrypted-token');
      jest.spyOn(tokenManager, 'verifyAccessToken').mockReturnValue({
        jti: 'token-id',
        exp: Date.now() + 1000,
      } as any);
      jest.spyOn(tokenManager, 'blacklistToken').mockResolvedValue();

      await service.revokeSession('session-uuid');

      expect(mockPrismaService.userSession.update).toHaveBeenCalledWith({
        where: { sessionId: 'session-uuid' },
        data: { isActive: false },
      });
      expect(tokenManager.blacklistToken).toHaveBeenCalled();
    });
  });

  describe('validateSession', () => {
    it('should validate session and return user context', async () => {
      const mockSession = {
        id: 'session-id',
        sessionId: 'session-uuid',
        userId: mockUser.id,
        expiresAt: new Date(Date.now() + 1000000),
        isActive: true,
      };

      const mockTokenPayload = {
        sub: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        jti: 'token-id',
        iat: Date.now(),
        exp: Date.now() + 1000,
        scopes: ['scope1'],
      };

      jest.spyOn(tokenManager, 'verifyAccessToken').mockReturnValue(mockTokenPayload);
      jest.spyOn(tokenManager, 'isTokenBlacklisted').mockResolvedValue(false);
      mockPrismaService.userSession.findFirst.mockResolvedValue(mockSession);

      const result = await service.validateSession('valid-access-token');

      expect(result).toEqual({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          scopes: ['scope1'],
        },
        session: {
          id: mockSession.id,
          sessionId: mockSession.sessionId,
          expiresAt: mockSession.expiresAt,
        },
      });
    });

    it('should return null for blacklisted token', async () => {
      jest.spyOn(tokenManager, 'verifyAccessToken').mockReturnValue({
        jti: 'blacklisted-token',
      } as any);
      jest.spyOn(tokenManager, 'isTokenBlacklisted').mockResolvedValue(true);

      const result = await service.validateSession('blacklisted-token');

      expect(result).toBeNull();
    });

    it('should return null for invalid token', async () => {
      jest.spyOn(tokenManager, 'verifyAccessToken').mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = await service.validateSession('invalid-token');

      expect(result).toBeNull();
    });
  });

  describe('cleanupExpiredSessions', () => {
    it('should cleanup expired and inactive sessions', async () => {
      mockPrismaService.userSession.deleteMany.mockResolvedValue({ count: 3 });
      jest.spyOn(tokenManager, 'cleanupExpiredTokens').mockResolvedValue();

      await service.cleanupExpiredSessions();

      expect(mockPrismaService.userSession.deleteMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { expiresAt: { lt: expect.any(Date) } },
            { isActive: false },
          ],
        },
      });
      expect(tokenManager.cleanupExpiredTokens).toHaveBeenCalled();
    });
  });
});
