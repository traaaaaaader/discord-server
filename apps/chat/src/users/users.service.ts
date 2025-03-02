import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { UsersService as UsersLibService } from '@app/core-lib';
import { EditUserDto } from '@app/database';

import { User } from '@prisma/db-auth';

@Injectable()
export class UsersService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly usersService: UsersLibService,
  ) {}

  async create(userId: string) {
    const userFromChat = await this.prismaService.user.findFirst({
      where: {
        id: userId,
      },
    });

    if (!userFromChat) {
      const user: User = await this.usersService.findOne({
        id: userId,
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const { email, hashedPassword, ...userData } = user;

      await this.prismaService.user.create({
        data: {
          ...userData,
        },
      });
    }
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
