import { Controller, Get } from '@nestjs/common';
import { FilesServiceService } from './files-service.service';

@Controller()
export class FilesServiceController {
  constructor(private readonly filesServiceService: FilesServiceService) {}

  @Get()
  getHello(): string {
    return this.filesServiceService.getHello();
  }
}
