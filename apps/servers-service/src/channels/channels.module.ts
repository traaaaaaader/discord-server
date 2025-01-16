import { Module } from '@nestjs/common';
import { PrismaModule } from '@app/database';
import { AuthModule } from '@app/auth';
import { ChannelsService } from './channels.service';
import { ChannelsController } from './channels.controller';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ChannelsController],
  providers: [ChannelsService],
})
export class ChannelsModule {}
