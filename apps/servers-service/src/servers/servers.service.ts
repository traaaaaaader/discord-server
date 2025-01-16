import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { MemberRole } from '@prisma/client';
import { PrismaService } from '@app/database';
import { CreateServerDto } from './dto/create-server.dto';

@Injectable()
export class ServersService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(userId: string, { name, imageUrl }: CreateServerDto) {
    if (!userId) {
      throw new UnauthorizedException();
    }

    if (!name) {
      throw new BadRequestException();
    }

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
    if(!userId) {
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
    if(!userId) {
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
    if(!userId) {
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
}
