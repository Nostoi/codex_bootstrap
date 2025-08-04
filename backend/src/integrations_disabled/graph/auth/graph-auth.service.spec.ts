import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { GraphAuthService } from "./graph-auth.service";
import { GraphConfigService } from "../config/graph-config.service";
import { PrismaService } from "../../../prisma/prisma.service";
import { ConfidentialClientApplication } from "@azure/msal-node";

// Mock MSAL
jest.mock("@azure/msal-node");

describe("GraphAuthService", () => {
  let service: GraphAuthService;
  let graphConfigService: GraphConfigService;
  let prismaService: PrismaService;
  let mockMsalInstance: jest.Mocked<ConfidentialClientApplication>;

  const mockConfig = {
    clientId: "test-client-id",
    clientSecret: "test-client-secret",
    tenantId: "test-tenant-id",
    redirectUri: "http://localhost:3000/api/graph/auth/callback",
  };

  beforeEach(async () => {
    mockMsalInstance = {
      getAuthCodeUrl: jest.fn(),
      acquireTokenByCode: jest.fn(),
      acquireTokenSilent: jest.fn(),
      getTokenCache: jest.fn(),
    } as any;

    (ConfidentialClientApplication as jest.Mock).mockImplementation(() => mockMsalInstance);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GraphAuthService,
        {
          provide: GraphConfigService,
          useValue: {
            getConfig: jest.fn().mockResolvedValue(mockConfig),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            integrationConfig: {
              findUnique: jest.fn(),
              upsert: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<GraphAuthService>(GraphAuthService);
    graphConfigService = module.get<GraphConfigService>(GraphConfigService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getAuthorizationUrl", () => {
    it("should generate authorization URL", async () => {
      const mockUrl = "https://login.microsoftonline.com/authorize?...";
      const userId = "test-user-id";

      mockMsalInstance.getAuthCodeUrl.mockResolvedValue(mockUrl);

      const result = await service.getAuthorizationUrl(userId);

      expect(result).toEqual({
        authUrl: mockUrl,
        state: expect.any(String),
      });

      expect(mockMsalInstance.getAuthCodeUrl).toHaveBeenCalledWith(
        expect.objectContaining({
          scopes: expect.arrayContaining([
            "https://graph.microsoft.com/User.Read",
            "https://graph.microsoft.com/Calendars.ReadWrite",
            "https://graph.microsoft.com/Files.ReadWrite",
            "https://graph.microsoft.com/Team.ReadBasic.All",
          ]),
          redirectUri: mockConfig.redirectUri,
          state: expect.any(String),
        })
      );
    });

    it("should handle MSAL errors", async () => {
      const userId = "test-user-id";
      const error = new Error("MSAL Error");

      mockMsalInstance.getAuthCodeUrl.mockRejectedValue(error);

      await expect(service.getAuthorizationUrl(userId)).rejects.toThrow("Failed to generate authorization URL");
    });
  });

  describe("handleCallback", () => {
    it("should handle successful callback", async () => {
      const code = "auth-code";
      const state = "test-state";
      const userId = "test-user-id";

      const mockTokenResponse = {
        accessToken: "access-token",
        refreshToken: "refresh-token",
        expiresOn: new Date(Date.now() + 3600000),
        account: {
          homeAccountId: "home-account-id",
          localAccountId: "local-account-id",
          username: "test@example.com",
          tenantId: "tenant-id",
        },
      };

      mockMsalInstance.acquireTokenByCode.mockResolvedValue(mockTokenResponse);
      jest.spyOn(prismaService.integrationConfig, "upsert").mockResolvedValue({} as any);

      const result = await service.handleCallback(code, state, userId);

      expect(result).toEqual({
        success: true,
        user: mockTokenResponse.account,
      });

      expect(mockMsalInstance.acquireTokenByCode).toHaveBeenCalledWith({
        code,
        scopes: expect.any(Array),
        redirectUri: mockConfig.redirectUri,
      });

      expect(prismaService.integrationConfig.upsert).toHaveBeenCalledWith({
        where: {
          provider_userId: {
            provider: "microsoft",
            userId,
          },
        },
        create: expect.objectContaining({
          provider: "microsoft",
          userId,
          accessToken: mockTokenResponse.accessToken,
          refreshToken: mockTokenResponse.refreshToken,
        }),
        update: expect.objectContaining({
          accessToken: mockTokenResponse.accessToken,
          refreshToken: mockTokenResponse.refreshToken,
        }),
      });
    });

    it("should handle callback errors", async () => {
      const code = "auth-code";
      const state = "test-state";
      const userId = "test-user-id";
      const error = new Error("MSAL Error");

      mockMsalInstance.acquireTokenByCode.mockRejectedValue(error);

      await expect(service.handleCallback(code, state, userId)).rejects.toThrow("Failed to handle OAuth callback");
    });
  });

  describe("getAccessToken", () => {
    it("should return valid token when not expired", async () => {
      const userId = "test-user-id";
      const mockConfig = {
        accessToken: "valid-token",
        expiresAt: new Date(Date.now() + 3600000),
        refreshToken: "refresh-token",
      };

      jest.spyOn(prismaService.integrationConfig, "findUnique").mockResolvedValue(mockConfig as any);

      const result = await service.getAccessToken(userId);

      expect(result).toBe("valid-token");
    });

    it("should refresh token when expired", async () => {
      const userId = "test-user-id";
      const mockConfig = {
        accessToken: "expired-token",
        expiresAt: new Date(Date.now() - 1000),
        refreshToken: "refresh-token",
        accountId: "account-id",
      };

      const mockRefreshResponse = {
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
        expiresOn: new Date(Date.now() + 3600000),
      };

      jest.spyOn(prismaService.integrationConfig, "findUnique").mockResolvedValue(mockConfig as any);
      mockMsalInstance.acquireTokenSilent.mockResolvedValue(mockRefreshResponse);
      jest.spyOn(prismaService.integrationConfig, "update").mockResolvedValue({} as any);

      const result = await service.getAccessToken(userId);

      expect(result).toBe("new-access-token");
      expect(mockMsalInstance.acquireTokenSilent).toHaveBeenCalled();
      expect(prismaService.integrationConfig.update).toHaveBeenCalled();
    });

    it("should throw error when no configuration found", async () => {
      const userId = "test-user-id";

      jest.spyOn(prismaService.integrationConfig, "findUnique").mockResolvedValue(null);

      await expect(service.getAccessToken(userId)).rejects.toThrow("Microsoft integration not configured for user");
    });
  });

  describe("isUserAuthenticated", () => {
    it("should return true when user has valid token", async () => {
      const userId = "test-user-id";
      const mockConfig = {
        accessToken: "valid-token",
        expiresAt: new Date(Date.now() + 3600000),
      };

      jest.spyOn(prismaService.integrationConfig, "findUnique").mockResolvedValue(mockConfig as any);

      const result = await service.isUserAuthenticated(userId);

      expect(result).toBe(true);
    });

    it("should return false when user has no configuration", async () => {
      const userId = "test-user-id";

      jest.spyOn(prismaService.integrationConfig, "findUnique").mockResolvedValue(null);

      const result = await service.isUserAuthenticated(userId);

      expect(result).toBe(false);
    });

    it("should return false when token is expired and refresh fails", async () => {
      const userId = "test-user-id";
      const mockConfig = {
        accessToken: "expired-token",
        expiresAt: new Date(Date.now() - 1000),
        refreshToken: "refresh-token",
        accountId: "account-id",
      };

      jest.spyOn(prismaService.integrationConfig, "findUnique").mockResolvedValue(mockConfig as any);
      mockMsalInstance.acquireTokenSilent.mockRejectedValue(new Error("Refresh failed"));

      const result = await service.isUserAuthenticated(userId);

      expect(result).toBe(false);
    });
  });

  describe("revokeAccess", () => {
    it("should successfully revoke access", async () => {
      const userId = "test-user-id";
      const mockConfig = {
        accessToken: "token",
        accountId: "account-id",
      };

      jest.spyOn(prismaService.integrationConfig, "findUnique").mockResolvedValue(mockConfig as any);
      mockMsalInstance.getTokenCache.mockReturnValue({
        removeAccount: jest.fn().mockResolvedValue(undefined),
      } as any);
      jest.spyOn(prismaService.integrationConfig, "update").mockResolvedValue({} as any);

      const result = await service.revokeAccess(userId);

      expect(result).toEqual({ success: true });
    });

    it("should handle revocation errors gracefully", async () => {
      const userId = "test-user-id";

      jest.spyOn(prismaService.integrationConfig, "findUnique").mockResolvedValue(null);

      const result = await service.revokeAccess(userId);

      expect(result).toEqual({ success: true });
    });
  });
});
