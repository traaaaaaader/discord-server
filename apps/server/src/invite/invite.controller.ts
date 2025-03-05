import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { InviteService } from './invite.service';

@Controller()
export class InviteController {
	constructor(private readonly inviteService: InviteService) {}

	@MessagePattern({ cmd: 'invite-server' })
	async create(
		@Payload() data: { userId: string; inviteCode: string },
	) {
		return await this.inviteService.invite(data.userId, data.inviteCode);
	}

	@MessagePattern({ cmd: 'update-invite-server' })
  async invite(@Payload() data: { userId: string; serverId: string }) {
    return await this.inviteService.update(data.userId, data.serverId);
  }
}
