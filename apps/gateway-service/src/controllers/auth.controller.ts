import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser, GoogleGuard, RegisterDto, CreateUserDto } from '@app/auth';
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
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await firstValueFrom(
      this.authClient.send({ cmd: 'register' }, body),
    );

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: true,
    });
    return res.json({ accessToken: result.accessToken });
  }

  @UseGuards(AuthGuard('local'))
  @Post('login')
  async login(
    @CurrentUser('id') userId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await firstValueFrom(
      this.authClient.send({ cmd: 'login' }, userId),
    );
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: true,
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
      this.authClient.send({ cmd: 'refresh' }, userId),
    );
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: true,
    });
    return res.json({ accessToken: result.accessToken });
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.cookie('refreshToken', '');
    res.sendStatus(200);
  }

  @UseGuards(GoogleGuard)
  @Get('google')
  google() {}

  @UseGuards(GoogleGuard)
  @Get('google/callback')
  async googleCallback(
    @Req() req: Request & { user: CreateUserDto },
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await firstValueFrom(
      this.authClient.send({ cmd: 'google/callback' }, req.user),
    );
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: true,
    });
    return res.json({ accessToken: result.accessToken });
  }
}
