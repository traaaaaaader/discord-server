import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ChannelsService } from './channels.service';
import { ChannelsController } from './channels.controller';
@Module({
  imports: [PrismaModule],
  controllers: [ChannelsController],
  providers: [ChannelsService],
})
export class ChannelsModule {}
