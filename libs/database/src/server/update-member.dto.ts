import { MemberRole } from '@prisma/db-server';

export class UpdateMemberDto {
  role: MemberRole;
}
