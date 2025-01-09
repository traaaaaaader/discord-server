import { NestFactory } from '@nestjs/core';
import { FilesServiceModule } from './files-service.module';

async function bootstrap() {
  const app = await NestFactory.create(FilesServiceModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
