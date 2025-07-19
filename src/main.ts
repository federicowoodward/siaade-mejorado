import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';  // Asegúrate de importar el módulo principal
import { ValidationPipe } from '@nestjs/common';  // Para validar los DTOs (Data Transfer Objects)

async function bootstrap() {
  const app = await NestFactory.create(AppModule);  // Crear la aplicación usando el módulo principal

  // Usar un pipe global para validar los datos de entrada con class-validator
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,  // Elimina las propiedades no validadas en el DTO
    forbidNonWhitelisted: true,  // Lanza un error si hay propiedades no permitidas
  }));

  // Habilitar CORS (si necesitas que tu API sea accesible desde otros dominios)
  app.enableCors();

  // Establecer el puerto en el que el servidor escuchará
  await app.listen(3000);  // Cambia el puerto si es necesario
  console.log('Application is running on: http://localhost:3000');
}

bootstrap();