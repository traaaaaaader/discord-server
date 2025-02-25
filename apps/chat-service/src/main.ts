import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ChatModule } from './chat.module';

async function bootstrap() {
  const app = await NestFactory.create(ChatModule);

  const microserviceChat = await app.connectMicroservice<MicroserviceOptions>(
    {
      transport: Transport.RMQ,
      options: {
        urls: ['amqp://localhost:5672'],
        queue: 'chat_queue',
        queueOptions: { durable: false },
      },
    },
  );

  await app.startAllMicroservices();
  await app.listen(3001);
}
bootstrap();
