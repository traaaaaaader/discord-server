import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService, RegisterDto } from '@app/auth';
import { UsersService } from '@app/users';
import { CreateUserDto } from '@app/auth/dto/create-user.dto';

@Controller()
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @MessagePattern({ cmd: 'register' })
  async register(@Payload() dto: RegisterDto) {
    return await this.authService.register(dto);
  }

  @MessagePattern({ cmd: 'login' })
  async login(@Payload() userId: string) {
    return await this.authService.generateTokens(userId);
  }

  @MessagePattern({ cmd: 'refresh' })
  async refresh(@Payload() userId: string) {
    return await this.authService.generateTokens(userId);
  }

  @MessagePattern({ cmd: 'get' })
  async get(@Payload() userId: string) {
    return await this.usersService.findOne({ id: userId }); //TODO
  }

  @MessagePattern({ cmd: 'google' })
  google() {}

  @MessagePattern({ cmd: 'google/callback' })
  async googleCallback(@Payload() user: CreateUserDto) {
    return await this.authService.googleAuth(user);
  }
}
