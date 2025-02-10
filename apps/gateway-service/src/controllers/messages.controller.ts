import {
  Body,
  Controller,
  Delete,
  Inject,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser, JwtAccessGuard } from '@app/auth';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { CreateMessageDto } from '@app/database';

@UseGuards(JwtAccessGuard)
@Controller('messages')
export class MessagesController {
  constructor(
    @Inject('CHAT_CLIENT') private readonly chatClient: ClientProxy,
  ) {}

  @Post()
  async send(
    @CurrentUser('id') userId: string,
    @Body() message: CreateMessageDto,
    @Query() query: { channelId: string; serverId: string },
  ) {
    const result = await firstValueFrom(
      this.chatClient.send({ cmd: 'send-message' }, { userId, message, query }),
    );
    return result;
  }

  @Patch()
  async update(
    @CurrentUser('id') userId: string,
    @Body() content: string,
    @Query() query: { messageId: string, channelId: string; serverId: string },
  ) {
    const result = await firstValueFrom(
      this.chatClient.send({ cmd: 'update-message' }, { userId, content, query }),
    );
    return result;
  }

  @Delete()
  async delete(
    @CurrentUser('id') userId: string,
    @Query() query: { messageId: string, channelId: string; serverId: string },
  ) {
    const result = await firstValueFrom(
      this.chatClient.send({ cmd: 'delete-message' }, { userId, query }),
    );
    return result;
  }
}
