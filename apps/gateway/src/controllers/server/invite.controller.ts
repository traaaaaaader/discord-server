import {
  Controller,
  Body,
  Patch,
  UseGuards,
  Inject,
  Param,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

import { JwtAccessGuard, CurrentUser } from 'libs/core-lib/src';

@UseGuards(JwtAccessGuard)
@Controller('invite')
export class InviteController {
  constructor(
    @Inject(process.env.RABBIT_MQ_SERVER_CLIENT)
    private readonly serverClient: ClientProxy,
  ) {}

  @Patch('/invite-code')
  async invite(
    @CurrentUser('id') userId: string,
    @Body() body: { serverId: string },
  ) {
    const { serverId } = body;

    const result = await firstValueFrom(
      this.serverClient.send(
        { cmd: 'update-invite-server' },
        { userId, serverId },
      ),
    );
    return result;
  }

  @Patch(':inviteCode')
  async update(
    @CurrentUser('id') userId: string,
    @Param('inviteCode') inviteCode: string,
  ) {
    const result = await firstValueFrom(
      this.serverClient.send({ cmd: 'invite-server' }, { userId, inviteCode }),
    );
    return result;
  }
}
