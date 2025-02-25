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
@Controller('direct-messages')
export class DirectMessagesController {
  constructor(
    @Inject('CHAT_CLIENT') private readonly chatClient: ClientProxy,
  ) {}

  @Post()
  async send(
    @CurrentUser('id') userId: string,
    @Body() body: CreateMessageDto,
    @Query() query: { conversationId: string },
  ) {
    const result = await firstValueFrom(
      this.chatClient.send(
        { cmd: 'send-direct-message' },
        { userId, body, query },
      ),
    );
    return result;  
  }

  @Patch()
  async update(
    @CurrentUser('id') userId: string,
    @Body() content: string,
    @Query()
    query: {
      directMessageId: string;
      conversationid: string;
      serverId: string;
    },
  ) {
    const result = await firstValueFrom(
      this.chatClient.send(
        { cmd: 'update-direct-message' },
        { userId, content, query },
      ),
    );
    return result;
  }

  @Delete()
  async delete(
    @CurrentUser('id') userId: string,
    @Query() query: { directMessageId: string; conversationid: string },
  ) {
    const result = await firstValueFrom(
      this.chatClient.send({ cmd: 'delete-direct-message' }, { userId, query }),
    );
    return result;
  }
}
