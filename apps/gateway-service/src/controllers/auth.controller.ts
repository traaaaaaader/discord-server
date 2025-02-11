import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser, GoogleGuard } from '@app/auth';
import { CreateUserDto } from '@app/auth/dto/create-user.dto';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesService } from '@app/files';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject('AUTH_CLIENT') private readonly authClient: ClientProxy,
    private readonly filesService: FilesService,
  ) {}

  @Post('register')
  @UseInterceptors(
    FileInterceptor('imageFile', {
      fileFilter: (req, file, callback) => {
        if (file && !file.mimetype.startsWith('image/')) {
          return callback(new Error('File must be an image'), false);
        }
        callback(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async register(
    @Body() body: { name: string; email: string; password: string },
    @Res({ passthrough: true }) res: Response,
    @UploadedFile() imageFile?: Express.Multer.File,
  ) {
    let imageUrl: string | undefined;

    if (imageFile) {
      const fileName = await this.filesService.uploadFile(imageFile);
      imageUrl = await this.filesService.getFileUrl(fileName);
    }

    const result = await firstValueFrom(
      this.authClient.send({ cmd: 'register' }, { ...body, imageUrl }),
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
