import {
  Controller,
  Body,
  Patch,
  Param,
  UseGuards,
  Delete,
  Inject,
  Query,
} from '@nestjs/common';
import { JwtAccessGuard, CurrentUser } from '@app/auth';
import { UpdateMemberDto } from '@app/database';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@UseGuards(JwtAccessGuard)
@Controller('members')
export class MembersController {
  constructor(
    @Inject('MEMBERS_CLIENT') private readonly membersClient: ClientProxy,
  ) {}

  @Delete(':memberId')
  async delete(
    @Query() query,
    @Param('memberId') memberId: string,
    @CurrentUser('id') userId: string,
  ) {
    const serverId = query.serverId;

    const result = await firstValueFrom(
      this.membersClient.send(
        { cmd: 'delete-member' },
        { userId, serverId, memberId },
      ),
    );
    return result;
  }

  @Patch(':memberId')
  async update(
    @Query() query,
    @Param('memberId') memberId: string,
    @CurrentUser('id') userId: string,
    @Body() updateMemberDto: UpdateMemberDto,
  ) {
    const serverId = query.serverId;

    const result = await firstValueFrom(
      this.membersClient.send(
        { cmd: 'delete-member' },
        { userId, serverId, memberId, updateMemberDto },
      ),
    );
    return result;
  }
}
