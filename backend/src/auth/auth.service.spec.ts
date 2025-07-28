import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { UsersService } from "../users/users.service";

describe("AuthService", () => {
  let service: AuthService;
  const usersService = {
    findByEmail: jest.fn().mockResolvedValue(null),
    create: jest
      .fn()
      .mockImplementation(async (data) => ({ id: "1", email: data.email })),
  };
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();
    service = module.get<AuthService>(AuthService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("returns a token on login", async () => {
    const result = await service.login("test@example.com");
    expect(result.access_token).toBeDefined();
  });
});
