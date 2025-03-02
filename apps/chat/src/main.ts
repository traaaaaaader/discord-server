import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ChatModule } from './chat.module';
import * as amqp from 'amqplib';

async function bootstrap() {
  const app = await NestFactory.create(ChatModule);

  const microserviceChat = await app.connectMicroservice<MicroserviceOptions>(
    {
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBIT_MQ_URI],
        queue: process.env.RABBIT_MQ_CHAT_QUEUE,
        queueOptions: { durable: false },
      },
    },
  );

  await app.startAllMicroservices();
  await app.listen(3001);
}
bootstrap();
