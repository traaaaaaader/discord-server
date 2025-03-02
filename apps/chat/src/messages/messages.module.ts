import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { PrismaModule } from '../prisma/prisma.module';

import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { ChatGateway } from '../chat.gateway';

import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    ClientsModule.register([
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
  controllers: [MessagesController],
  providers: [MessagesService, ChatGateway],
})
export class MessagesModule {}
