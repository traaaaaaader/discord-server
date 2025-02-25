import { Controller } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { EventPattern, Payload } from '@nestjs/microservices';
import { CreateMessageDto } from '@app/database';

@Controller()
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
  ) {}

  @EventPattern({ cmd: 'send-message' })
  async create(
    @Payload()
    data: {
      userId: string;
      message: CreateMessageDto;
      query: { channelId: string; serverId: string };
    },
  ) {
    const { userId, message, query } = data;

    return await this.messagesService.createMessage(
      message,
      query.channelId,
      query.serverId,
      userId,
    );
  }

  @EventPattern({ cmd: 'get-messages' })
  async get(
    @Payload()
    data: {
      channelId: string;
      cursor?: string;
    },
  ) {
    const { cursor, channelId } = data;

    return await this.messagesService.get(
      channelId,
      cursor,
    );
  }

  @EventPattern({ cmd: 'update-message' })
  async update(
    @Payload()
    data: {
      userId: string;
      content: string;
      query: { messageId: string; channelId: string; serverId: string };
    },
  ) {
    const { userId, content, query } = data;
    return await this.messagesService.updateMessage(
      content,
      query.messageId,
      query.channelId,
      query.serverId,
      userId,
    );
  }

  @EventPattern({ cmd: 'delete-message' })
  async delete(
    @Payload()
    data: {
      userId: string;
      query: { messageId: string; channelId: string; serverId: string };
    },
  ) {
    const { userId, query } = data;

    return await this.messagesService.deleteMessage(
      query.messageId,
      query.channelId,
      query.serverId,
      userId,
    );
  }
}
