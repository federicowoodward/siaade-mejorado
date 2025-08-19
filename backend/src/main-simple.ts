import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: ['http://localhost:4200'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.setGlobalPrefix('api');

  const port = 3000;
  await app.listen(port);
  console.log(`🚀 Backend running on: http://localhost:${port}`);
}

bootstrap().catch(error => {
  console.error('Error starting application:', error);
  process.exit(1);
});
