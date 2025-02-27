import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { CreateUserDto, FindUserDto, EditUserDto } from '@app/database';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(
    { email, hashedPassword, name, imageUrl }: CreateUserDto,
    type: 'auth' | 'oauth' = 'auth',
  ) {
    const userByEmail = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (userByEmail) {
      if (type === 'auth') {
        throw new ConflictException('User with this email is already existing');
      }
      return userByEmail;
    }

    const user = await this.prismaService.user.create({
      data: {
        email,
        hashedPassword: type === 'auth' ? hashedPassword : null,
        name,
        imageUrl,
      },
    });

    return user;
  }

  async edit(userId: string, body: EditUserDto) {
    return await this.prismaService.user.update({
      where: {
        id: userId,
      },
      data: {
        name: body.name,
        imageUrl: body.imageUrl,
      },
    });
  }

  async findOne({ id, email }: FindUserDto) {
    if (!id && !email) {
      throw new BadRequestException();
    }

    const user = await this.prismaService.user.findFirst({
      where: {
        id,
        email,
      },
    });

    return user;
  }
}
