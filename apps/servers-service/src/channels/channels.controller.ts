import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { JwtAccessGuard, CurrentUser } from '@app/auth';
import { ChannelsService } from './channels.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';

@UseGuards(JwtAccessGuard)
@Controller('channels')
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Post()
  async create(
    req: Request,
    @CurrentUser('id') userId: string,
    @Body() createChannelDto: CreateChannelDto,
  ) {
    return await this.channelsService.create(req, userId, createChannelDto);
  }

  @Patch(':channelId')
  async update(
    req: Request,
    @Param('channelId') channelId: string,
    @CurrentUser('id') userId: string,
    @Body() updateChannelDto: UpdateChannelDto,
  ) {
    return await this.channelsService.update(req, channelId, userId, updateChannelDto);
  }

  @Delete(':channelId')
  async delete(
    req: Request,
    @Param('channelId') channelId: string,
    @CurrentUser('id') userId: string,
  ) {
    return await this.channelsService.delete(req, channelId, userId);
  }
}
