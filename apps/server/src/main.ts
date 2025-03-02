import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ServerModule } from './server.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    ServerModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBIT_MQ_URI],
        queue: process.env.RABBIT_MQ_SERVER_QUEUE,
        queueOptions: { durable: false },
      },
    },
  );

  await app.listen();
}
bootstrap();
