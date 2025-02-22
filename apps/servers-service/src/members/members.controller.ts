import { Controller } from '@nestjs/common';
import { MembersService } from './members.service';
import { UpdateMemberPayload } from '@app/database';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { DeleteMemberPayload } from '@app/database';

@Controller()
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @MessagePattern({ cmd: 'get-member' })
  async getOne(@Payload() payload: { serverId: string; userId: string }) {
    return await this.membersService.getOne(payload.serverId, payload.userId);
  }

  @MessagePattern({ cmd: 'get-members' })
  async getAll(@Payload() payload: { serverId: string }) {
    return await this.membersService.getAll(payload.serverId);
  }

  @MessagePattern({ cmd: 'delete-member' })
  async delete(@Payload() payload: DeleteMemberPayload) {
    return await this.membersService.delete(payload);
  }

  @MessagePattern({ cmd: 'update-member' })
  async update(@Payload() payload: UpdateMemberPayload) {
    return await this.membersService.update(payload);
  }
}
