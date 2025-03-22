import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { CoreModule } from './core.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(CoreModule);

  const config = app.get(ConfigService);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [config.getOrThrow<string>('RABBIT_MQ_URI')],
      queue: config.getOrThrow<string>('RABBIT_MQ_CORE_QUEUE'),
      queueOptions: { durable: false },
    },
  });

  await app.startAllMicroservices();
  await app.listen(config.get('CORE_PORT') || 3002);
}
bootstrap();
