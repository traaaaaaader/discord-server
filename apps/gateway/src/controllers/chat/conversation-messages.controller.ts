import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

import { CurrentUser, JwtAccessGuard } from 'libs/core-lib/src';
import { CreateMessageDto } from '@app/database';

@UseGuards(JwtAccessGuard)
@Controller('conversation-messages')
export class ConversationMessagesController {
  constructor(
    @Inject(process.env.RABBIT_MQ_CHAT_CLIENT)
    private readonly chatClient: ClientProxy,
  ) {}

  @Post()
  async create(
    @CurrentUser('id') userId: string,
    @Body() body: CreateMessageDto,
    @Query() query: { conversationId: string },
  ) {
    const result = await firstValueFrom(
      this.chatClient.send(
        { cmd: 'create-conversation-message' },
        { userId, message: body, query },
      ),
    );

    return result;
  }

  @Get()
  async get(
    @Query('conversationId') conversationId: string,
    @Query('cursor') cursor: string,
  ) {
    const result = await firstValueFrom(
      this.chatClient.send(
        { cmd: 'get-conversation-messages' },
        { conversationId, cursor },
      ),
    );

    return result;
  }

  @Patch()
  async update(
    @CurrentUser('id') userId: string,
    @Body('content') content: string,
    @Query() query: { messageId: string; conversationId: string },
  ) {
    const result = await firstValueFrom(
      this.chatClient.send(
        { cmd: 'update-conversation-message' },
        { userId, content, query },
      ),
    );

    return result;
  }

  @Delete()
  async delete(
    @CurrentUser('id') userId: string,
    @Query() query: { messageId: string; conversationId: string },
  ) {
    console.log(userId, query);
    const result = await firstValueFrom(
      this.chatClient.send(
        { cmd: 'delete-conversation-message' },
        { userId, query },
      ),
    );

    return result;
  }
}
