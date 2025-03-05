import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { InviteService } from './invite.service';
import { InviteController } from './invite.controller';
import { UsersService } from '../users/users.service';

import { UsersModule } from '@app/core-lib';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
  ],
  controllers: [InviteController],
  providers: [InviteService, UsersService],
})
export class InviteModule {}
