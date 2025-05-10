import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService as UsersLibService } from '@app/core-lib';
import { EditUserDto, FindUserDto } from '@app/database';
import { User } from '@prisma/db-auth';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly usersService: UsersLibService,
  ) {}

  async create({ id, name }: FindUserDto) {
    this.logger.log(`Create user request: id=${id}, name=${name}`);

    if (!id && !name) {
      this.logger.error('Create user failed: ID and name missing');
      throw new BadRequestException('ID and name missing.');
    }

    try {
      const userFromChat = await this.prismaService.user.findUnique({
        where: { id, name },
      });

      if (userFromChat) {
        this.logger.log(`Existing user found: ${userFromChat.id}`);
        return userFromChat;
      }

      const user = await this.usersService.findOne({ id, name });
      if (!user) {
        this.logger.error(`User not found: id=${id}, name=${name}`);
        throw new UnauthorizedException('User not found');
      }

      const { email, hashedPassword, ...userData } = user;
      const createdUser = await this.prismaService.user.create({
        data: {
          ...userData,
          conversationsInitiated: { create: [] },
          conversationsReceived: { create: [] },
        },
      });

      this.logger.log(`User created: ${createdUser.id}`);
      return createdUser;
    } catch (error) {
      this.logger.error(
        `User creation failed: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async edit(userId: string, body: EditUserDto) {
    this.logger.log(`Edit user request: ${userId}, data=${JSON.stringify(body)}`);

    if (!userId) {
      this.logger.error('Edit user failed: Unauthorized');
      throw new UnauthorizedException();
    }

    const { name, imageUrl } = body;
    if (!name || !imageUrl) {
      this.logger.error('Edit user failed: Missing values');
      throw new BadRequestException('Missing values.');
    }

    try {
      await this.prismaService.user.update({
        where: { id: userId },
        data: { name, imageUrl },
      });
      this.logger.log(`User updated: ${userId}`);
    } catch (error) {
      this.logger.error(
        `User update failed: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}