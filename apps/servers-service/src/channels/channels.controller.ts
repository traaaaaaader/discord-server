import { Controller } from '@nestjs/common';
import { ChannelsService } from './channels.service';
import {
  CreateChannelPayload,
  DeleteChannelPayload,
  UpdateChannelPayload,
} from '@app/database';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @MessagePattern({ cmd: "create-channel" })
  async create(@Payload() payload: CreateChannelPayload) {
    return await this.channelsService.create(payload);
  }

  @MessagePattern({ cmd: "update-channel" })
  async update(@Payload() payload: UpdateChannelPayload) {
    return await this.channelsService.update(payload);
  }

  @MessagePattern({ cmd: "delete-channel" })
  async delete(@Payload() payload: DeleteChannelPayload) {
    return await this.channelsService.delete(payload);
  }
}
