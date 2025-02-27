import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { AuthService } from '@app/core-lib';

import { LoginUserDto, RegisterDto, CreateUserDto } from '@app/database';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern({ cmd: 'register' })
  async register(@Payload() dto: RegisterDto) {
    return await this.authService.register(dto);
  }

  @MessagePattern({ cmd: 'login' })
  async login(@Payload() body: LoginUserDto) {
    return await this.authService.login(body);
  }

  @MessagePattern({ cmd: 'refresh' })
  async refresh(@Payload() userId: string) {
    return await this.authService.generateTokens(userId);
  }

  @MessagePattern({ cmd: 'google/callback' })
  async googleCallback(@Payload() user: CreateUserDto) {
    return await this.authService.googleAuth(user);
  }
}
