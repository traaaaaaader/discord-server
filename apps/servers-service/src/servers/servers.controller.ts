import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { JwtAccessGuard, CurrentUser } from '@app/auth';
import { ServersService } from './servers.service';
import { CreateServerDto } from './dto/create-server.dto';

@UseGuards(JwtAccessGuard)
@Controller('servers')
export class ServersController {
  constructor(private readonly serversService: ServersService) {}

  @Post()
  async create(
    @CurrentUser('id') userId: string,
    @Body() createServerDto: CreateServerDto,
  ) {
    return await this.serversService.create(userId, createServerDto);
  }

  @Patch(':serverId')
  async update(
    @Param('serverId') serverId: string,
    @CurrentUser('id') userId: string,
    @Body() updateServerDto: CreateServerDto,
  ) {
    return await this.serversService.update(serverId, userId, updateServerDto);
  }

  @Delete(':serverId')
  async delete(
    @Param('serverId') serverId: string,
    @CurrentUser('id') userId: string,
  ) {
    return await this.serversService.delete(serverId, userId);
  }

  @Patch(':serverId/invite-code')
  async invite(
    @Param('serverId') serverId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.serversService.invite(serverId, userId);
  }

  @Patch(':serverId/leave')
  async leave(
    @Param('serverId') serverId: string,
    @CurrentUser('id') userId: string,
  ) {
    return await this.serversService.leave(serverId, userId);
  }
}
