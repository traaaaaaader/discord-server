import { Module } from '@nestjs/common';
import { UsersModule } from '@app/users';
import { JwtModule } from '@nestjs/jwt';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.stretegy';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtAccessGuard } from './guards/jwt-access.guard';

@Module({
  imports: [
    UsersModule,
    JwtModule.register({}),
  ],
  providers: [LocalStrategy, JwtRefreshStrategy, GoogleStrategy, JwtAccessGuard],
})
export class AuthModule {}
