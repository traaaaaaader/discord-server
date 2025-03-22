import { NestFactory } from '@nestjs/core';
import { GatewayModule } from './gateway.module';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import * as session from 'express-session';
import * as fs from 'fs';
import IORedis from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { RedisStore } from 'connect-redis';

async function bootstrap() {
  const tempApp = await NestFactory.createApplicationContext(GatewayModule);
  const config = tempApp.get(ConfigService);
  await tempApp.close();

  const httpsOptions = {
    // key: fs.readFileSync(config.get('SSL_KEY_PATH')),
    // cert: fs.readFileSync(config.get('SSL_CERT_PATH')),
  };

  const app = await NestFactory.create(GatewayModule); // httpsOptiopns

  // const redis = new IORedis(config.getOrThrow('REDIS_URL'))

  app.use(cookieParser());

  app.enableCors({
    origin: config.getOrThrow<string>('CLIENT_URL'),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.use(
    session({
      secret: config.getOrThrow<string>('SESSION_SECRET'),
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: false,
        maxAge: 1000 * 60 * 60 * 24,
        sameSite: 'lax',
      },
      // store: new RedisStore({
      //   client: redis,
      //   prefix: config.getOrThrow<string>('SESSION_FOLDER'),
      // }),
    }),
  );

  app.useGlobalPipes(new ValidationPipe());

  await app.listen(config.getOrThrow<string>('PORT') ?? 3000);
}
bootstrap();
