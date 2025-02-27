import { CreateChannelDto } from './create-channel.dto';
import { UpdateChannelDto } from './update-channel.dto';

class BasePayload {
  userId: string;
  serverId: string;
}

export class CreateChannelPayload extends BasePayload {
  createChannelDto: CreateChannelDto;
}

export class UpdateChannelPayload extends BasePayload {
  channelId: string;
  updateChannelDto: UpdateChannelDto;
}

export class DeleteChannelPayload extends BasePayload {
  channelId: string;
}
