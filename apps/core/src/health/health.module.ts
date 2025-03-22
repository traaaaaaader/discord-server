import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { RabbitMQHealthIndicator } from './rabbitmq.health';
import { HealthController } from './health.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '@app/core-lib';
import { PrismaHealthIndicator } from './prisma.health';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
    }),
    PrismaModule,
    TerminusModule,
  ],
  controllers: [HealthController],
  providers: [
    PrismaHealthIndicator,
    {
      provide: RabbitMQHealthIndicator,
      useFactory: (config: ConfigService) =>
        new RabbitMQHealthIndicator(config.getOrThrow<string>('RABBIT_MQ_URI')),
      inject: [ConfigService],
    },
  ],
})
export class HealthModule {}
