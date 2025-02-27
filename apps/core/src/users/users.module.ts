import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { UsersController } from './users.controller';

import { UsersModule as UsersLibModule } from '@app/core-lib';

@Module({
	imports: [UsersLibModule, JwtModule.register({})],
	controllers: [UsersController],
})
export class UsersModule {}
