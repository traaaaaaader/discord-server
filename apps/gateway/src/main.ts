import { NestFactory } from '@nestjs/core';
import { GatewayModule } from './gateway.module';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import * as session from 'express-session';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const tempApp = await NestFactory.createApplicationContext(GatewayModule);
  const config = tempApp.get(ConfigService);
  await tempApp.close();

  const app = await NestFactory.create(GatewayModule);

  app.use(cookieParser());

  app.enableCors({
    origin: config.getOrThrow<string>('CLIENT_URL'),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(new ValidationPipe());

  await app.listen(config.getOrThrow<string>('PORT') ?? 3000);
}
bootstrap();
