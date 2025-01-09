import { Injectable } from '@nestjs/common';

@Injectable()
export class FilesServiceService {
  getHello(): string {
    return 'Hello World!';
  }
}
