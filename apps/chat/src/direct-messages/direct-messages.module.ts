import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { PrismaModule } from '../prisma/prisma.module';
import { DirectMessagesController } from './direct-messages.controller';
import { DirectMessagesService } from './direct-messages.service';
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
  controllers: [DirectMessagesController],
  providers: [DirectMessagesService, ChatGateway],
})
export class DirectMessagesModule {}
