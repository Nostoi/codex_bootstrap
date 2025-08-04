import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../services/auth.service';

export interface JwtPayload {
  sub: string; // User ID
  email: string;
  name?: string;
  iat: number;
  exp: number;
  jti: string; // JWT ID for token tracking
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
      issuer: configService.get<string>('JWT_ISSUER', 'helmsman-api'),
      audience: configService.get<string>('JWT_AUDIENCE', 'helmsman-app'),
    });
  }

  async validate(payload: JwtPayload): Promise<any> {
    try {
      this.logger.debug(`JWT validation for user ID: ${payload.sub}`);

      // Check if the token is blacklisted
      const isBlacklisted = await this.authService.isTokenBlacklisted(payload.jti);
      if (isBlacklisted) {
        this.logger.warn(`Blacklisted token used: ${payload.jti}`);
        throw new UnauthorizedException('Token has been revoked');
      }

      // Find user by ID from the JWT payload
      const user = await this.authService.findUserById(payload.sub);
      if (!user) {
        this.logger.warn(`User not found for JWT payload sub: ${payload.sub}`);
        throw new UnauthorizedException('User not found');
      }

      // Check if user's session is still active
      const hasActiveSession = await this.authService.hasActiveSession(user.id, payload.jti);
      if (!hasActiveSession) {
        this.logger.warn(`No active session for user: ${user.id}, token: ${payload.jti}`);
        throw new UnauthorizedException('Session expired or invalid');
      }

      this.logger.debug(`JWT validation successful for user: ${user.email}`);

      // Return user object (will be available as req.user in controllers)
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        tokenId: payload.jti,
      };
    } catch (error) {
      this.logger.error(`JWT validation failed: ${error.message}`, error.stack);
      throw new UnauthorizedException('Invalid token');
    }
  }
}
