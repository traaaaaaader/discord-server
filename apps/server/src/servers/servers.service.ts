import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import { PrismaService } from '../../prisma/prisma.service';

import { MemberRole } from '@prisma/db-server';
import { CreateServerDto } from '@app/database';
import { UsersService } from '../users/users.service';

@Injectable()
export class ServersService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  async create(userId: string, { name, imageUrl }: CreateServerDto) {
    if (!userId) {
      throw new UnauthorizedException();
    }

    if (!name) {
      throw new BadRequestException('Missing name');
    }

    await this.usersService.create(userId);


    return await this.prismaService.server.create({
      data: {
        userId: userId,
        name,
        imageUrl,
        inviteCode: uuidv4(),
        channels: {
          create: [{ name: 'general', userId }],
        },
        members: {
          create: [{ userId, role: MemberRole.ADMIN }],
        },
      },
    });
  }

  async update(
    serverId: string,
    userId: string,
    { name, imageUrl }: CreateServerDto,
  ) {
    if (!userId) {
      throw new UnauthorizedException();
    }

    return await this.prismaService.server.update({
      where: {
        id: serverId,
        userId: userId,
      },
      data: {
        name,
        imageUrl,
      },
    });
  }

  async delete(serverId: string, userId: string) {
    if (!userId) {
      throw new UnauthorizedException();
    }

    return await this.prismaService.server.delete({
      where: {
        id: serverId,
        userId: userId,
      },
    });
  }

  async invite(serverId: string, userId: string) {
    if (!userId) {
      throw new UnauthorizedException();
    }

    if (!serverId) {
      throw new BadRequestException();
    }

    return await this.prismaService.server.update({
      where: {
        id: serverId,
        userId: userId,
      },
      data: {
        inviteCode: uuidv4(),
      },
    });
  }

  async leave(serverId: string, userId: string) {
    if (!userId) {
      throw new UnauthorizedException();
    }

    if (!serverId) {
      throw new BadRequestException();
    }

    return await this.prismaService.server.update({
      where: {
        id: serverId,
        userId: {
          not: userId,
        },
        members: {
          some: {
            userId: userId,
          },
        },
      },
      data: {
        members: {
          deleteMany: {
            userId: userId,
          },
        },
      },
    });
  }

  async getServer(serverId: string, userId: string) {
    const server = await this.prismaService.server.findFirst({
      where: {
        id: serverId as string,
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        members: {
          include: {
            user: true,
          },
        },
        channels: true,
      },
    });
    return server;
  }

  async getServers(userId: string) {
    return await this.prismaService.server.findMany({
      where: {
        members: {
          some: {
            userId: userId,
          },
        },
      },
      include: {
        channels: true,
      },
    });
  }
}
