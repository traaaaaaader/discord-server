import { NestFactory } from '@nestjs/core';
import { ServersServiceModule } from './servers-service.module';

async function bootstrap() {
  const app = await NestFactory.create(ServersServiceModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
