import { Test, TestingModule } from "@nestjs/testing";
import { GraphAuthController } from "./graph-auth.controller";
import { GraphAuthService } from "./graph-auth.service";

describe("GraphAuthController", () => {
  let controller: GraphAuthController;
  let authService: GraphAuthService;

  const mockAuthService = {
    getAuthorizationUrl: jest.fn(),
    handleCallback: jest.fn(),
    isUserAuthenticated: jest.fn(),
    refreshToken: jest.fn(),
    revokeAccess: jest.fn(),
    getUserInfo: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GraphAuthController],
      providers: [
        {
          provide: GraphAuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<GraphAuthController>(GraphAuthController);
    authService = module.get<GraphAuthService>(GraphAuthService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("authorize", () => {
    it("should return authorization URL", async () => {
      const userId = "test-user";
      const mockResult = {
        authUrl: "https://login.microsoftonline.com/...",
        state: "test-state",
      };

      mockAuthService.getAuthorizationUrl.mockResolvedValue(mockResult);

      const result = await controller.authorize(userId);

      expect(result).toEqual(mockResult);
      expect(mockAuthService.getAuthorizationUrl).toHaveBeenCalledWith(userId);
    });
  });

  describe("callback", () => {
    it("should handle OAuth callback", async () => {
      const code = "auth-code";
      const state = "test-state";
      const userId = "test-user";
      const mockResult = { success: true, user: {} };

      mockAuthService.handleCallback.mockResolvedValue(mockResult);

      const result = await controller.callback(code, state, userId);

      expect(result).toEqual(mockResult);
      expect(mockAuthService.handleCallback).toHaveBeenCalledWith(code, state, userId);
    });
  });

  describe("status", () => {
    it("should return authentication status", async () => {
      const userId = "test-user";
      mockAuthService.isUserAuthenticated.mockResolvedValue(true);

      const result = await controller.status(userId);

      expect(result).toEqual({ authenticated: true });
      expect(mockAuthService.isUserAuthenticated).toHaveBeenCalledWith(userId);
    });
  });

  describe("refresh", () => {
    it("should refresh token", async () => {
      const userId = "test-user";
      const mockResult = { success: true };

      mockAuthService.refreshToken.mockResolvedValue(mockResult);

      const result = await controller.refresh(userId);

      expect(result).toEqual(mockResult);
      expect(mockAuthService.refreshToken).toHaveBeenCalledWith(userId);
    });
  });

  describe("revoke", () => {
    it("should revoke access", async () => {
      const userId = "test-user";
      const mockResult = { success: true };

      mockAuthService.revokeAccess.mockResolvedValue(mockResult);

      const result = await controller.revoke(userId);

      expect(result).toEqual(mockResult);
      expect(mockAuthService.revokeAccess).toHaveBeenCalledWith(userId);
    });
  });

  describe("profile", () => {
    it("should return user profile", async () => {
      const userId = "test-user";
      const mockProfile = {
        id: "user-id",
        displayName: "Test User",
        mail: "test@example.com",
      };

      mockAuthService.getUserInfo.mockResolvedValue(mockProfile);

      const result = await controller.profile(userId);

      expect(result).toEqual(mockProfile);
      expect(mockAuthService.getUserInfo).toHaveBeenCalledWith(userId);
    });
  });
});
