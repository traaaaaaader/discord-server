import {
  Body,
  Controller,
  Delete,
  Inject,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser, JwtAccessGuard } from '@app/auth';
import { FilesService } from '@app/files';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { FileUpload } from '../decorators/file-upload.decorator';

@UseGuards(JwtAccessGuard)
@Controller('messages')
export class MessagesController {
  constructor(
    @Inject('CHAT_CLIENT') private readonly chatClient: ClientProxy,
    private readonly filesService: FilesService,
  ) {}

  @Post()
  @FileUpload()
  async send(
    @CurrentUser('id') userId: string,
    @Body('content') content: string,
    @Query() query: { channelId: string; serverId: string },
    @UploadedFile() file?: Express.Multer.File,
  ) {
    let fileUrl: string | undefined;

    if (file) {
      const fileName = await this.filesService.uploadFile(file);
      fileUrl = await this.filesService.getFileUrl(fileName);
    }

    const result = await firstValueFrom(
      this.chatClient.send(
        { cmd: 'send-message' },
        { userId, message: {content, fileUrl}, query },
      ),
    );
    
    return result;
  }

  @Patch()
  async update(
    @CurrentUser('id') userId: string,
    @Body() content: string,
    @Query() query: { messageId: string; channelId: string; serverId: string },
  ) {
    const result = await firstValueFrom(
      this.chatClient.send(
        { cmd: 'update-message' },
        { userId, content, query },
      ),
    );
    return result;
  }

  @Delete()
  async delete(
    @CurrentUser('id') userId: string,
    @Query() query: { messageId: string; channelId: string; serverId: string },
  ) {
    const result = await firstValueFrom(
      this.chatClient.send({ cmd: 'delete-message' }, { userId, query }),
    );
    return result;
  }
}
