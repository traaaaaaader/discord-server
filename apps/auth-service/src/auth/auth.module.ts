import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AuthController } from './auth.controller';

import {
  AuthModule
} from '@app/auth';


@Module({
  imports: [AuthModule, JwtModule.register({})],
  controllers: [AuthController],
})
export class AuthServiceModule {}
