import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { PrismaModule } from '../../prisma/prisma.module';
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
  controllers: [DirectMessagesController],
  providers: [DirectMessagesService, ChatGateway],
})
export class DirectMessagesModule {}
