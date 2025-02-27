import {
  Controller,
  Post,
  Patch,
  Body,
  Param,
  Inject,
  Delete,
  UseGuards,
  Get,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

import { CurrentUser, JwtAccessGuard } from 'libs/core-lib/src';
import { CreateServerDto } from '@app/database';

@UseGuards(JwtAccessGuard)
@Controller('servers')
export class ServersController {
  constructor(
    @Inject('SERVER_CLIENT') private readonly serverClient: ClientProxy,
  ) {}

  @Get(':serverId')
  async getOne(
    @Param('serverId') serverId: string,
    @CurrentUser('id') userId: string,
  ) {
    const result = await firstValueFrom(
      this.serverClient.send({ cmd: 'get-server' }, { serverId, userId }),
    );
    return result;
  }

  @Get()
  async getAll(
    @CurrentUser('id') userId: string,
  ) {
    const result = await firstValueFrom(
      this.serverClient.send({ cmd: 'get-servers' }, { userId }),
    );
    return result;
  }

  @Post()
  async create(
    @CurrentUser('id') userId: string,
    @Body() createServerDto: CreateServerDto,
  ) {
    const result = await firstValueFrom(
      this.serverClient.send(
        { cmd: 'create-server' },
        { userId, createServerDto },
      ),
    );
    return result;
  }

  @Patch(':serverId')
  async update(
    @Param('serverId') serverId: string,
    @CurrentUser('id') userId: string,
    @Body() updateServerDto: CreateServerDto,
  ) {
        const result = await firstValueFrom(
      this.serverClient.send(
        { cmd: 'update-server' },
        { serverId, userId, updateServerDto },
      ),
    );
    return result;
  }

  @Delete(':serverId')
  async delete(
    @Param('serverId') serverId: string,
    @CurrentUser('id') userId: string,
  ) {
    const result = await firstValueFrom(
      this.serverClient.send({ cmd: 'delete-server' }, { serverId, userId }),
    );
    return result;
  }

  @Patch(':serverId/invite-code')
  async invite(
    @Param('serverId') serverId: string,
    @CurrentUser('id') userId: string,
  ) {
    const result = await firstValueFrom(
      this.serverClient.send({ cmd: 'invite-server' }, { serverId, userId }),
    );
    return result;
  }

  @Patch(':serverId/leave')
  async leave(
    @Param('serverId') serverId: string,
    @CurrentUser('id') userId: string,
  ) {
    const result = await firstValueFrom(
      this.serverClient.send({ cmd: 'leave-server' }, { serverId, userId }),
    );
    return result;
  }
}
