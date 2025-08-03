import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';

import { AuthController } from './auth.controller';

import { AuthService } from './services/auth.service';
import { GoogleAuthService } from './services/google-auth.service';
import { MicrosoftAuthService } from './services/microsoft-auth.service';
import { SessionManagerService } from './services/session-manager.service';
import { TokenManagerService } from './services/token-manager.service';

import { GoogleStrategy } from './strategies/google.strategy';
import { MicrosoftStrategy } from './strategies/microsoft.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    ConfigModule,
    PrismaModule, // For database access
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '15m'),
          issuer: configService.get<string>('JWT_ISSUER', 'helmsman-api'),
          audience: configService.get<string>('JWT_AUDIENCE', 'helmsman-app'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    GoogleAuthService,
    MicrosoftAuthService,
    SessionManagerService,
    TokenManagerService,
    GoogleStrategy,
    MicrosoftStrategy,
    JwtStrategy,
  ],
  exports: [
    AuthService,
    SessionManagerService,
    TokenManagerService,
    PassportModule,
    JwtModule,
  ],
})
export class AuthModule {}
