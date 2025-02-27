import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';

import { JwtPayload } from '@app/core-lib';
import { UsersService } from '../users/users.service';

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(
  Strategy,
  'jwt-access',
) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: (req: Request & { session }) => {
        return req.session.accessToken;
      },
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow('JWT_ACCESS_SECRET'),
    });
  }

  async validate({ userId }: JwtPayload) {
    const user = await this.usersService.findOne({ id: userId });

    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }
}
