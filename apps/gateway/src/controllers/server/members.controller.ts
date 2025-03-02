import {
  Controller,
  Body,
  Patch,
  Param,
  UseGuards,
  Delete,
  Inject,
  Query,
  Get,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

import { JwtAccessGuard, CurrentUser } from 'libs/core-lib/src';
import { UpdateMemberDto } from '@app/database';

@UseGuards(JwtAccessGuard)
@Controller('members')
export class MembersController {
  constructor(
    @Inject(process.env.RABBIT_MQ_SERVER_CLIENT) private readonly serverClient: ClientProxy,
  ) {}

  @Get()
  async getOne(@Query() query, @CurrentUser('id') userId: string) {
    const serverId = query.serverId;

    const result = await firstValueFrom(
      this.serverClient.send({ cmd: 'get-member' }, { serverId, userId }),
    );
    return result;
  }

  @Get()
  async getAll(@Query() query, @CurrentUser('id') userId: string) {
    const serverId = query.serverId;

    const result = await firstValueFrom(
      this.serverClient.send({ cmd: 'get-members' }, { serverId, userId }),
    );
    return result;
  }

  @Delete(':memberId')
  async delete(
    @Query() query,
    @Param('memberId') memberId: string,
    @CurrentUser('id') userId: string,
  ) {
    const serverId = query.serverId;

    const result = await firstValueFrom(
      this.serverClient.send(
        { cmd: 'delete-member' },
        { userId, serverId, memberId },
      ),
    );
    return result;
  }

  @Patch(':memberId')
  async update(
    @Query() query,
    @Param('memberId') memberId: string,
    @CurrentUser('id') userId: string,
    @Body() updateMemberDto: UpdateMemberDto,
  ) {
    const serverId = query.serverId;

    const result = await firstValueFrom(
      this.serverClient.send(
        { cmd: 'delete-member' },
        { userId, serverId, memberId, updateMemberDto },
      ),
    );
    return result;
  }
}
