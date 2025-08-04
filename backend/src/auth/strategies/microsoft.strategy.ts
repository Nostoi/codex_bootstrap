import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-microsoft';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../services/auth.service';
import { OAuthProfile } from './google.strategy';

// Define Microsoft profile interface
interface MicrosoftProfile {
  id: string;
  emails?: Array<{ value: string }>;
  name?: {
    givenName?: string;
    familyName?: string;
  };
  photos?: Array<{ value: string }>;
}

@Injectable()
export class MicrosoftStrategy extends PassportStrategy(Strategy, 'microsoft') {
  private readonly logger = new Logger(MicrosoftStrategy.name);

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService
  ) {
    super({
      clientID: configService.get<string>('MICROSOFT_CLIENT_ID'),
      clientSecret: configService.get<string>('MICROSOFT_CLIENT_SECRET'),
      callbackURL: configService.get<string>('MICROSOFT_CALLBACK_URL'),
      scope: ['user.read', 'calendars.read', 'offline_access'],
      tenant: configService.get<string>('MICROSOFT_TENANT_ID', 'common'),
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: MicrosoftProfile,
    done: Function
  ): Promise<any> {
    try {
      this.logger.debug(`Microsoft OAuth validation for profile ID: ${profile.id}`);

      // Extract user info from profile (Microsoft profile structure)
      const { id, emails, name, photos } = profile;
      const email = emails && emails.length > 0 ? emails[0].value : null;

      if (!email) {
        this.logger.error('Microsoft profile does not contain email');
        throw new UnauthorizedException('Microsoft profile does not contain email');
      }

      // Prepare OAuth profile data
      const oauthProfile: OAuthProfile = {
        provider: 'microsoft',
        providerId: id,
        email,
        firstName: name?.givenName,
        lastName: name?.familyName,
        avatar: photos && photos.length > 0 ? photos[0].value : undefined,
        accessToken,
        refreshToken,
      };

      // Call AuthService to find or create the user in the database
      const loginResult = await this.authService.validateOAuthLogin(oauthProfile);

      this.logger.log(`Microsoft OAuth validation successful for user: ${loginResult.user.email}`);
      done(null, loginResult);
    } catch (error) {
      this.logger.error(`Microsoft OAuth validation failed: ${error.message}`, error.stack);
      done(error, false);
    }
  }
}
