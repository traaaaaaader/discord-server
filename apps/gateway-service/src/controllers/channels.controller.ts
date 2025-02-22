import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Inject,
  Query,
  Get,
} from '@nestjs/common';
import { JwtAccessGuard, CurrentUser } from '@app/auth';
import { CreateChannelDto, UpdateChannelDto } from '@app/database';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@UseGuards(JwtAccessGuard)
@Controller('channels')
export class ChannelsController {
  constructor(
    @Inject('CHANNELS_CLIENT') private readonly channelsClient: ClientProxy,
  ) {}

  @Get(':channelId')
  async getOne(@Param('channelId') channelId: string, @Query() query) {
    const serverId = query.serverId;

    const result = await firstValueFrom(
      this.channelsClient.send({ cmd: 'get-channel' }, { channelId, serverId }),
    );
    return result;
  }

  @Get()
  async getAll(@Query() query) {
    const serverId = query.serverId;

    const result = await firstValueFrom(
      this.channelsClient.send({ cmd: 'get-channels' }, { serverId }),
    );
    return result;
  }

  @Post()
  async create(
    @Query() query,
    @CurrentUser('id') userId: string,
    @Body() createChannelDto: CreateChannelDto,
  ) {
    const serverId = query.serverId;

    const result = await firstValueFrom(
      this.channelsClient.send(
        { cmd: 'create-channel' },
        { userId, serverId, createChannelDto },
      ),
    );
    return result;
  }

  @Patch(':channelId')
  async update(
    @Query() query,
    @Param('channelId') channelId: string,
    @CurrentUser('id') userId: string,
    @Body() updateChannelDto: UpdateChannelDto,
  ) {
    const serverId = query.serverId;

    const result = await firstValueFrom(
      this.channelsClient.send(
        { cmd: 'update-channel' },
        { userId, serverId, channelId, updateChannelDto },
      ),
    );
    return result;
  }

  @Delete(':channelId')
  async delete(
    @Query() query,
    @Param('channelId') channelId: string,
    @CurrentUser('id') userId: string,
  ) {
    const serverId = query.serverId;

    const result = await firstValueFrom(
      this.channelsClient.send(
        { cmd: 'delete-channel' },
        { userId, serverId, channelId },
      ),
    );
    return result;
  }
}
