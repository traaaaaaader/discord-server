import { Module } from '@nestjs/common';

import { ChannelsModule } from './channels/channels.module';
import { MembersModule } from './members/members.module';
import { ServersModule } from './servers/servers.module';
import { UsersModule } from './users/users.module';
import { InviteModule } from './invite/invite.module';

@Module({
  imports: [
    ChannelsModule,
    InviteModule,
    MembersModule,
    ServersModule,
    UsersModule,
  ],
})
export class ServerModule {}
