import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
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
@Controller('messages')
export class MessagesController {
  constructor(
    @Inject(process.env.RABBIT_MQ_CHAT_CLIENT) private readonly chatClient: ClientProxy,
  ) {}

  @Post()
  async create(
    @CurrentUser('id') userId: string,
    @Body() body: CreateMessageDto,
    @Query() query: { channelId: string; serverId: string },
  ) {
    const result = await firstValueFrom(
      this.chatClient.send(
        { cmd: 'create-message' },
        { userId, message: body, query },
      ),
    );
    
    return result;
  }

  @Get()
  async get(
    @Query("channelId") channelId: string,
    @Query("cursor") cursor: string,
  ) {
    const result = await firstValueFrom(
      this.chatClient.send(
        { cmd: 'get-messages' },
        { channelId, cursor },
      ),
    );

    return result;
  }

  @Patch()
  async update(
    @CurrentUser('id') userId: string,
    @Body("content") content: string,
    @Query() query: { messageId: string; channelId: string; serverId: string },
  ) {
    const result = await firstValueFrom(
      this.chatClient.send(
        { cmd: 'update-message' },
        { userId, content, query },
      ),
    );

    return result;
  }

  @Delete()
  async delete(
    @CurrentUser('id') userId: string,
    @Query() query: { messageId: string; channelId: string; serverId: string },
  ) {
    const result = await firstValueFrom(
      this.chatClient.send({ cmd: 'delete-message' }, { userId, query }),
    );

    return result;
  }
}
