import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}
