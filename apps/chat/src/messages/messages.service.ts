import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

import { MemberRole } from '@prisma/db-chat';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { ChatGateway } from '../chat.gateway';

import { CreateMessageDto } from '@app/database';

@Injectable()
export class MessagesService {
  readonly MESSAGES_BATCH = 50;

  constructor(
    private readonly prismaService: PrismaService,
    @Inject(process.env.RABBIT_MQ_SERVER_CLIENT)
    private readonly serverClient: ClientProxy,
    private readonly usersService: UsersService,
    private readonly chatGateway: ChatGateway,
  ) {}

  async get(channelId: string, cursor?: string) {
    try {
      if (!channelId) {
        return new BadRequestException('Channel ID missing');
      }

      let messages = [];

      if (cursor) {
        messages = await this.prismaService.message.findMany({
          take: this.MESSAGES_BATCH,
          skip: 1,
          cursor: {
            id: cursor,
          },
          where: {
            channelId,
          },
          include: {
            member: {
              include: {
                user: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        });
      } else {
        messages = await this.prismaService.message.findMany({
          take: this.MESSAGES_BATCH,
          where: {
            channelId,
          },
          include: {
            member: {
              include: {
                user: true,
              },
            },
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

  async createMessage(
    { content, fileUrl }: CreateMessageDto,
    channelId: string,
    serverId: string,
    userId: string,
  ) {
    if (!channelId || !serverId) {
      throw new BadRequestException('Channel ID and Server ID are required');
    }

    const server = await firstValueFrom(
      this.serverClient.send({ cmd: 'get-server' }, { serverId, userId }),
    );

    if (!server) {
      throw new BadRequestException('Server not found');
    }

    const channelExist = await firstValueFrom(
      this.serverClient.send({ cmd: 'get-channel' }, { serverId, channelId }),
    );

    if (!channelExist) {
      throw new BadRequestException('Channel not found');
    }

    const member = server.members.find((member) => member.userId === userId);

    if (!member) {
      throw new BadRequestException('Member not found');
    }

    await this.usersService.create({ id: userId });

    const chatMember = await this.prismaService.member.findFirst({
      where: {
        id: member.id,
      },
    });

    if (!chatMember) {
      await this.prismaService.member.create({
        data: {
          id: member.id,
          role: member.role,
          userId: userId,
        },
      });
    }

    const message = await this.prismaService.message.create({
      data: {
        content,
        fileUrl,
        channelId: channelId as string,
        memberId: member.id,
      },
      include: {
        member: {
          include: {
            user: true,
          },
        },
      },
    });

    const eventKey = `chat:${channelId}:messages`;
    this.chatGateway.server.emit(eventKey, message);

    return message;
  }

  async updateMessage(
    content: string,
    messageId: string,
    channelId: string,
    serverId: string,
    userId: string,
  ) {
    const { isMessageOwner, ...data } = await this.validate(
      messageId,
      channelId,
      serverId,
      userId,
    );

    if (!isMessageOwner) {
      throw new BadRequestException('Not allowed');
    }

    const message = await this.prismaService.message.update({
      where: {
        id: messageId as string,
      },
      data: {
        content,
      },
      include: {
        member: {
          include: {
            user: true,
          },
        },
      },
    });

    const eventKey = `chat:${channelId}:messages:update`;
    this.chatGateway.server.emit(eventKey, message);

    return message;
  }

  async deleteMessage(
    messageId: string,
    channelId: string,
    serverId: string,
    userId: string,
  ) {
    await this.validate(messageId, channelId, serverId, userId);

    const message = await this.prismaService.message.update({
      where: {
        id: messageId as string,
      },
      data: {
        fileUrl: null,
        content: 'This message has been deleted',
        deleted: true,
      },
      include: {
        member: {
          include: {
            user: true,
          },
        },
      },
    });

    const eventKey = `chat:${channelId}:messages:update`;
    this.chatGateway.server.emit(eventKey, message);

    return message;
  }

  async validate(
    messageId: string,
    channelId: string,
    serverId: string,
    userId: string,
  ) {
    if (!channelId || !serverId || !messageId) {
      throw new BadRequestException(
        'Channel ID, Server ID and Message ID are required',
      );
    }

    const server = await firstValueFrom(
      this.serverClient.send({ cmd: 'get-server' }, { serverId, userId }),
    );

    if (!server) {
      throw new BadRequestException('Server not found');
    }

    const channelExist = await firstValueFrom(
      this.serverClient.send({ cmd: 'get-channel' }, { serverId, channelId }),
    );

    if (!channelExist) {
      throw new BadRequestException('Channel not found');
    }

    const member = server.members.find((member) => member.userId === userId);

    await this.usersService.create({ id: userId });

    if (!member) {
      throw new BadRequestException('Member not found');
    }

    const chatMember = await this.prismaService.member.findFirst({
      where: {
        id: member.id,
      },
    });

    if (!chatMember) {
      await this.prismaService.member.create({
        data: {
          id: member.id,
          role: member.role,
          userId: member.user,
        },
      });
    }

    const message = await this.prismaService.message.findFirst({
      where: {
        id: messageId as string,
        channelId: channelId as string,
      },
      include: {
        member: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!message || message.deleted) {
      throw new BadRequestException('Message not found');
    }

    const isMessageOwner = message.memberId === member.id;
    const isAdmin = member.role === MemberRole.ADMIN;
    const isModerator = member.role === MemberRole.MODERATOR;
    const canModife = isMessageOwner || isAdmin || isModerator;

    if (!canModife) {
      throw new BadRequestException('Not allowed');
    }

    return { message, isMessageOwner };
  }
}
