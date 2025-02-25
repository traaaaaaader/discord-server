import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { PrismaModule } from '../prisma/prisma.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { UsersModule } from '@app/users';
import { DirectMessagesController } from './direct-messages/direct-messages.controller';
import { DirectMessagesService } from './direct-messages/direct-messages.service';
import { MessagesService } from './messages/messages.service';
import { MessagesController } from './messages/messages.controller';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    ClientsModule.register([
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
    ]),
  ],
  controllers: [MessagesController, DirectMessagesController],
  providers: [ChatGateway, MessagesService, DirectMessagesService],
})
export class ChatModule {}
