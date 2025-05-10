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
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

import { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';

import { CurrentUser, GoogleGuard } from '@app/core-lib';

import { RegisterDto, CreateUserDto, LoginUserDto } from '@app/database';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(process.env.RABBIT_MQ_CORE_CLIENT)
    private readonly coreClient: ClientProxy,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  async register(
    @Body() body: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await firstValueFrom(
      this.coreClient.send({ cmd: 'register' }, body),
    );

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: true,
      // secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
    });

    return res.json({ accessToken: result.accessToken });
  }

  @UseGuards(AuthGuard('local'))
  @Post('login')
  async login(
    @Body() body: LoginUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await firstValueFrom(
      this.coreClient.send({ cmd: 'login' }, body),
    );
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: true,
      // secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
    });

    return res.json({ accessToken: result.accessToken });
  }

  @UseGuards(AuthGuard('jwt-refresh'))
  @Post('refresh')
  async refresh(
    @CurrentUser('id') userId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await firstValueFrom(
      this.coreClient.send({ cmd: 'refresh' }, userId),
    );
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: true,
      // secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
    });

    return res.json({ accessToken: result.accessToken });
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('refreshToken');
    res.sendStatus(200);
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
      this.coreClient.send({ cmd: 'google/callback' }, req.user),
    );

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: true,
      // secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
    });

    res.redirect(this.configService.getOrThrow<string>('CLIENT_URL'));
  }
}
