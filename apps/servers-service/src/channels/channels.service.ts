import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { MemberRole } from '@prisma/db-server';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateChannelPayload,
  DeleteChannelPayload,
  UpdateChannelPayload,
} from '@app/database';

@Injectable()
export class ChannelsService {
  constructor(private readonly prismaService: PrismaService) {}

  async get(channelId: string) {
    return await this.prismaService.channel.findUnique({
      where: {
        id: channelId,
      },
    }); 
  };

  async create({
    userId,
    serverId,
    createChannelDto: { name, type },
  }: CreateChannelPayload) {
    if (!userId) {
      throw new UnauthorizedException();
    }

    if (!serverId) {
      throw new BadRequestException();
    }

    return await this.prismaService.server.update({
      where: {
        id: serverId,
        members: {
          some: {
            userId: userId,
            role: {
              in: [MemberRole.ADMIN, MemberRole.MODERATOR],
            },
          },
        },
      },
      data: {
        channels: {
          create: {
            userId: userId,
            name,
            type,
          },
        },
      },
    });
  }

  async update({
    userId,
    serverId,
    channelId,
    updateChannelDto: { name, type },
  }: UpdateChannelPayload) {
    if (!userId) {
      throw new UnauthorizedException();
    }

    if (!serverId || !channelId) {
      throw new BadRequestException();
    }

    return await this.prismaService.server.update({
      where: {
        id: serverId,
        members: {
          some: {
            userId: userId,
            role: {
              in: [MemberRole.ADMIN, MemberRole.MODERATOR],
            },
          },
        },
      },
      data: {
        channels: {
          update: {
            where: {
              id: channelId,
            },
            data: {
              name,
              type,
            },
          },
        },
      },
    });
  }

  async delete({ userId, serverId, channelId }: DeleteChannelPayload) {
    if (!userId) {
      throw new UnauthorizedException();
    }

    if (!serverId || !channelId) {
      throw new BadRequestException();
    }

    return await this.prismaService.server.update({
      where: {
        id: serverId,
        members: {
          some: {
            userId: userId,
            role: {
              in: [MemberRole.ADMIN, MemberRole.MODERATOR],
            },
          },
        },
      },
      data: {
        channels: {
          delete: {
            id: channelId,
          },
        },
      },
    });
  }

  async getChannel(serverId: string, channelId: string) {
    const server = await this.prismaService.channel.findFirst({
      where: {
        id: channelId as string,
        serverId: serverId as string,
      },
    });
    return server;
  }
}
