import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma/prisma.module';
import { ServersService } from './servers.service';
import { ServersController } from './servers.controller';
import { UsersService } from '../users/users.service';

import { UsersModule } from '@app/core-lib';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
  ],
  controllers: [ServersController],
  providers: [ServersService, UsersService],
})
export class ServersModule {}
