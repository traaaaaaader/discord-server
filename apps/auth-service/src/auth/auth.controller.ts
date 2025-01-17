import { Controller } from '@nestjs/common';
import { AuthService, RegisterDto } from '@app/auth';
import { CreateUserDto } from '@app/auth/dto/create-user.dto';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern({ cmd: 'register' })
  async register(@Payload() dto: RegisterDto) {
    return await this.authService.register(dto);
  }

  @MessagePattern({ cmd: 'login' })
  async login(@Payload() userId: string) {
    return await this.authService.generateTokens(userId);
  }

  @MessagePattern({ cmd: 'refresh' })
  async refresh(@Payload() userId: string ) {
    return await this.authService.generateTokens(userId);
  }

  @MessagePattern({ cmd: 'google' })
  google() {}

  @MessagePattern({ cmd: 'google/callback' })
  async googleCallback(@Payload() user: CreateUserDto) {
    return await this.authService.googleAuth(user);
  }
}
