import { Controller } from '@nestjs/common';
import { DirectMessagesService } from './direct-messages.service';
import { EventPattern, Payload } from '@nestjs/microservices';
import { CreateMessageDto } from '@app/database';

@Controller()
export class DirectMessagesController {
  constructor(private readonly directMessagesService: DirectMessagesService) {}

  @EventPattern({ cmd: 'send-direct-message' })
  async create(
    @Payload()
    data: {
      userId: string;
      message: CreateMessageDto;
      query: { conversationId: string };
    },
  ) {
    const { userId, message, query } = data;

    return await this.directMessagesService.createMessage(
      message,
      query.conversationId,
      userId,
    );
  }

  @EventPattern({ cmd: 'update-direct-message' })
  async update(
    @Payload()
    data: {
      userId: string;
      content: CreateMessageDto;
      query: { directMessageId: string; conversationid: string };
    },
  ) {
    const { userId, content, query } = data;

    return await this.directMessagesService.updateMessage(
      content.content,
      query.directMessageId,
      query.conversationid,
      userId,
    );
  }

  @EventPattern({ cmd: 'delete-direct-message' })
  async delete(
    @Payload()
    data: {
      userId: string;
      query: { directMessageId: string; conversationid: string};
    },
  ) {
    const { userId, query } = data;

    return await this.directMessagesService.deleteMessage(
      query.directMessageId,
      query.conversationid,
      userId,
    );
  }
}
