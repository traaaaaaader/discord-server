import { Module } from '@nestjs/common';
import { UsersModule } from '@app/users';
import { JwtModule } from '@nestjs/jwt';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.stretegy';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtAccessGuard } from './guards/jwt-access.guard';
import { AuthService } from './auth.service';
import { ConfigModule } from '@nestjs/config';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    UsersModule,
    JwtModule.register({}),
  ],
  providers: [AuthService, LocalStrategy, JwtRefreshStrategy, GoogleStrategy, JwtAccessStrategy],
})
export class AuthModule {}
