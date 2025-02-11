import {
  Controller,
  Post,
  Patch,
  Body,
  Param,
  Inject,
  Delete,
  UseGuards,
  Get,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser, JwtAccessGuard } from '@app/auth';
import { FilesService } from '@app/files';

@UseGuards(JwtAccessGuard)
@Controller('servers')
export class ServersController {
  constructor(
    @Inject('SERVERS_CLIENT') private readonly serversClient: ClientProxy,
    private readonly filesService: FilesService,
  ) {}

  @Get(':serverId')
  async get(
    @Param('serverId') serverId: string,
    @CurrentUser('id') userId: string,
  ) {
    const result = await firstValueFrom(
      this.serversClient.send({ cmd: 'get-server' }, { serverId, userId }),
    );
    return result;
  }

  @Post()
  @UseInterceptors(
    FileInterceptor("imageFile", {
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.startsWith("image/")) {
          return callback(new Error("File must be an image"), false);
        }
        callback(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    })
  )
  async create(
    @CurrentUser('id') userId: string,
    @Body('name') name: string,
    @UploadedFile() imageFile: Express.Multer.File,
  ) {
    if (!imageFile) {
      throw new BadRequestException('The image file is required');
    }

    const fileName = await this.filesService.uploadFile(imageFile);
    const imageUrl = await this.filesService.getFileUrl(fileName);

    const result = await firstValueFrom(
      this.serversClient.send(
        { cmd: 'create-server' },
        { userId, createServerDto: { name, imageUrl } },
      ),
    );
    return result;
  }

  @Patch(':serverId')
  @UseInterceptors(
    FileInterceptor("imageFile", {
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.startsWith("image/")) {
          return callback(new Error("File must be an image"), false);
        }
        callback(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    })
  )
  async update(
    @Param('serverId') serverId: string,
    @CurrentUser('id') userId: string,
    @Body('name') name: string,
    @UploadedFile() imageFile: Express.Multer.File,
  ) {
    if (!imageFile) {
      throw new BadRequestException('The image file is required');
    }

    const fileName = await this.filesService.uploadFile(imageFile);
    const imageUrl = await this.filesService.getFileUrl(fileName);

    const result = await firstValueFrom(
      this.serversClient.send(
        { cmd: 'update-server' },
        { serverId, userId, updateServerDto: {name, imageUrl} },
      ),
    );
    return result;
  }

  @Delete(':serverId')
  async delete(
    @Param('serverId') serverId: string,
    @CurrentUser('id') userId: string,
  ) {
    const result = await firstValueFrom(
      this.serversClient.send({ cmd: 'delete-server' }, { serverId, userId }),
    );
    return result;
  }

  @Patch(':serverId/invite-code')
  async invite(
    @Param('serverId') serverId: string,
    @CurrentUser('id') userId: string,
  ) {
    const result = await firstValueFrom(
      this.serversClient.send({ cmd: 'invite-server' }, { serverId, userId }),
    );
    return result;
  }

  @Patch(':serverId/leave')
  async leave(
    @Param('serverId') serverId: string,
    @CurrentUser('id') userId: string,
  ) {
    const result = await firstValueFrom(
      this.serversClient.send({ cmd: 'leave-server' }, { serverId, userId }),
    );
    return result;
  }
}
