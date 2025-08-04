import { Test, TestingModule } from "@nestjs/testing";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { createMockAuthService } from "../test-utils";

describe("AuthController", () => {
  let controller: AuthController;
  const mockAuthService = createMockAuthService();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  it("delegates login", async () => {
    await controller.login("test@example.com");
    expect(mockAuthService.login).toHaveBeenCalledWith("test@example.com");
  });
});
