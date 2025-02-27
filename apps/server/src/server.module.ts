import { Module } from '@nestjs/common';

import { ChannelsModule } from './channels/channels.module';
import { MembersModule } from './members/members.module';
import { ServersModule } from './servers/servers.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [ChannelsModule, MembersModule, ServersModule, UsersModule],
})
export class ServerModule {}
