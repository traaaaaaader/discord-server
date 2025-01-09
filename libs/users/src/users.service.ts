import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { FindUserDto } from './dto/find-user.dto';
import { PrismaService } from '@app/database';


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
