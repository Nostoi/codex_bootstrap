import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy as CustomStrategy } from 'passport-custom';
import { ConfigService } from '@nestjs/config';
import { GraphAuthService } from '../../integrations/graph/auth/graph-auth.service';
import { OAuthProfile } from '../types/auth.types';
import { Request } from 'express';

@Injectable()
export class MicrosoftStrategy extends PassportStrategy(CustomStrategy, 'microsoft') {
  constructor(
    private configService: ConfigService,
    private graphAuthService: GraphAuthService,
  ) {
    super();
  }

  async validate(req: Request, done: Function): Promise<any> {
    try {
      // This strategy will be used in the callback handler
      // The actual OAuth flow is handled by MSAL in GraphAuthService
      const { code, state } = req.query;
      
      if (!code || !state) {
        return done(new Error('Missing authorization code or state'), null);
      }

      // Extract user ID from state (set during authorization URL generation)
      const userId = state as string;
      
      // Exchange code for tokens using existing GraphAuthService
      const authResult = await this.graphAuthService.exchangeCodeForTokens(
        code as string,
        userId,
        state as string
      );

      if (!authResult || !authResult.account) {
        return done(new Error('Failed to authenticate with Microsoft'), null);
      }

      // Create OAuth profile from MSAL result
      const oauthProfile: OAuthProfile = {
        providerId: authResult.account.homeAccountId,
        provider: 'microsoft',
        email: authResult.account.username,
        name: authResult.account.name || authResult.account.username,
        firstName: authResult.account.name?.split(' ')[0],
        lastName: authResult.account.name?.split(' ').slice(1).join(' '),
        picture: undefined, // Microsoft Graph profile photo would need separate API call
        accessToken: authResult.accessToken,
        refreshToken: undefined, // MSAL handles refresh tokens internally
        scopes: authResult.scopes || [
          'openid',
          'profile',
          'email',
          'https://graph.microsoft.com/Calendars.ReadWrite',
          'https://graph.microsoft.com/Calendars.Read',
          'https://graph.microsoft.com/Files.Read'
        ]
      };

      done(null, oauthProfile);
    } catch (error) {
      done(error, null);
    }
  }
}
