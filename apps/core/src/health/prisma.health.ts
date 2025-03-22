import { Injectable } from '@nestjs/common';
import { 
  HealthIndicatorResult,
  HealthIndicator,
  HealthCheckError
} from '@nestjs/terminus';
import { PrismaService } from '@app/core-lib';

@Injectable()
export class PrismaHealthIndicator extends HealthIndicator  {
  constructor(
    private readonly prismaService: PrismaService,
  ) {
    super();
  }

  async isHealthy(): Promise<HealthIndicatorResult> {
    try {
      await this.prismaService.$queryRaw`SELECT 1`;
      return this.getStatus('database', true);
    } catch (e) {
      return this.getStatus('database', false, { message: e.message });
    }
  }
}