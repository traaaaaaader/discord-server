import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PrometheusModule } from "@willsoto/nestjs-prometheus";

import { AuthModule } from '@app/core-lib';
import { FilesModule } from '@app/files';

import {
  ConversationMessagesController,
  ConversationsController,
  MessagesController,
  AuthController,
  UsersController,
  ChannelsController,
  InviteController,
  MembersController,
  ServersController,
  FilesController,
} from './controllers';
import { ConfigModule, ConfigService } from '@nestjs/config';

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
    AuthModule,
    FilesModule,
    ClientsModule.registerAsync([
      {
        name:  process.env.RABBIT_MQ_CHAT_CLIENT,
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          name: config.getOrThrow<string>('RABBIT_MQ_CHAT_CLIENT'),
          transport: Transport.RMQ,
          options: {
            urls: [config.getOrThrow<string>('RABBIT_MQ_URI')],
            queue: config.getOrThrow<string>('RABBIT_MQ_CHAT_QUEUE'),
            queueOptions: { 
              durable: config.get('RABBIT_MQ_QUEUE_DURABLE', false)
            },
          },
        }),
      },
      {
        name:  process.env.RABBIT_MQ_CORE_CLIENT,
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          name: config.getOrThrow<string>('RABBIT_MQ_CORE_CLIENT'),
          transport: Transport.RMQ,
          options: {
            urls: [config.getOrThrow<string>('RABBIT_MQ_URI')],
            queue: config.getOrThrow<string>('RABBIT_MQ_CORE_QUEUE'),
            queueOptions: { 
              durable: config.get('RABBIT_MQ_QUEUE_DURABLE', false)
            },
          },
        }),
      },
      {
        name: process.env.RABBIT_MQ_SERVER_CLIENT,
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          name: config.getOrThrow<string>('RABBIT_MQ_SERVER_CLIENT'),
          transport: Transport.RMQ,
          options: {
            urls: [config.getOrThrow<string>('RABBIT_MQ_URI')],
            queue: config.getOrThrow<string>('RABBIT_MQ_SERVER_QUEUE'),
            queueOptions: { 
              durable: config.get('RABBIT_MQ_QUEUE_DURABLE', false)
            },
          },
        }),
      },
    ]),
  ],
  controllers: [
    ConversationMessagesController,
    ConversationsController,
    MessagesController,
    AuthController,
    UsersController,
    ChannelsController,
    InviteController,
    MembersController,
    ServersController,
    FilesController,
  ],
})
export class GatewayModule {}
