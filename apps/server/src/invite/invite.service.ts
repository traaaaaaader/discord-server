import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class InviteService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  async invite(userId: string, inviteCode: string) {
    if (!userId) {
      throw new UnauthorizedException('User ID missing.');
    }

    await this.usersService.create(userId);

    if (!inviteCode) {
      throw new BadRequestException('Invite code missing.');
    }

    return await this.prismaService.server.update({
      where: {
        inviteCode,
      },
      data: {
        members: {
          create: {
            userId,
          },
        },
      },
      include: {
        members: true,
        channels: true,
      },
    });
  }

  async update(userId: string, serverId: string) {
    if (!userId) {
      throw new UnauthorizedException('User ID missing.');
    }

    if (!serverId) {
      throw new BadRequestException('Server ID missing.');
    }

    return await this.prismaService.server.update({
      where: {
        id: serverId,
        userId: userId,
      },
      data: {
        inviteCode: uuidv4(),
      },
      include: {
        members: true,
        channels: true,
      },
    });
  }
}
