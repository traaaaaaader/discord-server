import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrometheusModule } from "@willsoto/nestjs-prometheus";
import { ConfigModule } from '@nestjs/config';

import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
    }),
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: {
        enabled: true,
      },
    }),
    UsersModule,
    AuthModule,
    JwtModule.register({}),
    HealthModule,
  ],
})
export class CoreModule {}
