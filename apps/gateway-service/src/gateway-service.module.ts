import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AuthModule } from '@app/auth';
import {
  AuthController,
  ServersController,
  ChannelsController,
  MembersController,
} from './controllers';
import { MessagesController } from './controllers/messages.controller';
import { DirectMessagesController } from './controllers/direct-messages.controller';

@Module({
  imports: [
    AuthModule,
    ClientsModule.register([
      {
        name: 'AUTH_CLIENT',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: 'auth_queue',
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
        name: 'SERVERS_CLIENT',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: 'servers_queue',
          queueOptions: { durable: false },
        },
      },
      {
        name: 'CHANNELS_CLIENT',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: 'channels_queue',
          queueOptions: { durable: false },
        },
      },
      {
        name: 'MEMBERS_CLIENT',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: 'members_queue',
          queueOptions: { durable: false },
        },
      },
    ]),
  ],
  controllers: [
    ServersController,
    AuthController,
    ChannelsController,
    MembersController,
    MessagesController,
    DirectMessagesController,
  ],
})
export class GatewayServiceModule {}
