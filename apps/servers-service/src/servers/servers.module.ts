import { Module } from '@nestjs/common';
import { PrismaModule } from '@app/database';
import { AuthModule } from '@app/auth';
import { ServersService } from './servers.service';
import { ServersController } from './servers.controller';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ServersController],
  providers: [ServersService],
})
export class ServersModule {}
