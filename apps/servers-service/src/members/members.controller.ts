import { Controller, Body, Patch, Param, UseGuards, Delete } from '@nestjs/common';
import { JwtAccessGuard, CurrentUser } from '@app/auth';
import { MembersService } from './members.service';
import { UpdateMemberDto } from './dto/update-member.dto';


@UseGuards(JwtAccessGuard)
@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Delete(':memberId')
  async delete(
    req: Request,
    @Param('memberId') memberId: string,
    @CurrentUser('id') userId: string,
  ) {
    return await this.membersService.delete(req, memberId, userId);
  }

  @Patch(':memberId')
  async update(
    req: Request,
    @Param('memberId') memberId: string,
    @CurrentUser('id') userId: string,
    @Body() updateMemberDto: UpdateMemberDto,
  ) {
    return await this.membersService.update(req, memberId, userId, updateMemberDto);
  }
}
