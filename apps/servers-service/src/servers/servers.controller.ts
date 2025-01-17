import {
  Controller,
} from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ServersService } from './servers.service';
import { CreateServerDto } from '@app/database';

@Controller()
export class ServersController {
  constructor(private readonly serversService: ServersService) {}

  @MessagePattern({ cmd: "create-server" })
  async create(
    @Payload() data: { userId: string; createServerDto: CreateServerDto }
  ) {
    return await this.serversService.create(data.userId, data.createServerDto);
  }

  @MessagePattern({ cmd: "update-server" })
  async update(
    @Payload() data: { serverId: string; userId: string; updateServerDto: CreateServerDto }
  ) {
    return await this.serversService.update(data.serverId, data.userId, data.updateServerDto);
  }

  @MessagePattern({ cmd: "delete-server" })
  async delete(
    @Payload() data: { serverId: string; userId: string}
  ) {
    return await this.serversService.delete(data.serverId, data.userId);
  }

  @MessagePattern({ cmd: "invite-server" })
  async invite(
    @Payload() data: { serverId: string; userId: string}
  ) {
    return this.serversService.invite(data.serverId, data.userId);
  }

  @MessagePattern({ cmd: "leave-server" })
  async leave(
    @Payload() data: { serverId: string; userId: string}
  ) {
    return await this.serversService.leave(data.serverId, data.userId);
  }
}
