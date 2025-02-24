import { NestFactory } from '@nestjs/core';
import { GatewayServiceModule } from './gateway-service.module';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import * as session from 'express-session';

async function bootstrap() {
  const app = await NestFactory.create(GatewayServiceModule);

  app.use(cookieParser());

  app.enableCors({
    origin: 'http://localhost:1420',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.use(
    session({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24,
      },
    }),
  );

  app.useGlobalPipes(new ValidationPipe());

  await app.listen(process.env.port ?? 3000);
}
bootstrap();
