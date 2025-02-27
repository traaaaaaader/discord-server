import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';

import { GoogleStrategy } from '../strategies/google.strategy';
import { JwtAccessStrategy } from '../strategies/jwt-access.strategy';
import { JwtRefreshStrategy } from '../strategies/jwt-refresh.stretegy';
import { LocalStrategy } from '../strategies/local.strategy';

import { GoogleGuard } from '../guards/google.guard';
import { JwtAccessGuard } from '../guards/jwt-access.guard';

import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    UsersModule,
    JwtModule.register({}),
  ],
  providers: [
    AuthService,
    LocalStrategy,
    JwtRefreshStrategy,
    JwtAccessStrategy,
    GoogleStrategy,
    JwtAccessGuard,
    GoogleGuard,
  ],
  exports: [AuthService],
})
export class AuthModule {}
