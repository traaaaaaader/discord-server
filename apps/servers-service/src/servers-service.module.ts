import { Module } from '@nestjs/common';
import { ServersServiceController } from './servers-service.controller';
import { ServersServiceService } from './servers-service.service';

@Module({
  imports: [],
  controllers: [ServersServiceController],
  providers: [ServersServiceService],
})
export class ServersServiceModule {}
