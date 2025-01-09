import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { AuthController } from './auth.controller';

import { AuthService } from '@app/auth';
import { LocalStrategy } from '@app/auth/strategies/local.strategy';
import { JwtRefreshStrategy } from '@app/auth/strategies/jwt-refresh.stretegy';
import { GoogleStrategy } from '@app/auth/strategies/google.strategy';
import { JwtAccessGuard } from '@app/auth/guards/jwt-access.guard';

import { PrismaModule } from '@app/database';
import { UsersModule } from '@app/users';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UsersModule,
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtRefreshStrategy, GoogleStrategy, JwtAccessGuard],
})
export class AuthModule {}
