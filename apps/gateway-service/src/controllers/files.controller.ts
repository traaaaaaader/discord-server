import {
  Controller,
  UploadedFile,
	BadRequestException,
	Post,
  Delete,
  Param,
} from '@nestjs/common';
import { JwtAccessGuard } from '@app/auth';
import { FilesService } from '@app/files';
import { FileUpload } from '../decorators/file-upload.decorator';

// @UseGuards(JwtAccessGuard)
@Controller('files')
export class FilesController {
  constructor(
				private readonly filesService: FilesService,
  ) {}

  @Post()
  @FileUpload()
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('The file is required');
    }

    const fileName = await this.filesService.uploadFile(file);
    const url = await this.filesService.getFileUrl(fileName);
    return url;
  }

  @Delete(":fileName")
  async deleteFile(@Param('fileName') fileName: string,) {
    await this.filesService.deleteFile(fileName);
  }
}
