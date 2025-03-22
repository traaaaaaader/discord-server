import { Module } from '@nestjs/common';
import { PrometheusModule } from "@willsoto/nestjs-prometheus";
import { ConfigModule } from '@nestjs/config';

import { ChannelsModule } from './channels/channels.module';
import { MembersModule } from './members/members.module';
import { ServersModule } from './servers/servers.module';
import { UsersModule } from './users/users.module';
import { InviteModule } from './invite/invite.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
    }),
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: {
        enabled: true,
      },
    }),
    ChannelsModule,
    InviteModule,
    MembersModule,
    ServersModule,
    UsersModule,
    HealthModule,
  ],
})
export class ServerModule {}
