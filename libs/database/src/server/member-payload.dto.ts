import { UpdateMemberDto } from './update-member.dto';

class BasePayload {
  memberId: string;
  serverId: string;
  userId: string;
}

export class UpdateMemberPayload extends BasePayload {
  updateMemberDto: UpdateMemberDto;
}

export class DeleteMemberPayload extends BasePayload {}
