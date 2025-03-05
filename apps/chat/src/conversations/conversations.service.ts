import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class ConversationsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly userService: UsersService,
  ) {}

  async create(userId: string, name: string) {
    if (!userId) {
      throw new UnauthorizedException('User ID missing.');
    }
    await this.userService.create({ id: userId });

    if (!name) {
      throw new BadRequestException('User name missing.');
    }
    const user = await this.userService.create({ name });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const existingConversation = await this.prismaService.conversation.findFirst({
      where: {
        OR: [
          { userOneId: userId, userTwoId: user.id },
          { userOneId: user.id, userTwoId: userId }
        ]
      }
    });

    if (existingConversation) {
      return existingConversation;
    }

    return await this.prismaService.conversation.create({
      data: {
        userOneId: userId,
        userTwoId: user.id,
      },
      include: {
        userOne: true,
        userTwo: true,
      },
    });
  }

  async get(userId: string) {
    if (!userId) {
      throw new UnauthorizedException('User ID missing.');
    }
    return await this.prismaService.conversation.findMany({
      where: {
        OR: [
          {
            userOneId: userId,
          },
          {
            userTwoId: userId,
          },
        ],
      },
      include: {
        userOne: true,
        userTwo: true,
      },
    });
  }
}
