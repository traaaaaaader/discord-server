import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';

import { ConversationMessagesService } from './conversationMessages.service';
import { CreateMessageDto } from '@app/database';

@Controller()
export class ConversationMessagesController {
  constructor(
    private readonly conversationMessagesService: ConversationMessagesService,
  ) {}

  @EventPattern({ cmd: 'create-conversation-message' })
  async create(
    @Payload()
    data: {
      userId: string;
      message: CreateMessageDto;
      query: { conversationId: string };
    },
  ) {
    const { userId, message, query } = data;

    return await this.conversationMessagesService.create(
      message,
      query.conversationId,
      userId,
    );
  }

  @EventPattern({ cmd: 'get-conversation-messages' })
  async get(
    @Payload()
    data: {
      conversationId: string;
      cursor?: string;
    },
  ) {
    const { cursor, conversationId } = data;

    return await this.conversationMessagesService.get(conversationId, cursor);
  }

  @EventPattern({ cmd: 'update-conversation-message' })
  async update(
    @Payload()
    data: {
      userId: string;
      content: string;
      query: { messageId: string; conversationId: string };
    },
  ) {
    const { userId, content, query } = data;
    return await this.conversationMessagesService.update(
      userId,
      query.conversationId,
      query.messageId,
      content,
    );
  }

  @EventPattern({ cmd: 'delete-conversation-message' })
  async delete(
    @Payload()
    data: {
      userId: string;
      query: { messageId: string; conversationId: string };
    },
  ) {
    const { userId, query } = data;

    return await this.conversationMessagesService.delete(
      userId,
      query.conversationId,
      query.messageId,
    );
  }
}
