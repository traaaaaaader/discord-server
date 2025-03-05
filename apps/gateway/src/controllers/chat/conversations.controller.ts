import { Body, Controller, Get, Inject, Post, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

import { CurrentUser, JwtAccessGuard } from 'libs/core-lib/src';

@UseGuards(JwtAccessGuard)
@Controller('conversations')
export class ConversationsController {
  constructor(
    @Inject(process.env.RABBIT_MQ_CHAT_CLIENT)
    private readonly chatClient: ClientProxy,
  ) {}

  @Post()
  async create(
    @CurrentUser('id') userId: string,
    @Body() body: { name: string },
  ) {
    const { name } = body;
    const result = await firstValueFrom(
      this.chatClient.send({ cmd: 'create-conversation' }, { userId, name }),
    );
    return result;
  }

  @Get()
  async get(@CurrentUser('id') userId: string) {
    const result = await firstValueFrom(
      this.chatClient.send({ cmd: 'get-conversation' }, userId),
    );
    return result;
  }
}
