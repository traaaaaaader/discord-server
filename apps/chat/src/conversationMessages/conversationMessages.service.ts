import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { ChatGateway } from '../chat.gateway';

import { CreateMessageDto } from '@app/database';

@Injectable()
export class ConversationMessagesService {
  readonly MESSAGES_BATCH = 50;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly usersService: UsersService,
    private readonly chatGateway: ChatGateway,
  ) {}

  async get(conversationId: string, cursor?: string) {
    try {
      if (!conversationId) {
        return new BadRequestException('Conversation ID missing');
      }

      let messages = [];

      if (cursor) {
        messages = await this.prismaService.conversationMessage.findMany({
          take: this.MESSAGES_BATCH,
          skip: 1,
          cursor: {
            id: cursor,
          },
          where: {
            conversationId,
          },
          include: {
            sender: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        });
      } else {
        messages = await this.prismaService.conversationMessage.findMany({
          take: this.MESSAGES_BATCH,
          where: {
            conversationId,
          },
          include: {
            sender: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        });
      }

      let nextCursor = null;

      if (messages.length === this.MESSAGES_BATCH) {
        nextCursor = messages[this.MESSAGES_BATCH - 1].id;
      }

      return {
        items: messages,
        nextCursor,
      };
    } catch (error) {
      console.log('[MESSAGES_GET]', error);
    }
  }

  async create(
    { content, fileUrl }: CreateMessageDto,
    conversationId: string,
    userId: string,
  ) {
    if (!conversationId) {
      throw new BadRequestException('Conversation ID missing');
    }

    await this.usersService.create({ id: userId });

    const message = await this.prismaService.conversationMessage.create({
      data: {
        senderId: userId,
        content,
        fileUrl,
        conversationId,
      },
      include: {
        sender: true,
      },
    });

    const eventKey = `chat:${conversationId}:messages`;
    this.chatGateway.server.emit(eventKey, message);

    return message;
  }

  async update(
    userId: string,
    conversationId: string,
    messageId: string,
    content: string,
  ) {
    if (!userId) {
      throw new UnauthorizedException('User ID missing');
    }

    if (!conversationId || !messageId || !content) {
      throw new BadRequestException(
        'Conversation ID, Message ID or content missing',
      );
    }

    const message = await this.prismaService.conversationMessage.update({
      where: {
        id: messageId,
        senderId: userId,
        conversationId,
      },
      data: {
        content,
      },
      include: {
        sender: true,
      },
    });

    const eventKey = `chat:${conversationId}:messages:update`;
    this.chatGateway.server.emit(eventKey, message);

    return message;
  }

  async delete(userId: string, conversationId: string, messageId: string) {
    if (!userId) {
      throw new UnauthorizedException('User ID missing');
    }

    if (!conversationId || !messageId) {
      throw new BadRequestException('Conversation ID or Message ID missing');
    }

    const message = await this.prismaService.conversationMessage.update({
      where: {
        id: messageId,
        senderId: userId,
        conversationId,
      },
      data: {
        fileUrl: null,
        content: 'This message has been deleted',
        deleted: true,
      },
      include: {
        sender: true,
      },
    });

    const eventKey = `chat:${conversationId}:messages:update`;
    this.chatGateway.server.emit(eventKey, message);

    return message;
  }
}
