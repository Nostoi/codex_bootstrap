import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../services/auth.service';

export interface OAuthProfile {
  provider: 'google' | 'microsoft';
  providerId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  accessToken: string;
  refreshToken?: string;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile', 'https://www.googleapis.com/auth/calendar.readonly'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: Function,
  ): Promise<any> {
    try {
      this.logger.debug(`Google OAuth validation for profile ID: ${profile.id}`);

      // Extract user info from profile
      const { id, emails, name, photos } = profile;
      const email = emails && emails.length > 0 ? emails[0].value : null;

      if (!email) {
        this.logger.error('Google profile does not contain email');
        throw new UnauthorizedException('Google profile does not contain email');
      }

      // Prepare OAuth profile data
      const oauthProfile: OAuthProfile = {
        provider: 'google',
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

      this.logger.log(`Google OAuth validation successful for user: ${loginResult.user.email}`);
      done(null, loginResult);
    } catch (error) {
      this.logger.error(`Google OAuth validation failed: ${error.message}`, error.stack);
      done(error, false);
    }
  }
}
