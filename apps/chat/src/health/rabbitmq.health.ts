import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { connect, Connection } from 'amqplib';

@Injectable()
export class RabbitMQHealthIndicator extends HealthIndicator {
  private connection: Connection;

  constructor(private readonly amqpUrl: string) {
    super();
  }

  async isHealthy(): Promise<HealthIndicatorResult> {
    try {
      if (!this.connection) {
        this.connection = await connect(this.amqpUrl);
      }
      
      const channel = await this.connection.createChannel();
      await channel.close();
      
      return this.getStatus('rabbitmq', true);
    } catch (e) {
      return this.getStatus('rabbitmq', false, { message: e.message });
    }
  }

  async onApplicationShutdown() {
    if (this.connection) {
      await this.connection.close();
    }
  }
}