import { NestFactory } from '@nestjs/core';
import { ServersModule } from './servers/servers.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(ServersModule);
  app.useGlobalPipes(new ValidationPipe());

  app.use(cookieParser());
  await app
    .listen(process.env.port ?? 3001)
    .then(() =>
      console.log(`Servers service start on ${process.env.port ?? 3001} port`),
    );
}
bootstrap();
