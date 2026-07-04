import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as process from 'process';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Important for AWS: enable CORS to allow the frontend to interact with the backend
  app.enableCors();
  const port = process.env.PORT || 4000;
  app.setGlobalPrefix('v1');
  console.log(`Server running on http://0.0.0.0:${port}/v1`);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  // Important for AWS: listen on 0.0.0.0 to accept traffic from outside the container/server
  await app.listen(process.env.PORT || 4000, '0.0.0.0');
}
bootstrap();
