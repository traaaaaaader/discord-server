import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ChatModule } from './chat.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(ChatModule);

  const config = app.get(ConfigService);

  await app.connectMicroservice<MicroserviceOptions>(
    {
      transport: Transport.RMQ,
      options: {
        urls: [config.getOrThrow<string>('RABBIT_MQ_URI')],
        queue: config.getOrThrow<string>('RABBIT_MQ_CHAT_QUEUE'),
        queueOptions: { durable: false },
      },
    },
  );

  await app.startAllMicroservices();
  await app.listen(config.getOrThrow<string>('CHAT_PORT') || 3001);
}
bootstrap();
