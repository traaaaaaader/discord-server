import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { CoreModule } from './core.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    CoreModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBIT_MQ_URI],
        queue: process.env.RABBIT_MQ_CORE_QUEUE,
        queueOptions: { durable: false },
      },
    },
  );

  await app.listen();
}
bootstrap();
