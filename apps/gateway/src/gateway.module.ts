import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { AuthModule } from '@app/core-lib';
import { FilesModule } from '@app/files';

import {
  DirectMessagesController,
  MessagesController,
  AuthController,
  UsersController,
  ChannelsController,
  MembersController,
  ServersController,
  FilesController,
} from './controllers';

@Module({
  imports: [
    AuthModule,
    FilesModule,
    ClientsModule.register([
      {
        name: process.env.RABBIT_MQ_CHAT_CLIENT,
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBIT_MQ_URI],
          queue: process.env.RABBIT_MQ_CHAT_QUEUE,
          queueOptions: { durable: false },
        },
      },
      {
        name: process.env.RABBIT_MQ_CORE_CLIENT,
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBIT_MQ_URI],
          queue: process.env.RABBIT_MQ_CORE_QUEUE,
          queueOptions: { durable: false },
        },
      },
      {
        name: process.env.RABBIT_MQ_SERVER_CLIENT,
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBIT_MQ_URI],
          queue: process.env.RABBIT_MQ_SERVER_QUEUE,
          queueOptions: { durable: false },
        },
      },
    ]),
  ],
  controllers: [
    DirectMessagesController,
    MessagesController,
    AuthController,
    UsersController,
    ChannelsController,
    MembersController,
    ServersController,
    FilesController,
  ],
})
export class GatewayModule {}
