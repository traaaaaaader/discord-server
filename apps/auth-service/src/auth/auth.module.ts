import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AuthController } from './auth.controller';

import { AuthModule } from '@app/auth';
import { UsersModule } from '@app/users';

@Module({
  imports: [AuthModule, UsersModule, JwtModule.register({})],
  controllers: [AuthController],
})
export class AuthServiceModule {}
