import { Controller, Get } from '@nestjs/common';
import {
  HealthCheckService,
  HealthCheck,
} from '@nestjs/terminus';
import { PrismaHealthIndicator } from './prisma.health';
import { RabbitMQHealthIndicator } from './rabbitmq.health';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prismaHealth: PrismaHealthIndicator,
    private rabbitmqHealth: RabbitMQHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.prismaHealth.isHealthy(),
      () => this.rabbitmqHealth.isHealthy(),
    ]);
  }
}