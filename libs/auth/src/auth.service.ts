import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { hash, verify } from 'argon2';

import { CreateUserDto } from '@app/auth/dto/create-user.dto';
import { UsersService } from '@app/users/users.service';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(
    { email, name, password, imageUrl }: RegisterDto,
  ) {
    const hashedPassword = await hash(password);

    const createdUser = await this.usersService.create({
      email,
      name,
      hashedPassword,
      imageUrl,
    });

    return await this.generateTokens(createdUser.id);
  }

  async googleAuth(user: CreateUserDto ) {
    if (user) {
      return 'no user from google';
    }

    const { email, name, imageUrl } = user;

    const userByEmail = await this.usersService.findOne({ email });

    if (userByEmail) {
      return await this.generateTokens(userByEmail.id);
    }

    const createdUser = await this.usersService.create(
      { email, name, imageUrl },
      'oauth',
    );

    return await this.generateTokens(createdUser.id);
  }

  async generateTokens(userId: string) {
    const accessToken = await this.jwtService.signAsync(
      { userId },
      {
        secret: this.configService.getOrThrow('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.getOrThrow('JWT_ACCESS_EXPIRES'),
      },
    );
    const refreshToken = await this.jwtService.signAsync(
      { userId },
      {
        secret: this.configService.getOrThrow('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.getOrThrow('JWT_REFRESH_EXPIRES'),
      },
    );

    return { accessToken, refreshToken };
  }

  async validateUser(email: string, password: string) {
    const userByEmail = await this.usersService.findOne({ email });

    if (!userByEmail) {
      return null;
    }

    if (!userByEmail.hashedPassword) {
      throw new BadRequestException(
        'Probably you already have an account via google',
      );
    }

    const isValidPassword = await verify(userByEmail.hashedPassword, password);

    if (!isValidPassword) {
      return null;
    }

    return userByEmail;
  }
}
