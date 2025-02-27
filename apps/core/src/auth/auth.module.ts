import { Module } from '@nestjs/common';

import { AuthController } from './auth.controller';

import { AuthModule as AuthLibModule, UsersModule } from '@app/core-lib';

@Module({
  imports: [AuthLibModule, UsersModule],
  controllers: [AuthController],
})
export class AuthModule {}
