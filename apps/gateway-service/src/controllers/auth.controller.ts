import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Req,
  Res,
  Session,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import {
  CurrentUser,
  GoogleGuard,
  RegisterDto,
  CreateUserDto,
  JwtAccessGuard,
} from '@app/auth';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject('AUTH_CLIENT') private readonly authClient: ClientProxy,
  ) {}

  @Post('register')
  async register(
    @Body() body: RegisterDto,
    @Session() session: Record<string, any>,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await firstValueFrom(
      this.authClient.send({ cmd: 'register' }, body),
    );

    session.accessToken = result.accessToken;
    session.refreshToken = result.refreshToken;

    return res.json({ user: result.user });
  }

  @UseGuards(AuthGuard('local'))
  @Post('login')
  async login(
    @CurrentUser('id') userId: string,
    @Session() session: Record<string, any>,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await firstValueFrom(
      this.authClient.send({ cmd: 'login' }, userId),
    );
    session.accessToken = result.accessToken;
    session.refreshToken = result.refreshToken;

    return res.json({ user: result.user });
  }

  @UseGuards(AuthGuard('jwt-refresh'))
  @Post('refresh')
  async refresh(
    @CurrentUser('id') userId: string,
    @Session() session: Record<string, any>,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await firstValueFrom(
      this.authClient.send({ cmd: 'refresh' }, userId),
    );
    session.accessToken = result.accessToken;
    session.refreshToken = result.refreshToken;

    return res.json({ user: result.user });
  }

  @Post('logout')
  async logout(
    @Session() session: Record<string, any>,
    @Res({ passthrough: true }) res: Response,
  ) {
    session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
      }
    });
    res.sendStatus(200);
  }

  @UseGuards(JwtAccessGuard)
  @Get('get')
  async get(@CurrentUser('id') userId: string) {
    const result = await firstValueFrom(
      this.authClient.send({ cmd: 'get' }, userId),
    );

    return result;
  }

  @UseGuards(GoogleGuard)
  @Get('google')
  google() {}

  @UseGuards(GoogleGuard)
  @Get('google/callback')
  async googleCallback(
    @Req() req: Request & { user: CreateUserDto },
    @Session() session: Record<string, any>,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await firstValueFrom(
      this.authClient.send({ cmd: 'google/callback' }, req.user),
    );

    session.accessToken = result.accessToken;
    session.refreshToken = result.refreshToken;

    return res.json({ user: result.user });
  }
}
