import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AuthController } from './auth.controller';

import {
  AuthService,
  JwtAccessGuard,
  GoogleStrategy,
  JwtRefreshStrategy,
  LocalStrategy,
} from '@app/auth';

import { PrismaModule } from '@app/database';
import { UsersModule } from '@app/users';

@Module({
  imports: [PrismaModule, UsersModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    JwtRefreshStrategy,
    GoogleStrategy,
    JwtAccessGuard,
  ],
})
export class AuthModule {}
