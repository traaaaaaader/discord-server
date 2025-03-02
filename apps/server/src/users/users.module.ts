import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

import { UsersModule as UsersLibModule } from '@app/core-lib';

@Module({
	imports: [
		PrismaModule,
		UsersLibModule,
	],
	controllers: [UsersController],
	providers: [UsersService],
	exports: [UsersService],
})
export class UsersModule {}
