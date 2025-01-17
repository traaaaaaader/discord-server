import { Module } from '@nestjs/common';
import { UsersModule } from '@app/users';
import { PrismaModule } from '../../prisma/prisma.module';
import { ServersService } from './servers.service';
import { ServersController } from './servers.controller';

@Module({
  imports: [PrismaModule, UsersModule],
  controllers: [ServersController],
  providers: [ServersService],
})
export class ServersModule {}
