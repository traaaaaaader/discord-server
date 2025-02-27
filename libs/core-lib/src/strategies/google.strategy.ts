import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-google-oauth20';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: configService.getOrThrow('CLIENT_ID'),
      clientSecret: configService.getOrThrow('CLIENT_SECRET'),
      callbackURL: configService.getOrThrow('CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: any,
  ) {
    const user = {
      email: profile.emails[0].value,
      name: profile.displayName,
      imageUrl: profile.photos[0].value,
    }
    
    done(null, user);
  }
}
