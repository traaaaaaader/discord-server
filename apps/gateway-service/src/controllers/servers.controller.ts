import { Controller, Post, Patch, Body, Param, Inject, Delete, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { CurrentUser, JwtAccessGuard } from '@app/auth';
import { CreateServerDto } from '@app/database';


@UseGuards(JwtAccessGuard)
@Controller('servers')
export class ServersController {
  constructor(@Inject('SERVERS_CLIENT') private readonly serversClient: ClientProxy) {}

  @Post()
  async create(
		@CurrentUser('id') userId: string,
    @Body() createServerDto: CreateServerDto,
	) {
    const result = await firstValueFrom(
      this.serversClient.send({ cmd: 'create-server' }, { userId, createServerDto }),
    );
    return result;
  }

  @Patch(':serverId')
  async update(
		@Param('serverId') serverId: string,
    @CurrentUser('id') userId: string,
    @Body() updateServerDto: CreateServerDto,
	) {
    const result = await firstValueFrom(
      this.serversClient.send(
        { cmd: 'update-server' },
        { serverId, userId, updateServerDto },
      ),
    );
    return result;
  }

	@Delete(':serverId')
  async delete(
		@Param('serverId') serverId: string,
    @CurrentUser('id') userId: string,
	) {
    const result = await firstValueFrom(
      this.serversClient.send(
        { cmd: 'delete-server' },
        { serverId, userId },
      ),
    );
    return result;
  }

	@Patch(':serverId/invite-code')
  async invite(
		@Param('serverId') serverId: string,
    @CurrentUser('id') userId: string,
	) {
    const result = await firstValueFrom(
      this.serversClient.send(
        { cmd: 'invite-server' },
        { serverId, userId },
      ),
    );
    return result;
  }

	@Patch(':serverId/leave')
  async leave(
		@Param('serverId') serverId: string,
    @CurrentUser('id') userId: string,
	) {
    const result = await firstValueFrom(
      this.serversClient.send(
        { cmd: 'leave-server' },
        { serverId, userId },
      ),
    );
    return result;
  }
}
