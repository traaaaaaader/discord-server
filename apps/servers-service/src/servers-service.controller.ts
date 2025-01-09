import { Controller, Get } from '@nestjs/common';
import { ServersServiceService } from './servers-service.service';

@Controller()
export class ServersServiceController {
  constructor(private readonly serversServiceService: ServersServiceService) {}

  @Get()
  getHello(): string {
    return this.serversServiceService.getHello();
  }
}
