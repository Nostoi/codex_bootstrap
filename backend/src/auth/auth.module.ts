import { Module } from "@nestjs/common";
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from "../users/users.module";
import { DatabaseModule } from "../database/database.module";
import { GraphModule } from "../integrations/graph/graph.module";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { MicrosoftAuthService } from "./services/microsoft-auth.service";
import { MicrosoftAuthController } from "./controllers/microsoft-auth.controller";
import { MicrosoftStrategy } from "./strategies/microsoft.strategy";
import { TokenManagerService } from "./services/token-manager.service";
import { SessionManagerService } from "./services/session-manager.service";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";

@Module({
  imports: [
    UsersModule,
    DatabaseModule,
    GraphModule, // Import GraphModule for GraphAuthService
    PassportModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: '15m',
          algorithm: 'HS256',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [
    AuthController, 
    MicrosoftAuthController
  ],
  providers: [
    AuthService, 
    MicrosoftAuthService,
    MicrosoftStrategy,
    TokenManagerService,
    SessionManagerService,
    JwtAuthGuard
  ],
  exports: [
    AuthService, 
    MicrosoftAuthService,
    TokenManagerService,
    SessionManagerService,
    JwtAuthGuard
  ],
})
export class AuthModule {}
