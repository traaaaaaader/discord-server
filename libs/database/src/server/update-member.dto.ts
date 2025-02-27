import { MemberRole } from '@prisma/client';

export class UpdateMemberDto {
  role: MemberRole;
}
