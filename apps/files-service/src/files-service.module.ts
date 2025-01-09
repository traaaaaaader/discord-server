import { Module } from '@nestjs/common';
import { FilesServiceController } from './files-service.controller';
import { FilesServiceService } from './files-service.service';

@Module({
  imports: [],
  controllers: [FilesServiceController],
  providers: [FilesServiceService],
})
export class FilesServiceModule {}
