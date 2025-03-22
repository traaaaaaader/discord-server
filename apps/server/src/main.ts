import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ServerModule } from './server.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(ServerModule);

  const config = app.get(ConfigService);
  
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [config.getOrThrow<string>('RABBIT_MQ_URI')],
      queue: config.getOrThrow<string>('RABBIT_MQ_SERVER_QUEUE'),
      queueOptions: { durable: false },
    },
  });

  await app.startAllMicroservices();
  await app.listen(config.get('SERVER_PORT') || 3003);
}
bootstrap();
