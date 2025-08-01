import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromCookies(request);

    if (!token) {
      this.logger.warn('No access token found in request');
      throw new UnauthorizedException('Authentication required');
    }

    try {
      // Verify JWT token first
      const payload = this.jwtService.verify(token);
      
      if (payload.type !== 'access') {
        throw new UnauthorizedException('Invalid token type');
      }

      // Check if token is blacklisted
      const blacklistedToken = await this.prisma.blacklistedToken.findUnique({
        where: { tokenId: payload.jti }
      });

      if (blacklistedToken) {
        this.logger.warn('Attempted use of blacklisted token');
        throw new UnauthorizedException('Token has been revoked');
      }

      // Attach user info to request
      request['user'] = payload;
      
      return true;

    } catch (error) {
      this.logger.warn(`JWT verification failed: ${error.message}`);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractTokenFromCookies(request: Request): string | undefined {
    return request.cookies?.access_token;
  }
}
