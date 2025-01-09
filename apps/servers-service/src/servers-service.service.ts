import { Injectable } from '@nestjs/common';

@Injectable()
export class ServersServiceService {
  getHello(): string {
    return 'Hello World!';
  }
}
