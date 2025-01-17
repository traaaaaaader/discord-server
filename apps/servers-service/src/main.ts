import { NestFactory } from '@nestjs/core';
import { ServersModule } from './servers/servers.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ChannelsModule } from './channels/channels.module';
import { MembersModule } from './members/members.module';

async function bootstrap() {
  const serverApp = await NestFactory.createMicroservice<MicroserviceOptions>(
    ServersModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: ['amqp://localhost:5672'],
        queue: 'servers_queue',
        queueOptions: { durable: false },
      },
    },
  );

  const channelApp = await NestFactory.createMicroservice<MicroserviceOptions>(
    ChannelsModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: ['amqp://localhost:5672'],
        queue: 'channels_queue',
        queueOptions: { durable: false },
      },
    },
  );

  const memberApp = await NestFactory.createMicroservice<MicroserviceOptions>(
    MembersModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: ['amqp://localhost:5672'],
        queue: 'members_queue',
        queueOptions: { durable: false },
      },
    },
  );

  await Promise.all([serverApp.listen(), channelApp.listen(), memberApp.listen()]);
}
bootstrap();
