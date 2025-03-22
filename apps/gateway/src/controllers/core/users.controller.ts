import { Body, Controller, Get, Inject, Post, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

import { JwtAccessGuard, CurrentUser } from '@app/core-lib';
import { EditUserDto } from '@app/database';

@UseGuards(JwtAccessGuard)
@Controller('users')
export class UsersController {
  constructor(
    @Inject(process.env.RABBIT_MQ_CORE_CLIENT) private readonly coreClient: ClientProxy,
    @Inject(process.env.RABBIT_MQ_CHAT_CLIENT) private readonly chatClient: ClientProxy,
    @Inject(process.env.RABBIT_MQ_SERVER_CLIENT) private readonly serverClient: ClientProxy,
  ) {}

  @Get('get')
  async get(@CurrentUser('id') userId: string) {
    console.log("userID = ", userId)
    const result = await firstValueFrom(
      this.coreClient.send({ cmd: 'get-user' }, userId),
    );

    return {
      id: result.id,
      email: result.email,
      name: result.name,
      imageUrl: result.imageUrl,
    };
  }

  @Post('edit')
  async editUser(@CurrentUser('id') userId: string, @Body() body: EditUserDto) {  //TODO
    const result = await firstValueFrom(
      this.coreClient.send({ cmd: 'edit-user' }, { userId, body }),
    );

    await this.chatClient.emit({ cmd: 'edit-user' }, { userId, body });
    await this.serverClient.emit({ cmd: 'edit-user' }, { userId, body });

    return {
      id: result.id,
      email: result.email,
      name: result.name,
      imageUrl: result.imageUrl,
    };
  }
}
