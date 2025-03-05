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
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

import { JwtAccessGuard, CurrentUser } from 'libs/core-lib/src';
import { CreateChannelDto, UpdateChannelDto } from '@app/database';

@UseGuards(JwtAccessGuard)
@Controller('channels')
export class ChannelsController {
  constructor(
    @Inject(process.env.RABBIT_MQ_SERVER_CLIENT)
    private readonly serverClient: ClientProxy,
  ) {}

  @Get(':channelId')
  async getOne(
    @Param('channelId') channelId: string,
    @Query() query: { serverId: string },
  ) {
    const serverId = query.serverId;

    const result = await firstValueFrom(
      this.serverClient.send({ cmd: 'get-channel' }, { channelId, serverId }),
    );
    return result;
  }

  @Get()
  async getAll(@Query() query) {
    const serverId = query.serverId;

    const result = await firstValueFrom(
      this.serverClient.send({ cmd: 'get-channels' }, { serverId }),
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
      this.serverClient.send(
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
      this.serverClient.send(
        { cmd: 'update-channel' },
        { userId, serverId, channelId, updateChannelDto },
      ),
    );
    return result;
  }

  @Delete(':channelId')
  async delete(
    @Query() query: { serverId: string },
    @Param('channelId') channelId: string,
    @CurrentUser('id') userId: string,
  ) {
    const serverId = query.serverId;

    const result = await firstValueFrom(
      this.serverClient.send(
        { cmd: 'delete-channel' },
        { userId, serverId, channelId },
      ),
    );
    return result;
  }
}
