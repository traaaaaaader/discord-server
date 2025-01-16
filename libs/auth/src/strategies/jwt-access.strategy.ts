import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '@app/auth';
import { UsersService } from '@app/users/users.service';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

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
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow("JWT_ACCESS_SECRET"),
    });
  }

  async validate({ userId }: JwtPayload) {
    const user = await this.usersService.findOne({ id: userId });

		if(!user) {
			throw new UnauthorizedException();
		}

		return user;
  }
}
