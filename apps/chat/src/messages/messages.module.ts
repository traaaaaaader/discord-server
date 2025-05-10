import { forwardRef, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { PrismaModule } from '../prisma/prisma.module';

import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { ChatGateway } from '../chat.gateway';

import { UsersModule } from '../users/users.module';
import { ConfigService } from '@nestjs/config';
import { ChatModule } from '../chat.module';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    forwardRef(() => ChatModule),
    ClientsModule.registerAsync([
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
              durable: config.get('RABBIT_MQ_QUEUE_DURABLE', false),
            },
          },
        }),
      },
    ]),
  ],
  controllers: [MessagesController],
  providers: [MessagesService],
})
export class MessagesModule {}
