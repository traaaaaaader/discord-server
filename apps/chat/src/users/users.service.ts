import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { UsersService as UsersLibService } from '@app/core-lib';
import { EditUserDto, FindUserDto } from '@app/database';

import { User } from '@prisma/db-auth';

@Injectable()
export class UsersService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly usersService: UsersLibService,
  ) {}

  async create({ id, name }: FindUserDto) {
    if (!id && !name) {
      throw new BadRequestException('ID and name missing.');
    }

    const userFromChat = await this.prismaService.user.findUnique({
      where: {
        id,
        name,
      },
    });

    if (!userFromChat) {
      const user: User = await this.usersService.findOne({
        id,
        name,
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const { email, hashedPassword, ...userData } = user;

      return await this.prismaService.user.create({
        data: {
          ...userData,
          conversationsInitiated: {
            create: [],
          },
          conversationsReceived: {
            create: [],
          },
        },
      });
    }

    return userFromChat;
  }

  async edit(userId: string, body: EditUserDto) {
    if (!userId) {
      throw new UnauthorizedException();
    }

    const { name, imageUrl } = body;

    if (!name || !imageUrl) {
      throw new BadRequestException('Missing values.');
    }

    await this.prismaService.user.update({
      where: {
        id: userId,
      },
      data: {
        name,
        imageUrl,
      },
    });
  }
}
