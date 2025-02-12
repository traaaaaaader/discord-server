import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { firstValueFrom } from 'rxjs';
import { ClientProxy } from '@nestjs/microservices';
import { ChatGateway } from '../chat.gateway';
import { MemberRole } from '@prisma/client';
import { UsersService } from '@app/users';
import { CreateMessageDto } from '../dto/create-message.dto';

@Injectable()
export class MessagesService {
  readonly MESSAGES_BATCH = 10;

  constructor(
    private readonly prismaService: PrismaService,
    @Inject('SERVERS_CLIENT') private readonly serversClient: ClientProxy,
    @Inject('CHANNELS_CLIENT') private readonly channelsClient: ClientProxy,
    private readonly userService: UsersService,
    private readonly chatGateway: ChatGateway,
  ) {}

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
      this.serversClient.send({ cmd: 'get-server' }, { serverId, userId }),
    );

    if (!server) {
      throw new BadRequestException('Server not found');
    }

    const channelExist = await firstValueFrom(
      this.channelsClient.send(
        { cmd: 'get-channel' },
        { serverId, channelId },
      ),
    );

    if (!channelExist) {
      throw new BadRequestException('Channel not found');
    }

    const member = server.members.find((member) => member.userId === userId);

    if (!member) {
      throw new BadRequestException('Member not found');
    }

    const userFromChat = await this.prismaService.user.findFirst({
      where: {
        id: userId,
      },
    });

    if (!userFromChat) {
      const user = await this.userService.findOne({
        id: userId,
      })

      await this.prismaService.user.create({
        data: {
          id: userId,
          name: user.name,
        }
      })
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

    this.chatGateway.server.emit(`chat:${channelId}:messages`, message);

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

    this.chatGateway.server.emit(`chat:${channelId}:messages:update`, message);

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

    this.chatGateway.server.emit(`chat:${channelId}:messages:update`, message);

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
      this.serversClient.send({ cmd: 'get-server' }, { serverId, userId }),
    );

    if (!server) {
      throw new BadRequestException('Server not found');
    }

    const channelExist = await firstValueFrom(
      this.channelsClient.send(
        { cmd: 'get-channel' },
        { serverId, channelId },
      ),
    );

    if (!channelExist) {
      throw new BadRequestException('Channel not found');
    }

    const member = server.members.find((member) => member.userId === userId);

    const userFromChat = await this.prismaService.user.findFirst({
      where: {
        id: userId,
      },
    });

    if (!userFromChat) {
      const user = await this.userService.findOne({
        id: userId,
      })

      await this.prismaService.user.create({
        data: {
          id: userId,
          name: user.name,
        }
      })
    }

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
