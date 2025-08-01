import { SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthRequest, RequiredScopes } from '../types/auth.types';

/**
 * Mark a route as optionally authenticated
 * If token is provided, user context will be injected
 * If no token, request proceeds without user context
 */
export const OptionalAuth = () => SetMetadata('auth-optional', true);

/**
 * Require specific OAuth scopes for route access
 */
export const RequireScopes = (scopes: RequiredScopes) => SetMetadata('scopes', scopes);

/**
 * Require calendar access for route
 */
export const RequireCalendarAccess = (provider?: 'google' | 'microsoft') => 
  SetMetadata('calendar-provider', provider);

/**
 * Extract current user from request context
 * Use after JwtAuthGuard to get authenticated user
 */
export const CurrentUser = createParamDecorator(
  (data: keyof AuthRequest['user'] | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AuthRequest>();
    const user = request.user;

    if (!user) {
      return null;
    }

    return data ? user[data] : user;
  },
);

/**
 * Extract current session from request context
 */
export const CurrentSession = createParamDecorator(
  (data: keyof AuthRequest['session'] | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AuthRequest>();
    const session = request.session;

    if (!session) {
      return null;
    }

    return data ? session[data] : session;
  },
);

/**
 * Common scope combinations for convenience
 */
export const SCOPE_COMBINATIONS = {
  GOOGLE_CALENDAR: {
    google: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.readonly'
    ]
  },
  MICROSOFT_CALENDAR: {
    microsoft: [
      'https://graph.microsoft.com/Calendars.Read',
      'https://graph.microsoft.com/Calendars.ReadWrite'
    ]
  },
  ANY_CALENDAR: {
    any: true
  },
  GOOGLE_PROFILE: {
    google: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    ]
  },
  MICROSOFT_PROFILE: {
    microsoft: [
      'https://graph.microsoft.com/User.Read'
    ]
  }
} as const;

/**
 * Convenience decorators for common scope requirements
 */
export const RequireGoogleCalendar = () => RequireScopes({
  google: [...SCOPE_COMBINATIONS.GOOGLE_CALENDAR.google]
});
export const RequireMicrosoftCalendar = () => RequireScopes({
  microsoft: [...SCOPE_COMBINATIONS.MICROSOFT_CALENDAR.microsoft]
});
export const RequireAnyCalendar = () => RequireScopes({
  any: true
});
export const RequireGoogleProfile = () => RequireScopes({
  google: [...SCOPE_COMBINATIONS.GOOGLE_PROFILE.google]
});
export const RequireMicrosoftProfile = () => RequireScopes({
  microsoft: [...SCOPE_COMBINATIONS.MICROSOFT_PROFILE.microsoft]
});
