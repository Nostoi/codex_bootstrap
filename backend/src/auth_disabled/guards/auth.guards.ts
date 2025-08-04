import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SessionManagerService } from '../services/session-manager.service';
import { AuthRequest, RequiredScopes } from '../types/auth.types';

/**
 * JWT Authentication Guard
 * Validates JWT tokens and injects user context into requests
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly sessionManager: SessionManagerService,
    private readonly reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthRequest>();

    // Check if authentication is optional for this route
    const isOptional =
      this.reflector.get<boolean>('auth-optional', context.getHandler()) ||
      this.reflector.get<boolean>('auth-optional', context.getClass());

    const token = this.extractTokenFromHeader(request);

    if (!token) {
      if (isOptional) {
        return true;
      }
      throw new UnauthorizedException('Access token required');
    }

    try {
      const sessionData = await this.sessionManager.validateSession(token);

      if (!sessionData) {
        if (isOptional) {
          return true;
        }
        throw new UnauthorizedException('Invalid or expired session');
      }

      // Inject user and session into request
      request.user = sessionData.user;
      request.session = sessionData.session;

      return true;
    } catch (error) {
      if (isOptional) {
        return true;
      }
      throw new UnauthorizedException('Authentication failed');
    }
  }

  private extractTokenFromHeader(request: AuthRequest): string | undefined {
    const authorization = request.headers['authorization'] as string;
    if (!authorization) return undefined;

    const [type, token] = authorization.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}

/**
 * Scope Authorization Guard
 * Validates that the user has required OAuth scopes
 */
@Injectable()
export class ScopeGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredScopes =
      this.reflector.get<RequiredScopes>('scopes', context.getHandler()) ||
      this.reflector.get<RequiredScopes>('scopes', context.getClass());

    if (!requiredScopes) {
      return true; // No scopes required
    }

    const request = context.switchToHttp().getRequest<AuthRequest>();

    if (!request.user) {
      throw new UnauthorizedException('User context not found');
    }

    const userScopes = request.user.scopes || [];

    // Check if user needs any valid provider (not specific scopes)
    if (requiredScopes.any) {
      return userScopes.length > 0;
    }

    // Check Google scopes
    if (requiredScopes.google) {
      const hasGoogleScopes = requiredScopes.google.some(scopes => userScopes.includes(scopes));
      if (!hasGoogleScopes) {
        throw new ForbiddenException('Required Google permissions not granted');
      }
    }

    // Check Microsoft scopes
    if (requiredScopes.microsoft) {
      const hasMicrosoftScopes = requiredScopes.microsoft.some(scopes =>
        userScopes.includes(scopes)
      );
      if (!hasMicrosoftScopes) {
        throw new ForbiddenException('Required Microsoft permissions not granted');
      }
    }

    return true;
  }
}

/**
 * Calendar Access Guard
 * Validates that the user has calendar access for specified provider
 */
@Injectable()
export class CalendarAccessGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredProvider =
      this.reflector.get<'google' | 'microsoft'>('calendar-provider', context.getHandler()) ||
      this.reflector.get<'google' | 'microsoft'>('calendar-provider', context.getClass());

    const request = context.switchToHttp().getRequest<AuthRequest>();

    if (!request.user) {
      throw new UnauthorizedException('User context not found');
    }

    const userScopes = request.user.scopes || [];

    // Check for calendar scopes
    const calendarScopes = [
      // Google Calendar scopes
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.readonly',
      // Microsoft Calendar scopes
      'https://graph.microsoft.com/Calendars.Read',
      'https://graph.microsoft.com/Calendars.ReadWrite',
    ];

    if (requiredProvider) {
      // Check for specific provider calendar access
      const providerScopes =
        requiredProvider === 'google'
          ? [
              'https://www.googleapis.com/auth/calendar',
              'https://www.googleapis.com/auth/calendar.readonly',
            ]
          : [
              'https://graph.microsoft.com/Calendars.Read',
              'https://graph.microsoft.com/Calendars.ReadWrite',
            ];

      const hasProviderAccess = providerScopes.some(scopes => userScopes.includes(scopes));

      if (!hasProviderAccess) {
        throw new ForbiddenException(`${requiredProvider} calendar access required`);
      }
    } else {
      // Check for any calendar access
      const hasCalendarAccess = calendarScopes.some(scopes => userScopes.includes(scopes));

      if (!hasCalendarAccess) {
        throw new ForbiddenException('Calendar access required');
      }
    }

    return true;
  }
}
