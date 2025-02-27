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
        name: 'CORE_CLIENT',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: 'core_queue',
          queueOptions: { durable: false },
        },
      },
      {
        name: 'CHAT_CLIENT',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: 'chat_queue',
          queueOptions: { durable: false },
        },
      },
      {
        name: 'SERVER_CLIENT',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: 'server_queue',
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
